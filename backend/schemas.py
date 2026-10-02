"""API contract models. Mirrors SMALLSQL.md Section 5 and frontend/mocks/.

Changing a field here means updating the spec and the mocks in the same PR.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field

Mode = Literal["bare", "harness"]
StepStatus = Literal["ok", "error", "skipped"]


class AskRequest(BaseModel):
    question: str
    mode: Mode


class Step(BaseModel):
    name: str  # schema_grounding | generate | validate | execute | retry | critique
    status: StepStatus
    detail: str = ""


class AskResponse(BaseModel):
    mode: Mode
    question: str
    sql: str | None = None
    columns: list[str] = Field(default_factory=list)
    rows: list[list[Any]] = Field(default_factory=list)
    attempts: int = 0
    latency_ms: int = 0
    error: str | None = None
    steps: list[Step] = Field(default_factory=list)


class EvalStartResponse(BaseModel):
    status: str


class QuestionResult(BaseModel):
    id: str
    question: str
    passed: bool


class ModeResult(BaseModel):
    name: str  # bare | +schema_grounding | +validation | +retry
    accuracy: float
    per_question: list[QuestionResult]


class EvalResults(BaseModel):
    generated_at: str
    model: str
    dataset: str
    modes: list[ModeResult]
