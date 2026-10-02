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

# Key pairs that may be joined. The validator rejects any other key-to-key join.
JOIN_KEYS = [
    ("ORDERS.O_CUSTKEY", "CUSTOMER.C_CUSTKEY"),
    ("LINEITEM.L_ORDERKEY", "ORDERS.O_ORDERKEY"),
    ("LINEITEM.L_PARTKEY", "PART.P_PARTKEY"),
    ("LINEITEM.L_SUPPKEY", "SUPPLIER.S_SUPPKEY"),
    ("PARTSUPP.PS_PARTKEY", "PART.P_PARTKEY"),
    ("PARTSUPP.PS_SUPPKEY", "SUPPLIER.S_SUPPKEY"),
    ("LINEITEM.L_PARTKEY", "PARTSUPP.PS_PARTKEY"),
    ("LINEITEM.L_SUPPKEY", "PARTSUPP.PS_SUPPKEY"),
    ("CUSTOMER.C_NATIONKEY", "NATION.N_NATIONKEY"),
    ("SUPPLIER.S_NATIONKEY", "NATION.N_NATIONKEY"),
    ("CUSTOMER.C_NATIONKEY", "SUPPLIER.S_NATIONKEY"),
    ("NATION.N_REGIONKEY", "REGION.R_REGIONKEY"),
]

# Two-column keys: both pairs must appear together.
COMPOSITE_KEYS = [
    (("LINEITEM.L_PARTKEY", "PARTSUPP.PS_PARTKEY"), ("LINEITEM.L_SUPPKEY", "PARTSUPP.PS_SUPPKEY")),
]

_RULES = """Business terms:
- Revenue is SUM(L_EXTENDEDPRICE * (1 - L_DISCOUNT)).
- The value of an order is O_TOTALPRICE. What a customer spent is the sum of O_TOTALPRICE over their orders. C_ACCTBAL is an account balance, not spending.
- A line item is late when L_SHIPDATE > L_COMMITDATE. It is returned when L_RETURNFLAG = 'R'.
- Inventory value is PS_SUPPLYCOST * PS_AVAILQTY.
- An urgent order has O_ORDERPRIORITY = '1-URGENT'; high priority is '2-HIGH'.

Rules:
- Use only the tables and columns listed above. Never invent a column.
- Every column name keeps its table prefix: C_, O_, L_, P_, PS_, S_, N_, R_.
- Text values are stored exactly as shown in the value lists. Match them exactly.
- Date columns are DATE type; use YEAR(col) to filter by year.
- Never add a filter the question does not ask for.
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
    join_keys = "\n".join(f"- {left} = {right}" for left, right in JOIN_KEYS)
    return f"Join keys:\n{join_keys}\n\nValues these columns can take (filter on one only when the question asks for it):\n{samples}\n\n{_RULES}\n"
