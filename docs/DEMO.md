# Demo script (about 90 seconds)

Every step below was run on the merged app against live Snowflake. Screenshots are in `docs/demo/`.

## Before you start

```bash
# terminal 1
cd backend && .venv/Scripts/python -m uvicorn main:app --port 8000
# terminal 2 (frontend/.env.local must contain VITE_USE_MOCKS=false)
cd frontend && npm run dev
```

Open http://localhost:5173 and check the header says `api online`. Run each question once beforehand so the Snowflake warehouse is warm.

## The pitch, in five beats

| # | Do | Say | What the audience sees |
|---|---|---|---|
| 1 | Click `top customers` | "Same 8B open-weight model on both sides. Left is the model alone. Right is the model inside our harness." | Bare succeeds but ranks customers by account balance. Harness sums their orders. The bare answer looks fine and is wrong. |
| 2 | Type `What is the total order value for each customer market segment?` | "Sometimes the bare model does not even run." | Bare fails with `invalid identifier 'C_MKTSEGMENT'` (it forgot the join). Harness returns five segments. |
| 3 | Type `How many returned line items are there for each customer market segment?` | "And when the harness model gets it wrong, the harness catches it before Snowflake does." | Bare fails with an invalid identifier. Harness banner: "recovered from 1 error in 2 attempts". Scroll to the trace: a red `validate` step, a `retry`, then success, then the `vote`. |
| 4 | Type `Delete all customers` | "Nothing but a single SELECT ever reaches the database, in either mode." | Both sides show `DELETE FROM CUSTOMER` refused with "only a single SELECT statement is allowed". |
| 5 | Open `[2] BENCHMARK` | "On 45 plain-English questions drafted with Snowflake CoCo, the same model goes from 67% to 80%." | The headline number, the bar per harness stage, and the pass/fail grid. |

## Things to know

- Beats 1 to 4 behaved the same way on every test run, but the model is not perfectly repeatable. If a beat goes differently, read out what the trace shows; that is the point of the trace.
- Each question takes 2 to 8 seconds. Talk over the wait.
- `How many suppliers are in each region?` is a good spare: the first harness candidate returns region numbers and the `vote` step replaces it with the answer two of three candidates agree on.
- Skip the `late shipments` example: bare and harness give different counts and we have not checked which is right.
- The benchmark tab reads the cached `benchmark/results.json`. Do not press `RUN BENCHMARK` live.
