"""All settings in one place, loaded from the repo-root .env file."""

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

# Model (Snowflake Cortex COMPLETE, open-weight only)
CORTEX_MODEL = os.getenv("CORTEX_MODEL", "llama3.1-8b")

# Snowflake
SNOWFLAKE = {
    "account": os.getenv("SNOWFLAKE_ACCOUNT", ""),
    "user": os.getenv("SNOWFLAKE_USER", ""),
    "password": os.getenv("SNOWFLAKE_PASSWORD", ""),
    "role": os.getenv("SNOWFLAKE_ROLE", ""),
    "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE", ""),
    "database": os.getenv("SNOWFLAKE_DATABASE", "SNOWFLAKE_SAMPLE_DATA"),
    "schema": os.getenv("SNOWFLAKE_SCHEMA", "TPCH_SF1"),
}
DATASET = f"{SNOWFLAKE['database']}.{SNOWFLAKE['schema']}"

# Harness / execution limits
MAX_ATTEMPTS = int(os.getenv("MAX_ATTEMPTS", "3"))
ROW_LIMIT = int(os.getenv("ROW_LIMIT", "100"))
QUERY_TIMEOUT_S = int(os.getenv("QUERY_TIMEOUT_S", "30"))

# API
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# Benchmark files
QUESTIONS_PATH = ROOT / "benchmark" / "questions.json"
RESULTS_PATH = ROOT / "benchmark" / "results.json"
