"""Relational data layer.

Uses SQLite so the demo runs with zero external services, but the schema is
written to be PostgreSQL-compatible (swap the connection + serial types and it
migrates cleanly). Models the core platform entities: render jobs and their
produced artifacts.
"""
import sqlite3
import json
import threading
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "bifrost_demo.db"
_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS render_jobs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    scene        TEXT    NOT NULL,
    frames       INTEGER NOT NULL,
    status       TEXT    NOT NULL DEFAULT 'queued',
    spec         TEXT    NOT NULL DEFAULT '{}',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON render_jobs(status);

CREATE TABLE IF NOT EXISTS artifacts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id    INTEGER NOT NULL REFERENCES render_jobs(id),
    kind      TEXT    NOT NULL,
    uri       TEXT    NOT NULL,
    created_at TEXT   NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_artifacts_job ON artifacts(job_id);
"""


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with connect() as conn:
        conn.executescript(SCHEMA)


def create_job(scene: str, frames: int, spec: dict) -> int:
    with _lock, connect() as conn:
        cur = conn.execute(
            "INSERT INTO render_jobs (scene, frames, spec) VALUES (?, ?, ?)",
            (scene, frames, json.dumps(spec)),
        )
        return cur.lastrowid


def set_status(job_id: int, status: str):
    with _lock, connect() as conn:
        conn.execute(
            "UPDATE render_jobs SET status = ?, updated_at = datetime('now') WHERE id = ?",
            (status, job_id),
        )


def add_artifact(job_id: int, kind: str, uri: str):
    with _lock, connect() as conn:
        conn.execute(
            "INSERT INTO artifacts (job_id, kind, uri) VALUES (?, ?, ?)",
            (job_id, kind, uri),
        )


def get_job(job_id: int):
    with connect() as conn:
        row = conn.execute("SELECT * FROM render_jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            return None
        arts = conn.execute(
            "SELECT kind, uri, created_at FROM artifacts WHERE job_id = ? ORDER BY id",
            (job_id,),
        ).fetchall()
        job = dict(row)
        job["spec"] = json.loads(job["spec"])
        job["artifacts"] = [dict(a) for a in arts]
        return job


def list_jobs():
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, scene, frames, status, created_at FROM render_jobs ORDER BY id DESC"
        ).fetchall()
        return [dict(r) for r in rows]
