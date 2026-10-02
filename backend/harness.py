"""The harness: schema grounding -> generate -> validate -> execute -> retry with feedback -> vote.

This is the core of the project. Every stage appends a Step so the UI can show the loop.
"""

from collections import Counter
from concurrent.futures import ThreadPoolExecutor

from sqlglot import exp

import config
import llm
import prompts
import schema
from bare import error_text
from compare import normalize
from schemas import AskResponse, Step
from snowflake_client import parse_select, run_sql


def validate_sql(sql: str) -> str | None:
    """Return None if `sql` is exactly one SELECT over known tables and columns, else an error message.

    The message is written for the model: it names the bad identifier and lists the real columns.
    """
    try:
        tree = parse_select(sql)
    except ValueError as exc:
        return str(exc)

    known = schema.columns_by_table()
    cte_names = {cte.alias_or_name.upper() for cte in tree.find_all(exp.CTE)}

    # alias (or bare table name) -> real table, for checking qualified columns
    aliases: dict[str, str] = {}
    for table in tree.find_all(exp.Table):
        name = table.name.upper()
        if name in cte_names:
            continue
        if name not in known:
            return f"unknown table '{table.name}'. Available tables: {', '.join(known)}"
        aliases[table.alias_or_name.upper()] = name

    # names the query defines itself (SELECT aliases, CTE and subquery outputs)
    defined = {alias.alias.upper() for alias in tree.find_all(exp.Alias)}
    in_query = set().union(*(known[table] for table in aliases.values()))

    # Report every bad column at once, with the closest real name, so one retry can fix them all.
    problems = []
    for column in tree.find_all(exp.Column):
        name, qualifier = column.name.upper(), column.table.upper()
        if name in defined:
            continue
        table = aliases.get(qualifier)
        if (table and name in known[table]) or (not table and name in in_query):
            continue
        if not name:
            continue
        owners = [other for other in known if name in known[other]]
        guesses = sorted(c for t in ([table] if table else aliases.values()) for c in known[t] if c.endswith("_" + name))
        if guesses:
            hint = f"did you mean {guesses[0]}?"
        elif owners:
            hint = f"it is a column of {owners[0]}: join {owners[0]} to use it."
        elif similar := sorted(f"{t}.{c}" for t in known for c in known[t] if "_" in name and c.split("_", 1)[1] == name.split("_", 1)[1]):
            hint = f"similar columns: {', '.join(similar)}. Join through the table that has it."
        else:
            hint = f"{table} columns: {', '.join(sorted(known[table]))}" if table else "use only columns from the schema."
        problem = f"column '{column.name}' does not exist in {table or 'the tables this query reads'}; {hint}"
        if problem not in problems:
            problems.append(problem)
    if problems:
        return " | ".join(problems[:8])

    # A join on the wrong keys runs fine and returns wrong numbers, so catch it here.
    def owner(column: exp.Column) -> str | None:
        """'TABLE.COLUMN' for a key column of a real table, else None."""
        name = column.name.upper()
        table = aliases.get(column.table.upper()) or next((t for t in aliases.values() if name in known[t]), None)
        return f"{table}.{name}" if table and name.endswith("KEY") and name in known[table] else None

    allowed = {frozenset(pair) for pair in schema.JOIN_KEYS}
    used = set()
    for equality in tree.find_all(exp.EQ):
        left, right = equality.this, equality.expression
        if not (isinstance(left, exp.Column) and isinstance(right, exp.Column)):
            continue
        pair = frozenset({owner(left), owner(right)})
        if None in pair or len({key.split(".")[0] for key in pair}) < 2:
            continue
        if pair not in allowed:
            valid = "; ".join(f"{a} = {b}" for a, b in schema.JOIN_KEYS)
            return f"wrong join: {' = '.join(sorted(pair))} is not a key relationship. Valid joins: {valid}"
        used.add(pair)

    # A two-column key joined on one column alone multiplies rows.
    for first, second in schema.COMPOSITE_KEYS:
        if (frozenset(first) in used) != (frozenset(second) in used):
            return (f"incomplete join: {first[0].split('.')[0]} and {first[1].split('.')[0]} must be joined on both "
                    f"{' = '.join(first)} and {' = '.join(second)}, or not joined at all.")
    return None


def critique(question: str, sql: str, columns: list[str], rows: list[list]) -> str | None:
    """Sanity-check a result that executed. Returns a reason if it looks wrong, else None.

    An empty result usually means a filter value that matches nothing. Asking the model to
    judge its own answer is off by default: small models reject correct queries too often.
    """
    if not rows:
        return "The query returned no rows. Check the filter values against the value lists."
    if not config.LLM_CRITIQUE:
        return None
    preview = "\n".join([" | ".join(columns)] + [" | ".join(str(cell) for cell in row) for row in rows[:5]])
    verdict = llm.complete(prompts.CRITIQUE.format(question=question, sql=sql, preview=preview)).strip()
    return None if verdict.upper().startswith("YES") else verdict


