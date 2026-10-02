"""All settings in one place, loaded from the repo-root .env file."""

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

# Model: an open-weight model hosted on Snowflake Cortex
CORTEX_MODEL = os.getenv("CORTEX_MODEL", "llama3.1-8b")
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "700"))
LLM_TIMEOUT_S = int(os.getenv("LLM_TIMEOUT_S", "60"))

# Snowflake (SNOWFLAKE_PASSWORD may hold a programmatic access token)
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
LLM_CRITIQUE = os.getenv("LLM_CRITIQUE", "false").lower() == "true"

# Benchmark
EVAL_WORKERS = int(os.getenv("EVAL_WORKERS", "8"))
EVAL_ROW_LIMIT = int(os.getenv("EVAL_ROW_LIMIT", "1000"))

# API
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# Files
QUESTIONS_PATH = ROOT / "benchmark" / "questions.json"
RESULTS_PATH = ROOT / "benchmark" / "results.json"
SCHEMA_CACHE_PATH = ROOT / "backend" / "schema_cache.json"
