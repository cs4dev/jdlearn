# Bifrost Synthetic-Data Platform — Demo

A miniature, runnable slice of a simulation / synthetic-data render platform.
Built to mirror the core of the Bifrost MTS role: full-stack ownership across a
backend job API, an async render worker (the GPU-orchestration pattern), a
relational data model, and a developer-facing CLI.

## What it shows

| JD requirement | Where it shows up |
|---|---|
| Backend services & data pipelines (Python) | `app/main.py`, `app/worker.py` |
| TypeScript/Node tooling | `client/cli.ts` |
| API architecture | resource-oriented REST in `app/main.py` |
| Relational data modeling (PostgreSQL-compatible) | `app/db.py` |
| Async / GPU-render job orchestration | `app/worker.py` state machine |
| Containerized deployment + observability | `Dockerfile`, `/healthz` |

## Run it

### Backend (local)
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Drive it with the TypeScript CLI
```bash
cd client
npm install
npm start -- submit --scene cargo-port --frames 24
npm start -- list
```

### Or with Docker
```bash
docker build -t bifrost-demo .
docker run -p 8000:8000 bifrost-demo
```

## Architecture notes

- **Why SQLite here, Postgres in prod:** the schema in `app/db.py` uses
  Postgres-friendly DDL and indexing. Swapping the driver + serial types is a
  mechanical migration; SQLite keeps the demo zero-dependency.
- **Why a background worker:** real render jobs would be dispatched to a GPU
  pool / Kubernetes Job. The in-process worker models the same
  queued -> rendering -> completed state machine so the orchestration is honest.
- **Next steps for scale:** replace BackgroundTasks with a real queue (SQS /
  Celery), run the worker as an autoscaled EKS deployment on GPU node groups,
  and add OpenTelemetry traces around the render lifecycle.
