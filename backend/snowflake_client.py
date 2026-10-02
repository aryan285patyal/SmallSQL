"""Snowflake access: the only module that opens connections.

Used for two things: running validated SELECTs on TPCH_SF1, and Cortex COMPLETE calls (llm.py).
"""

import config


def get_connection():
    """Return a shared snowflake.connector connection built from config.SNOWFLAKE.

    TODO(backend): create once and reuse (read-only role that also has SNOWFLAKE.CORTEX_USER).
    """
    raise NotImplementedError("snowflake_client.get_connection")


def run_sql(sql: str, limit: int = config.ROW_LIMIT) -> tuple[list[str], list[list]]:
    """Execute a single, already-validated SELECT and return (columns, rows).

    TODO(backend):
    - run on get_connection()
    - enforce `limit` rows and config.QUERY_TIMEOUT_S
    - raise on Snowflake errors so the harness can feed the message back to the model
    """
    raise NotImplementedError("snowflake_client.run_sql")
