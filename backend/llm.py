"""Thin wrapper around Snowflake Cortex so the model is configured in one place."""

import json
import re

import config
import snowflake_client

# The options form of COMPLETE lets us pin temperature to 0 for repeatable benchmark runs.
_COMPLETE = """SELECT SNOWFLAKE.CORTEX.COMPLETE(
    %s,
    ARRAY_CONSTRUCT(OBJECT_CONSTRUCT('role', 'user', 'content', %s)),
    OBJECT_CONSTRUCT('temperature', 0, 'max_tokens', %s)
)"""

_FENCED = re.compile(r"```(?:sql)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)
_STATEMENT = re.compile(r"\b(WITH|SELECT)\b.*", re.DOTALL | re.IGNORECASE)


def complete(prompt: str) -> str:
    """Send a prompt to the model and return the raw text reply."""
    params = (config.CORTEX_MODEL, prompt, config.LLM_MAX_TOKENS)
    _, rows = snowflake_client.run_trusted(_COMPLETE, params, timeout=config.LLM_TIMEOUT_S)
    reply = json.loads(rows[0][0])
    return reply["choices"][0]["messages"]


def extract_sql(text: str) -> str:
    """Strip markdown fences / commentary from a model reply, leaving just the SQL."""
    fenced = _FENCED.search(text)
    if fenced:
        text = fenced.group(1)
    else:
        statement = _STATEMENT.search(text)
        if statement:
            text = statement.group(0)
    return text.strip().rstrip(";").strip()
