# Max Miles Rewards Ledger (HeyMax demo)

A small, runnable backend that mirrors HeyMax's core domain: users **earn** Max Miles
from merchant transactions and **redeem** them. Balances are derived from an
immutable, append-only ledger.

## Why this models the role

- **Money-correctness:** earning is **idempotent by `transactionId`**, so webhook/retry
  storms never double-credit a customer.
- **Auditability:** append-only log; balance is always recomputable from events.
- **Engineering quality:** validation, structured error mapping (400/409/500), and a
  passing test suite.

## Run it

```bash
npm install
npm test      # all ledger tests pass
npm start     # API on http://localhost:3000
```

## Try it

```bash
curl -X POST localhost:3000/users/u1/earn \
  -H 'content-type: application/json' \
  -d '{"miles":500,"transactionId":"txn_1"}'

curl localhost:3000/users/u1/balance

curl -X POST localhost:3000/users/u1/redeem \
  -H 'content-type: application/json' \
  -d '{"miles":200}'
```

## Where AI-assisted development fits

This is the kind of service I'd scaffold with Claude Code / Cursor — generating the
test matrix and error-handling boilerplate fast, then applying judgment on the
idempotency and ledger-consistency invariants that actually matter.
