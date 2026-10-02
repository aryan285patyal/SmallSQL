"""Baseline mode: same schema text, one generation, execute whatever comes back."""

from schemas import AskResponse


def run(question: str) -> AskResponse:
    """TODO(backend): schema -> prompts.GENERATE -> llm.complete -> run_sql. No validation, no retry.

    Record steps (schema_grounding, generate, execute) and set attempts=1.
    """
    raise NotImplementedError("bare.run")
