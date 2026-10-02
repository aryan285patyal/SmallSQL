"""Read-only Snowflake access. The only module that talks to Snowflake."""

import config


def run_sql(sql: str, limit: int = config.ROW_LIMIT) -> tuple[list[str], list[list]]:
    """Execute a single, already-validated SELECT and return (columns, rows).

    TODO(backend):
    - connect with config.SNOWFLAKE (read-only role)
    - enforce `limit` rows and config.QUERY_TIMEOUT_S
    - raise on Snowflake errors so the harness can feed the message back to the model
    """
    raise NotImplementedError("snowflake_client.run_sql")
