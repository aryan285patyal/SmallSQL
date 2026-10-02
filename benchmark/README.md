# Benchmark

- `questions.json`: ~20 questions drafted with Snowflake CoCo, each with hand-verified gold SQL.
- `results.json`: written by `backend/eval_runner.py` from a real run. Never edit it by hand.

Each entry in `questions.json`:

```json
{ "id": "q01", "difficulty": "easy", "question": "How many customers are in each market segment?", "gold_sql": "SELECT C_MKTSEGMENT, COUNT(*) FROM CUSTOMER GROUP BY 1" }
```
