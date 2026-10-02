# SmallSQL

> A harness that makes a tiny open-weight model write SQL like a much bigger one, with a dashboard that proves it.

This file describes the whole project: what it is, why it exists, how it works, and what "done" looks like. Read it fully before writing code.

---

## 1. What we're building (plain English)

A user types a plain-English question about a dataset, such as "Which 5 customers spent the most?"

A **small open-weight language model** (10B parameters or fewer) turns the question into SQL, and we run that SQL on Snowflake and show the results.

The question runs two ways, side by side:

- **Bare mode:** the model alone. It gets the schema and the question, writes SQL once, and we execute whatever it produced.
- **Harness mode:** the same model wrapped in checks: schema grounding, SQL validation, error feedback, and automatic retries.

A **benchmark** of about 20 questions measures how often each mode returns the correct answer. The headline result is the gap, for example "Bare 35% -> Harness 80%".

**The harness is the project.** The web UI exists to make the harness's value visible and verifiable in under a minute.

---

## 2. Context: the hackathon

This is a 4-hour build for the **Hacktoberfest "Open-Source AI Prize Challenge"**, entered in the **Snowflake partner category**.

### Hard requirements (a miss on any of these can disqualify us)

- Open-source or open-weight AI must be an **important part** of how the project works, not a bolt-on.
- Public GitHub repo with an **open-source license** (use **MIT**).
- Our entry is a **model harness**, so it must include an **original implementation** (not a thin wrapper around someone else's).
- Snowflake category: the project must combine **all three**:
  1. **Snowflake CoCo** (Snowflake's AI coding agent for data work)
  2. A **freely accessible Snowflake dataset**
  3. **Open-source / open-weight AI**
- The README must **name the exact model and link its license/terms** (open-weight does not automatically mean fully open source).
- Source, license, model, and key dependencies must be **easy to verify**.
- Needs a **working demo** and a clear explanation of what was built.

### What a strong entry looks like

Uses open AI as a core part of how it works, solves a clear problem, shows substantial technical work, is easy to verify, and has a working demo with a clear explanation.

---

## 3. Fixed decisions (don't relitigate these)

| Decision | Choice |
|---|---|
| Dataset | `SNOWFLAKE_SAMPLE_DATA.TPCH_SF1` (customers, orders, lineitem, supplier, part, nation, region). Free in Snowflake trial accounts. |
| Model | A Gemma model at 10B parameters or fewer, served locally via **Ollama**. Default: `gemma3:4b`. Verify the exact tag with `ollama list`. Keep it in one config value. |
| Backend | Python 3.11+, **FastAPI**, `snowflake-connector-python`, `ollama`, `sqlglot` |
| Frontend | **React + Vite + Tailwind + Recharts** |
| License | MIT |
| Safety | SQL is **read-only**. Only a single `SELECT` statement is ever executed. |

### Fair baseline rule

The bare mode must receive the **same schema text** in its prompt as the harness mode. The only difference is the missing validation, feedback, and retry logic. Otherwise the comparison looks rigged.

---

## 4. Architecture

```
React UI  --HTTP/JSON-->  FastAPI  --> Ollama (Gemma, local)
                             |
                             +-----> Snowflake (read-only role, TPCH_SF1)
```

### The harness loop (core logic)

For each question in harness mode, up to **3 attempts**:

1. **Schema grounding:** build a compact schema description (tables, columns, types, key relationships) once, cache it, and put it in the prompt. If it gets too long, include only tables relevant to the question.
2. **Generate:** ask the model for SQL.
3. **Validate:** parse with `sqlglot`. Reject anything that is not exactly one `SELECT`. Reject unknown tables or columns where detectable.
4. **Execute (or `EXPLAIN`):** run on Snowflake with a row limit and timeout.
5. **On any failure:** send the error text back to the model along with the previous SQL and ask for a fix, then loop.
6. **Optional self-critique:** a short check of "does this SQL answer the question asked?" before accepting.

Every stage is recorded in a `steps[]` list as it happens, so the UI can display the harness working.

### Benchmark ablations

The benchmark runs four configurations so the results form a staircase:

1. `bare`: model only
2. `+schema_grounding`
3. `+validation`
4. `+retry` (full harness)

---

## 5. API contract

This is the single source of truth between frontend and backend. Do not change field names without updating this file and the mocks.

### `POST /api/ask`

Request:
```json
{ "question": "Which 5 customers spent the most?", "mode": "bare" }
```
`mode` is `"bare"` or `"harness"`.

Response:
```json
{
  "mode": "harness",
  "question": "Which 5 customers spent the most?",
  "sql": "SELECT ...",
  "columns": ["C_NAME", "TOTAL"],
  "rows": [["Customer#000000001", 123456.78]],
  "attempts": 2,
  "latency_ms": 4210,
  "error": null,
  "steps": [
    { "name": "schema_grounding", "status": "ok", "detail": "Loaded 8 tables" },
    { "name": "generate", "status": "ok", "detail": "attempt 1" },
    { "name": "validate", "status": "ok", "detail": "single SELECT" },
    { "name": "execute", "status": "error", "detail": "invalid identifier 'C_TOTAL'" },
    { "name": "retry", "status": "ok", "detail": "fed error back to model" },
    { "name": "generate", "status": "ok", "detail": "attempt 2" },
    { "name": "execute", "status": "ok", "detail": "5 rows" }
  ]
}
```
`status` is one of `"ok"`, `"error"`, `"skipped"`. Failures must come back as a populated `error` field with HTTP 200, never as a crash.

### `POST /api/eval/run`

Starts the benchmark in the background. Returns `{ "status": "started" }`.

### `GET /api/eval/latest`

Serves cached results from `results.json`. The demo must never depend on a live benchmark run.

```json
{
  "generated_at": "2026-10-02T12:00:00Z",
  "model": "gemma3:4b",
  "dataset": "SNOWFLAKE_SAMPLE_DATA.TPCH_SF1",
  "modes": [
    {
      "name": "bare",
      "accuracy": 0.35,
      "per_question": [
        { "id": "q01", "question": "...", "passed": true }
      ]
    }
  ]
}
```
`modes` contains the four ablations in order.

### Cross-cutting

- CORS enabled for the frontend dev origin.
- All timeouts and errors surface in the `error` field.
- Snowflake credentials and model name come from `.env` (never committed).

---

## 6. Benchmark and evaluation

- About **20 questions** over TPCH, ranging from easy (single-table filters) to hard (multi-table joins, aggregations, date logic).
- Each question has a **gold SQL** query. **Every gold query must be hand-verified** for correctness.
- Questions and gold SQL are drafted with **Snowflake CoCo** (this is part of the hackathon requirement). Store them in `benchmark/questions.json`.
- **Metric: execution accuracy.** Run the generated SQL and the gold SQL, then compare result sets, ignoring row order and column order. Match means pass.
- Results are saved to `results.json` and served via `/api/eval/latest`.
- Be honest in the README about benchmark size and how accuracy is measured.

---

## 7. Frontend requirements

- **Ask page:** question input with a few clickable example questions. Two side-by-side panels, **Bare** and **Harness**. Each shows syntax-highlighted SQL, a result table, latency, and attempt count.
- **Harness timeline:** a vertical step list built from `steps[]` (success check, error X, retry indicator). This is the key visual for showing technical depth.
- **Eval dashboard:** a bar chart of accuracy across the four ablation modes, a grid of questions x modes with pass/fail dots, and one big headline number ("Bare X% -> Harness Y%").
- **Polish:** loading skeletons, clear error states, dark theme, and a "Run benchmark" button that works from cached results.
- **Mocks:** keep a `frontend/mocks/` folder with JSON matching the contract exactly, so the UI can be developed and demoed without the backend running.

---

## 8. Suggested repo structure

```
smallsql/
├── README.md
├── LICENSE                  # MIT
├── SMALLSQL.md              # this file
├── .env.example
├── backend/
│   ├── main.py              # FastAPI app and routes
│   ├── snowflake_client.py  # run_sql() with read-only role, row limit, timeout
│   ├── schema.py            # schema grounding and caching
│   ├── prompts.py           # prompt templates
│   ├── harness.py           # validate / execute / retry loop, steps[]
│   ├── bare.py              # baseline mode
│   ├── eval_runner.py       # benchmark and results.json
│   └── requirements.txt
├── benchmark/
│   ├── questions.json       # questions + gold SQL
│   └── results.json         # cached output
└── frontend/
    ├── mocks/
    ├── src/
    └── package.json
```

---

## 9. README must contain

- One-paragraph pitch and the headline accuracy result
- Screenshot or GIF of the side-by-side demo and the eval dashboard
- **Exact model name** and a **link to its license/terms**
- List of key dependencies
- How CoCo was used, with screenshots as proof
- Which Snowflake dataset was used and that it is freely accessible
- Setup and run instructions (Ollama, Snowflake env vars, backend, frontend)
- Honest limitations (benchmark size, small model, TPCH only)
- MIT license notice

---

## 10. Definition of done

- [ ] `/api/ask` works in both modes and returns the contract shape
- [ ] Harness retries on SQL errors and records every step
- [ ] Only single `SELECT` statements ever reach Snowflake
- [ ] Benchmark has ~20 verified questions and a cached `results.json`
- [ ] Four-mode accuracy staircase is visible in the dashboard
- [ ] Frontend runs against both mocks and the real API
- [ ] README complete, repo public, MIT license present
- [ ] CoCo usage documented with screenshots
- [ ] 60-second demo video or GIF recorded

---

## 11. Working rules

- **Time box:** the whole build is 4 hours. Prefer one polished flow over many half-working ones. Cut scope early.
- **Contract first:** treat Section 5 as law. If a change is needed, update this file, the mocks, and both sides together.
- **Cache everything slow:** schema text, benchmark results. Demos must not depend on slow live calls.
- **Never commit secrets.** Use `.env` and commit only `.env.example`.
- **Keep it simple and readable.** Judges will read the code. Short functions, clear names, brief comments on the harness logic.
- **Don't fake results.** Accuracy numbers must come from real benchmark runs.

---

## 12. Things a human must do (not code)

These can't be done by Claude Code and need a person:

- Create or confirm the Snowflake trial account and read-only role, and verify `TPCH_SF1` is visible
- Use **CoCo** in Snowflake to explore the dataset and draft benchmark questions, then **screenshot it** for proof
- Hand-verify every gold SQL query
- Install Ollama, pull the model, and confirm the exact tag
- Record the demo video and submit the project
