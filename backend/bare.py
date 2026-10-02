"""Baseline mode: same schema text, one generation, execute whatever comes back."""

import config
import llm
import prompts
import schema
from schemas import AskResponse, Step
from snowflake_client import run_sql


def run(question: str, limit: int = config.ROW_LIMIT) -> AskResponse:
    """Schema -> one prompt -> one execution. No grounding notes, no validation, no retry."""
    result = AskResponse(mode="bare", question=question, attempts=1)
    steps = result.steps

    schema_text = schema.get_schema_text()
    steps.append(Step(name="schema_grounding", status="ok", detail=f"Loaded {len(schema.load()['tables'])} tables"))

    prompt = prompts.GENERATE.format(schema=schema_text, notes="", question=question)
    result.sql = llm.extract_sql(llm.complete(prompt))
    steps.append(Step(name="generate", status="ok", detail="attempt 1"))

    try:
        result.columns, result.rows = run_sql(result.sql, limit)
        steps.append(Step(name="execute", status="ok", detail=f"{len(result.rows)} rows"))
    except Exception as exc:
        result.error = error_text(exc)
        steps.append(Step(name="execute", status="error", detail=result.error))
    return result


def error_text(exc: Exception) -> str:
    """Snowflake errors span lines (position first, then the cause); keep both on one line."""
    return " ".join(str(exc).split()) or type(exc).__name__
