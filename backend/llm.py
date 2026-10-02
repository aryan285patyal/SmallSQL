"""Thin wrapper around Snowflake Cortex COMPLETE so the model is configured in one place.

config.CORTEX_MODEL must be an open-weight model of 10B parameters or fewer (hackathon rule).
"""

import config


def complete(prompt: str) -> str:
    """Send a prompt to the Cortex-hosted model and return the raw text reply.

    TODO(backend): on snowflake_client.get_connection(), run
        SELECT SNOWFLAKE.CORTEX.COMPLETE(%s, %s)   with params (config.CORTEX_MODEL, prompt)
    and return the single value. Bind the prompt as a parameter; never format it into the SQL.
    """
    raise NotImplementedError("llm.complete")


def extract_sql(text: str) -> str:
    """Strip markdown fences / commentary from a model reply, leaving just the SQL."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else ""
        text = text.rsplit("```", 1)[0]
    return text.strip().rstrip(";")
