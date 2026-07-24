// Application persistence. All reads are scoped to userId (SPEC §5 — server authority).
import type { Application, GenerationBundle, Resume } from "@jdlearn/shared";
import { getDb } from "./db";

const COLL = "applications";
const RESUME_COLL = "resumes";
const RESUME_IMPORT_COLL = "resume_imports";

export async function saveApplication(app: Application): Promise<void> {
  const db = await getDb();
  await db.collection<Application>(COLL).insertOne(app);
}

// `deletedAt: null` matches both null and missing (Mongo) — i.e. not soft-deleted.
const live = { deletedAt: null };

export async function listApplications(userId: string): Promise<Application[]> {
  const db = await getDb();
  return db
    .collection<Application>(COLL)
    .find({ userId, ...live }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function listArchivedApplications(userId: string): Promise<Application[]> {
  const db = await getDb();
  return db
    .collection<Application>(COLL)
    .find({ userId, deletedAt: { $ne: null } }, { projection: { _id: 0 } })
    .sort({ deletedAt: -1 })
    .toArray();
}

export async function getApplication(
  userId: string,
  id: string,
): Promise<Application | null> {
  const db = await getDb();
  return db
    .collection<Application>(COLL)
    .findOne({ userId, id, ...live }, { projection: { _id: 0 } });
}

/** Overwrite a live application's bundle in place, scoped to its owner. Returns whether one matched. */
export async function updateApplicationBundle(
  userId: string,
  id: string,
  bundle: GenerationBundle,
): Promise<boolean> {
  const db = await getDb();
  const { matchedCount } = await db
    .collection<Application>(COLL)
    .updateOne({ userId, id, ...live }, { $set: { bundle } });
  return matchedCount === 1;
}

/** Overwrite just the cover letter of a live application, scoped to its owner (user edit). */
export async function updateApplicationCoverLetter(
  userId: string,
  id: string,
  coverLetter: string,
): Promise<boolean> {
  const db = await getDb();
  const { matchedCount } = await db
    .collection<Application>(COLL)
    .updateOne({ userId, id, ...live }, { $set: { "bundle.coverLetter": coverLetter } });
  return matchedCount === 1;
}

/** Soft-delete one application, scoped to its owner. Returns whether one was marked. */
export async function deleteApplication(userId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const { modifiedCount } = await db
    .collection<Application>(COLL)
    .updateOne({ userId, id, ...live }, { $set: { deletedAt: new Date().toISOString() } });
  return modifiedCount === 1;
}

/**
 * Permanently purge an application (RULES R12 hard-delete escape hatch, SPEC §5).
 * Scoped to the owner AND to already-archived rows (`deletedAt` set) — a live application
 * can never be hard-deleted through this path, only soft-deleted first. Irreversible.
 */
export async function purgeApplication(userId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const { deletedCount } = await db.collection<Application>(COLL)
    .deleteOne({ userId, id, deletedAt: { $ne: null } }); // hard-delete: SPEC §5 (archived only)
  return deletedCount === 1;
}

/** Restore a soft-deleted application, scoped to its owner. Returns whether one was restored. */
export async function restoreApplication(userId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const { modifiedCount } = await db
    .collection<Application>(COLL)
    .updateOne({ userId, id, deletedAt: { $ne: null } }, { $set: { deletedAt: null } });
  return modifiedCount === 1;
}

// --- Résumé (one per user, upsert) ---

interface ResumeDoc extends Resume {
  userId: string;
}

export async function getResume(userId: string): Promise<Resume | null> {
  const db = await getDb();
  return db
    .collection<ResumeDoc>(RESUME_COLL)
    .findOne({ userId }, { projection: { _id: 0, userId: 0 } });
}

export async function saveResume(userId: string, resume: Resume): Promise<void> {
  const db = await getDb();
  await db
    .collection<ResumeDoc>(RESUME_COLL)
    .replaceOne({ userId }, { ...resume, userId }, { upsert: true });
}

// --- Résumé-import rate limit (one per user per window) ---

interface ImportDoc {
  userId: string;
  lastImportAt: string; // ISO 8601
}

export async function getResumeImportAt(userId: string): Promise<string | null> {
  const db = await getDb();
  const doc = await db.collection<ImportDoc>(RESUME_IMPORT_COLL).findOne({ userId });
  return doc?.lastImportAt ?? null;
}

export async function setResumeImportAt(userId: string, iso: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<ImportDoc>(RESUME_IMPORT_COLL)
    .replaceOne({ userId }, { userId, lastImportAt: iso }, { upsert: true });
}
