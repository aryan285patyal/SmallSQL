# SmallSQL

> A harness that makes a tiny open-weight model write SQL like a much bigger one, with a dashboard that proves it.

<!-- TODO: one-paragraph pitch + headline result, e.g. "Bare 35% -> Harness 80%" (from a real benchmark run) -->

<!-- TODO: screenshot / GIF of the side-by-side demo and the eval dashboard -->

## Model

<!-- TODO: exact model tag (from `ollama list`) and a link to its license/terms -->

| | |
|---|---|
| Model | `gemma3:4b` (TODO: confirm) |
| Served via | [Ollama](https://ollama.com) |
| License / terms | TODO: link |

## Dataset

`SNOWFLAKE_SAMPLE_DATA.TPCH_SF1`, which is freely available in Snowflake trial accounts.

## How Snowflake CoCo was used

<!-- TODO: describe + screenshots -->

## Key dependencies

- Backend: Python 3.11+, FastAPI, snowflake-connector-python, ollama, sqlglot
- Frontend: React, Vite, Tailwind CSS, Recharts

## Repo layout

```
backend/     FastAPI app, harness loop, bare baseline, eval runner
benchmark/   questions.json (gold SQL) and results.json (cached benchmark output)
frontend/    React UI; frontend/mocks/ holds contract-exact JSON for offline dev
SMALLSQL.md  full project spec, including the API contract (Section 5)
```

## Setup

### 1. Environment

```bash
cp .env.example .env   # fill in Snowflake credentials and the model tag
```

### 2. Model

```bash
# install Ollama from https://ollama.com, then:
ollama pull gemma3:4b
ollama list            # confirm the exact tag and put it in .env
```

### 3. Backend

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

To run the UI without the backend, set `VITE_USE_MOCKS=true` in `frontend/.env.local`.

## How accuracy is measured

<!-- TODO: execution accuracy, ~20 hand-verified questions, result-set comparison ignoring row/column order -->

## Limitations

<!-- TODO: benchmark size, small model, TPCH only -->

## License

MIT. See [LICENSE](LICENSE).
