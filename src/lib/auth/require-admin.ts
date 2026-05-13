import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { tryGetDb } from "@/db/index";
import { profiles } from "@/db/schema";

export async function requireAdminDb() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const db = tryGetDb();
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }
  const row = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (row[0]?.role !== "admin") {
    throw new Error("Forbidden");
  }
  return { db, userId };
}
