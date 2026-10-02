"""Read-only Snowflake access. The only module that talks to Snowflake."""

import threading
from datetime import date, datetime, time
from decimal import Decimal

import snowflake.connector
import sqlglot
from sqlglot import exp

import config

# One connection per thread, so /api/ask requests and benchmark workers run in parallel.
_local = threading.local()

_WRITE_NAMES = ["Insert", "Update", "Delete", "Merge", "Create", "Drop", "Alter", "AlterTable", "TruncateTable", "Command", "Copy", "Use", "Set"]
_WRITE_NODES = tuple(getattr(exp, name) for name in _WRITE_NAMES if hasattr(exp, name))


def parse_select(sql: str) -> exp.Expression:
    """Parse `sql` and return its tree, or raise ValueError unless it is exactly one SELECT."""
    try:
        statements = [s for s in sqlglot.parse(sql, dialect="snowflake") if s is not None]
    except sqlglot.errors.SqlglotError as exc:
        raise ValueError(f"SQL could not be parsed: {str(exc).splitlines()[0]}") from exc
    if len(statements) != 1:
        raise ValueError(f"expected exactly one SQL statement, got {len(statements)}")
    tree = statements[0]
    if not isinstance(tree, exp.Query) or tree.find(*_WRITE_NODES):
        raise ValueError("only a single SELECT statement is allowed")
    return tree


def _connection():
    conn = getattr(_local, "conn", None)
    if conn is None or conn.is_closed():
        settings = {key: value for key, value in config.SNOWFLAKE.items() if value}
        conn = snowflake.connector.connect(**settings, session_parameters={"QUERY_TAG": "smallsql"})
        _local.conn = conn
    return conn


def _plain(value):
    """Make a Snowflake cell JSON-friendly."""
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, (bytes, bytearray)):
        return value.hex()
    return value


def run_trusted(sql: str, params=None, limit: int | None = None, timeout: int = config.QUERY_TIMEOUT_S):
    """Run SQL written by us (schema lookups, Cortex calls). Never pass model output here."""
    with _connection().cursor() as cursor:
        cursor.execute(sql, params, timeout=timeout)
        rows = cursor.fetchall() if limit is None else cursor.fetchmany(limit)
        columns = [col[0] for col in cursor.description]
    return columns, [[_plain(cell) for cell in row] for row in rows]


def run_sql(sql: str, limit: int = config.ROW_LIMIT) -> tuple[list[str], list[list]]:
    """Execute a single SELECT and return (columns, rows), capped at `limit` rows.

    Every mode goes through the single-SELECT guard, including bare mode, so nothing
    but a read ever reaches Snowflake. Raises on any error so the harness can feed
    the message back to the model.
    """
    parse_select(sql)
    return run_trusted(sql, limit=limit)
