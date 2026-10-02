"""Benchmark: run every question through the four ablations and write results.json.

Modes, in order: bare, +schema_grounding, +validation, +retry.
Metric: execution accuracy (compare result sets, ignoring row and column order).
"""


def run_benchmark() -> None:
    """TODO(backend): load config.QUESTIONS_PATH, run each mode, compare to gold SQL,
    write config.RESULTS_PATH in the EvalResults shape (schemas.py).
    """
    raise NotImplementedError("eval_runner.run_benchmark")
