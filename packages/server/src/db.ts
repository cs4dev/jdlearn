// Lazy Mongo — connect on first use, not at import (Better Auth's adapter needs a
// connected db; /health must boot without a live Mongo). One client per process.
import { MongoClient, type Db } from "mongodb";
import { env } from "./env";

let client: MongoClient | undefined;
let db: Db | undefined;

export async function getDb(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(env.MONGO_URL);
  await client.connect();
  db = client.db(env.MONGO_DB);
  return db;
}

export async function closeDb(): Promise<void> {
  await client?.close();
  client = undefined;
  db = undefined;
}
