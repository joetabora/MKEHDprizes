import { eq } from "drizzle-orm";
import { appSettings } from "@/db/schema";
import { tryGetDb } from "@/db/index";
import { getStatsResetAt } from "@/lib/env";

export async function getEffectiveStatsSince(): Promise<string> {
  const env = getStatsResetAt()?.toISOString();
  const db = tryGetDb();
  if (db) {
    const rows = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, "stats_reset_at"))
      .limit(1);
    const at = (rows[0]?.value as { at?: string } | undefined)?.at;
    if (at) {
      return at;
    }
  }
  if (env) {
    return env;
  }
  return new Date(0).toISOString();
}
