import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForSql = globalThis as unknown as {
  __sql: ReturnType<typeof postgres> | undefined;
  __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForSql.__sql) {
    globalForSql.__sql = postgres(url, { max: 1, prepare: false });
  }
  return globalForSql.__sql;
}

function getOrCreateDrizzle() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!globalForSql.__db) {
    globalForSql.__db = drizzle(getSql(), { schema });
  }
  return globalForSql.__db;
}

export function tryGetDb(): ReturnType<typeof drizzle<typeof schema>> | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  return getOrCreateDrizzle();
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  const d = getOrCreateDrizzle();
  if (!d) {
    throw new Error("DATABASE_URL is not set");
  }
  return d;
}
