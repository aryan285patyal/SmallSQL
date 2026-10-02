"""Schema grounding: a compact text description of TPCH_SF1, built once and cached."""

import json

import config
import snowflake_client

_COLUMNS_SQL = """SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = %s
ORDER BY TABLE_NAME, ORDINAL_POSITION"""

# Low-cardinality columns whose exact values the model cannot guess.
_SAMPLE_COLUMNS = {
    "CUSTOMER": ["C_MKTSEGMENT"],
    "ORDERS": ["O_ORDERSTATUS", "O_ORDERPRIORITY"],
    "LINEITEM": ["L_RETURNFLAG", "L_LINESTATUS", "L_SHIPMODE", "L_SHIPINSTRUCT"],
    "REGION": ["R_NAME"],
    "NATION": ["N_NAME"],
}

_JOIN_KEYS = """Join keys:
- ORDERS.O_CUSTKEY = CUSTOMER.C_CUSTKEY
- LINEITEM.L_ORDERKEY = ORDERS.O_ORDERKEY
- LINEITEM.L_PARTKEY = PART.P_PARTKEY
- LINEITEM.L_SUPPKEY = SUPPLIER.S_SUPPKEY
- PARTSUPP.PS_PARTKEY = PART.P_PARTKEY and PARTSUPP.PS_SUPPKEY = SUPPLIER.S_SUPPKEY
- CUSTOMER.C_NATIONKEY = NATION.N_NATIONKEY
- SUPPLIER.S_NATIONKEY = NATION.N_NATIONKEY
- NATION.N_REGIONKEY = REGION.R_REGIONKEY"""

_RULES = """Rules:
- Use only the tables and columns listed above. Never invent a column.
- Text values are stored exactly as shown in the sample values. Match them exactly.
- Date columns are DATE type; use YEAR(col) to filter by year. Filter by date only when the question mentions one.
- Revenue of a line item is L_EXTENDEDPRICE * (1 - L_DISCOUNT).
- What a customer spent is the sum of O_TOTALPRICE over their orders. C_ACCTBAL is an account balance, not spending.
- Join only the tables the question needs.
- Select only the columns the question asks for. Never add LIMIT unless the question asks for a top N."""

_cache: dict | None = None


def _build() -> dict:
    """Query Snowflake for the columns and sample values. Runs once; the result is saved to disk."""
    _, rows = snowflake_client.run_trusted(_COLUMNS_SQL, (config.SNOWFLAKE["schema"],))
    tables: dict[str, list] = {}
    for table, column, data_type in rows:
        tables.setdefault(table, []).append([column, data_type])

    samples = {}
    for table, columns in _SAMPLE_COLUMNS.items():
        for column in columns:
            _, values = snowflake_client.run_trusted(f"SELECT DISTINCT {column} FROM {table} ORDER BY 1 LIMIT 30")
            samples[f"{table}.{column}"] = [row[0].strip() for row in values]
    return {"dataset": config.DATASET, "tables": tables, "samples": samples}


def load() -> dict:
    """The cached schema: {"tables": {table: [[column, type], ...]}, "samples": {"T.COL": [values]}}."""
    global _cache
    if _cache is None:
        path = config.SCHEMA_CACHE_PATH
        if path.exists():
            _cache = json.loads(path.read_text())
        else:
            _cache = _build()
            path.write_text(json.dumps(_cache, indent=2))
    return _cache


def columns_by_table() -> dict[str, set[str]]:
    return {table: {column for column, _ in columns} for table, columns in load()["tables"].items()}


def get_schema_text() -> str:
    """One line per table with column names and types.

    Both bare and harness mode receive this same text (fair baseline rule).
    """
    lines = []
    for table, columns in load()["tables"].items():
        lines.append(f"{table}({', '.join(f'{name} {data_type}' for name, data_type in columns)})")
    return "\n".join(lines)


def get_grounding_notes() -> str:
    """What the harness adds on top of the schema text: join keys, sample values and dialect rules."""
    samples = "\n".join(f"- {column}: {', '.join(values)}" for column, values in load()["samples"].items())
    return f"{_JOIN_KEYS}\n\nSample values:\n{samples}\n\n{_RULES}\n"
