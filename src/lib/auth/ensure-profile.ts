import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { tryGetDb } from "@/db/index";
import { profiles } from "@/db/schema";

export async function ensureProfileSynced() {
  const user = await currentUser();
  if (!user) {
    return null;
  }
  const db = tryGetDb();
  if (!db) {
    return user;
  }
  const existing = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (existing.length === 0) {
    await db.insert(profiles).values({
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      full_name:
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null,
      role: "staff",
    });
  }
  return user;
}
