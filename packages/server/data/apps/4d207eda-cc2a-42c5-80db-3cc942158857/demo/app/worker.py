"""Async render worker.

Simulates the GPU render lifecycle of a synthetic-data job: queued -> rendering
-> producing artifacts -> completed. In production this is where a job would be
handed to a GPU pool / Kubernetes job; here we model the same state machine so
the orchestration shape is real even without a GPU.
"""
import asyncio

from . import db


async def run_render(job_id: int, scene: str, frames: int):
    db.set_status(job_id, "rendering")
    # Simulate per-frame GPU work (kept short for the demo).
    per_frame = 0.05
    await asyncio.sleep(per_frame * frames)

    # Emit the kinds of artifacts a synthetic-data pipeline produces.
    db.add_artifact(job_id, "rgb", f"s3://bifrost-demo/{scene}/{job_id}/rgb.mp4")
    db.add_artifact(job_id, "segmentation", f"s3://bifrost-demo/{scene}/{job_id}/seg.png")
    db.add_artifact(job_id, "labels", f"s3://bifrost-demo/{scene}/{job_id}/labels.json")

    db.set_status(job_id, "completed")
