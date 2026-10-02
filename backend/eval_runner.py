"""Benchmark: run every question through the four ablations and write results.json.

Modes, in order: bare, +schema_grounding, +validation, +retry.
Metric: execution accuracy (compare result sets, ignoring row and column order).

Run directly with: python eval_runner.py
"""

import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import bare
import config
import harness
from compare import results_match
from snowflake_client import run_sql

LIMIT = config.EVAL_ROW_LIMIT

# Each mode adds one thing to the one before it.
MODES = {
    "bare": lambda q: bare.run(q, LIMIT),
    "+schema_grounding": lambda q: harness.run(q, validation=False, retry=False, limit=LIMIT),
    "+validation": lambda q: harness.run(q, retry=False, limit=LIMIT),
    "+retry": lambda q: harness.run(q, limit=LIMIT),
}


def run_benchmark(questions_path: Path = config.QUESTIONS_PATH, results_path: Path = config.RESULTS_PATH) -> None:
    questions = json.loads(questions_path.read_text())
    if not questions:
        print(f"No questions in {questions_path}; nothing to run.")
        return

    def gold_rows(question: dict) -> list[list]:
        return run_sql(question["gold_sql"], LIMIT)[1]

    def grade(job: tuple[str, dict]) -> bool:
        mode, question = job
        try:
            result = MODES[mode](question["question"])
            passed = result.error is None and results_match(gold[question["id"]], result.rows, question.get("ordered", False))
        except Exception as exc:  # a crash in one question must not stop the run
            print(f"  {mode} {question['id']}: crashed: {exc}")
            passed = False
        print(f"  {mode:18} {question['id']}: {'pass' if passed else 'FAIL'}")
        return passed

    # Model calls and queries all run on Snowflake, so the whole grid runs in parallel.
    with ThreadPoolExecutor(config.EVAL_WORKERS) as pool:
        gold = {q["id"]: rows for q, rows in zip(questions, pool.map(gold_rows, questions))}
        jobs = [(mode, question) for mode in MODES for question in questions]
        outcomes = dict(zip(((mode, q["id"]) for mode, q in jobs), pool.map(grade, jobs)))

    modes = []
    for mode in MODES:
        per_question = [{"id": q["id"], "question": q["question"], "passed": outcomes[(mode, q["id"])]} for q in questions]
        accuracy = sum(item["passed"] for item in per_question) / len(per_question)
        modes.append({"name": mode, "accuracy": round(accuracy, 4), "per_question": per_question})
        print(f"{mode}: {accuracy:.0%}")

    results = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "model": config.CORTEX_MODEL,
        "dataset": config.DATASET,
        "modes": modes,
    }
    results_path.write_text(json.dumps(results, indent=2))
    print(f"Wrote {results_path}")


if __name__ == "__main__":
    run_benchmark()
