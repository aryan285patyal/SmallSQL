# Mocks

Contract-exact example responses (SMALLSQL.md Section 5) so the UI runs without the backend.
Set `VITE_USE_MOCKS=true` in `frontend/.env.local` to use them.

| File | Endpoint |
|---|---|
| `ask_bare.json` | `POST /api/ask` with `mode: "bare"` |
| `ask_harness.json` | `POST /api/ask` with `mode: "harness"` |
| `eval_latest.json` | `GET /api/eval/latest` |

These numbers are **fake** and exist only for UI work. Never copy them into the README or `benchmark/results.json`.
