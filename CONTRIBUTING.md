# Team workflow

Two people, two lanes, one contract.

| Lane | Owner | Branch | Owns |
|---|---|---|---|
| Frontend | Aditya | `frontend` | `frontend/` |
| Backend | teammate | `backend` | `backend/`, `benchmark/` |
| Shared | both | `main` | `SMALLSQL.md`, `frontend/mocks/`, `README.md`, `.env.example` |

## The contract is law

[SMALLSQL.md Section 5](SMALLSQL.md#5-api-contract) defines every request and response shape.
Two files mirror it and must stay in sync with it:

- `backend/schemas.py`: Pydantic models the API returns
- `frontend/mocks/*.json`: example responses the UI is built against

To change a field, open a small PR to `main` that updates **all three** (the spec, the schemas, and the mocks), and tell the other person. Don't change the contract inside a feature branch.

## Getting started

```bash
git clone <repo-url> && cd SmallSQL
git checkout -b frontend   # or: backend
git push -u origin frontend
```

## Day-to-day

```bash
# pull in the other lane's merged work regularly
git fetch origin
git merge origin/main

# ship a working slice
git push
# open a PR: frontend -> main (or backend -> main), merge when it runs
```

- Merge to `main` often (every working slice), not once at the end.
- Stay inside your own folder. If you need to touch the other person's folder, ask first.
- Never commit `.env`. Only `.env.example` is tracked.
- `benchmark/results.json` must come from a real run. Never hand-edit the numbers.

## Integration checklist

1. Backend: `uvicorn main:app --port 8000` and `curl -X POST localhost:8000/api/ask -H 'content-type: application/json' -d '{"question":"hi","mode":"bare"}'`
2. Frontend: `VITE_USE_MOCKS=false npm run dev`. Vite proxies `/api` to `localhost:8000`.
3. Both panels render, the timeline shows `steps[]`, and the eval dashboard loads `/api/eval/latest`.
