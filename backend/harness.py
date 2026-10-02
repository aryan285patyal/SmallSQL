"""The harness: schema grounding -> generate -> validate -> execute -> retry with feedback.

This is the core of the project. Every stage appends a Step so the UI can show the loop.
"""

from schemas import AskResponse, Step


def validate_sql(sql: str) -> str | None:
    """Return None if `sql` is exactly one SELECT over known tables, else an error message.

    TODO(backend): parse with sqlglot (dialect="snowflake"), reject non-SELECT / multiple
    statements, reject unknown tables or columns where detectable.
    """
    raise NotImplementedError("harness.validate_sql")


def run(question: str) -> AskResponse:
    """TODO(backend): up to config.MAX_ATTEMPTS attempts:
    generate -> validate -> execute; on failure feed prompts.FIX back and loop.
    """
    steps: list[Step] = []
    raise NotImplementedError("harness.run")
