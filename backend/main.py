"""FastAPI app and routes. Run: uvicorn main:app --reload --port 8000"""

import json
import time

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import bare
import config
import eval_runner
import harness
from schemas import AskRequest, AskResponse, EvalResults, EvalStartResponse

app = FastAPI(title="SmallSQL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "model": config.OLLAMA_MODEL, "dataset": config.DATASET}


@app.post("/api/ask", response_model=AskResponse)
def ask(req: AskRequest) -> AskResponse:
    """Always returns HTTP 200. Failures go in the `error` field, never a crash."""
    start = time.perf_counter()
    try:
        runner = harness.run if req.mode == "harness" else bare.run
        result = runner(req.question)
    except Exception as exc:  # contract: surface every failure in `error`
        result = AskResponse(mode=req.mode, question=req.question, error=f"{type(exc).__name__}: {exc}")
    result.latency_ms = int((time.perf_counter() - start) * 1000)
    return result


@app.post("/api/eval/run", response_model=EvalStartResponse)
def eval_run(background: BackgroundTasks) -> EvalStartResponse:
    background.add_task(eval_runner.run_benchmark)
    return EvalStartResponse(status="started")


@app.get("/api/eval/latest", response_model=EvalResults)
def eval_latest() -> EvalResults:
    """Serves cached results only. The demo never waits on a live benchmark."""
    if not config.RESULTS_PATH.exists():
        raise HTTPException(status_code=404, detail="No benchmark results yet")
    return EvalResults(**json.loads(config.RESULTS_PATH.read_text()))
