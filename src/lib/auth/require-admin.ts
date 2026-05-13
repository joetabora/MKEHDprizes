import { cookies } from "next/headers";
import { tryGetDb } from "@/db/index";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/admin-session";

export async function requireAdminDb() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? "";
  if (!secret || !token || !(await verifyAdminSessionToken(token, secret))) {
    throw new Error("Unauthorized");
  }
  const db = tryGetDb();
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }
  return { db };
}