def run(question: str, *, validation: bool = True, retry: bool = True, limit: int = config.ROW_LIMIT) -> AskResponse:
    """Run one question through the harness.

    The two flags exist for the benchmark ablations; the full harness has both on.
    - validation: check the SQL before running it and feed validation errors back to the model
    - retry: also feed Snowflake execution errors back, sanity-check the result, and vote
    """
    if not retry or config.VOTE_CANDIDATES < 2:
        return _solve(question, validation=validation, retry=retry, limit=limit)

    # Self-consistency vote. A query that runs can still answer the wrong question, and no
    # check on a single query can see that. So write several candidates in parallel (the
    # first at temperature 0, the rest warmer for variety) and keep the result most agree on.
    temperatures = [0.0] + [config.VOTE_TEMPERATURE] * (config.VOTE_CANDIDATES - 1)
    with ThreadPoolExecutor(len(temperatures)) as pool:
        candidates = list(pool.map(lambda t: _solve(question, validation=True, retry=True, limit=limit, temperature=t), temperatures))

    primary = candidates[0]
    answered = [c for c in candidates if c.error is None]
    if not answered:
        return primary
    votes = Counter(repr(normalize(c.rows)) for c in answered)
    top, count = votes.most_common(1)[0]
    # The temperature-0 candidate wins ties.
    winner = primary if primary.error is None and votes[repr(normalize(primary.rows))] == count else next(c for c in answered if repr(normalize(c.rows)) == top)

    detail = f"{count} of {len(candidates)} candidates agree"
    if winner is not primary:
        primary.sql, primary.columns, primary.rows, primary.error = winner.sql, winner.columns, winner.rows, None
        detail += "; replaced the first candidate's answer"
    primary.steps.append(Step(name="vote", status="ok", detail=detail))
    return primary


def _solve(question: str, *, validation: bool, retry: bool, limit: int, temperature: float = 0.0) -> AskResponse:
    """One candidate: generate -> validate -> execute, feeding errors back for up to MAX_ATTEMPTS."""
    result = AskResponse(mode="harness", question=question)
    steps = result.steps

    context = {"schema": schema.get_schema_text(), "notes": schema.get_grounding_notes(), "question": question}
    steps.append(Step(name="schema_grounding", status="ok", detail=f"Loaded {len(schema.load()['tables'])} tables, join keys and sample values"))

    max_attempts = config.MAX_ATTEMPTS if validation else 1
    prompt = prompts.GENERATE.format(**context)
    accepted = None  # a result that executed fine but the critique questioned
    critiqued = False

    for attempt in range(1, max_attempts + 1):
        result.attempts = attempt
        sql = llm.extract_sql(llm.complete(prompt, temperature))
        result.sql = sql
        steps.append(Step(name="generate", status="ok", detail=f"attempt {attempt}"))

        error, can_retry = None, True
        if validation:
            error = validate_sql(sql)
            steps.append(Step(name="validate", status="error" if error else "ok", detail=error or "single SELECT, known tables, columns and join keys"))

        if error is None:
            try:
                columns, rows = run_sql(sql, limit)
                steps.append(Step(name="execute", status="ok", detail=f"{len(rows)} rows"))
            except Exception as exc:
                error, can_retry = error_text(exc), retry
                steps.append(Step(name="execute", status="error", detail=error))

        if error is None:
            last_attempt = attempt == max_attempts
            reason = None
            if retry and not critiqued and not last_attempt:
                critiqued = True
                reason = critique(question, sql, columns, rows)
                steps.append(Step(name="critique", status="error" if reason else "ok", detail=reason or "result is not empty"))
            if reason is None:
                result.columns, result.rows, result.error = columns, rows, None
                return result
            accepted = (sql, columns, rows)
            error = f"The query ran but does not answer the question. {reason}"

        result.error = error
        if not can_retry or attempt == max_attempts:
            break
        steps.append(Step(name="retry", status="ok", detail="fed error back to model"))
        prompt = prompts.FIX.format(sql=sql, error=error, **context)

    # The critique is only a second opinion: if its retry did not produce a working
    # query, fall back to the one that ran.
    if accepted:
        result.sql, result.columns, result.rows = accepted
        result.error = None
        steps.append(Step(name="critique", status="skipped", detail="kept the earlier result that executed"))
    return result
