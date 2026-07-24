"""Synthetic-data render platform API.

Resource-oriented REST design:
  POST /jobs           submit a render job
  GET  /jobs           list jobs
  GET  /jobs/{id}      job detail + artifacts
  GET  /healthz        liveness/observability probe
"""
import asyncio

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from . import db
from .worker import run_render

app = FastAPI(title="Bifrost Synthetic-Data Demo", version="0.1.0")


class JobRequest(BaseModel):
    scene: str = Field(..., examples=["cargo-port"])
    frames: int = Field(24, ge=1, le=10_000)
    spec: dict = Field(default_factory=dict, description="domain-randomization params")


@app.on_event("startup")
def _startup():
    db.init_db()


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.post("/jobs", status_code=201)
async def submit_job(req: JobRequest, background: BackgroundTasks):
    job_id = db.create_job(req.scene, req.frames, req.spec)
    background.add_task(_launch, job_id, req.scene, req.frames)
    return {"id": job_id, "status": "queued"}


async def _launch(job_id: int, scene: str, frames: int):
    # Fire the render coroutine; isolate failures per job.
    try:
        await run_render(job_id, scene, frames)
    except Exception:
        db.set_status(job_id, "failed")


@app.get("/jobs")
def list_jobs():
    return db.list_jobs()


@app.get("/jobs/{job_id}")
def get_job(job_id: int):
    job = db.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return job
