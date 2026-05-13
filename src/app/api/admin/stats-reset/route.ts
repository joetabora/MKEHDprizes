import { NextResponse } from "next/server";
import { requireAdminDb } from "@/lib/auth/require-admin";
import { appSettings } from "@/db/schema";

export async function POST() {
  try {
    const { db } = await requireAdminDb();
    const at = new Date().toISOString();
    await db
      .insert(appSettings)
      .values({
        key: "stats_reset_at",
        value: { at },
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: { at }, updated_at: new Date() },
      });
    return NextResponse.json({ ok: true, since: at });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Reset failed";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
