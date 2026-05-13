import type { GameType } from "@/types/database";
import type { AssignmentWithPrize } from "@/types/database";
import { tryGetDb } from "@/db/index";
import { prizeAssignments, prizes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMockAssignments } from "@/lib/mock-data";
import { isLocalOnlyMode } from "@/lib/env";
import { toAssignmentWithPrize } from "@/lib/db/mappers";

export async function fetchAssignments(game: GameType): Promise<AssignmentWithPrize[]> {
  if (isLocalOnlyMode()) {
    return getMockAssignments(game);
  }
  const db = tryGetDb();
  if (!db) {
    return getMockAssignments(game);
  }
  try {
    const rows = await db
      .select({
        assignment: prizeAssignments,
        prize: prizes,
      })
      .from(prizeAssignments)
      .innerJoin(prizes, eq(prizeAssignments.prize_id, prizes.id))
      .where(eq(prizeAssignments.game, game));
    return rows.map((r) => toAssignmentWithPrize(r.assignment, r.prize));
  } catch (err) {
    console.error("[fetchAssignments]", game, err);
    return [];
  }
}

export async function fetchAllAssignments(): Promise<AssignmentWithPrize[]> {
  if (isLocalOnlyMode()) {
    const { getMockAllAssignments } = await import("@/lib/mock-data");
    return getMockAllAssignments();
  }
  const db = tryGetDb();
  if (!db) {
    const { getMockAllAssignments } = await import("@/lib/mock-data");
    return getMockAllAssignments();
  }
  try {
    const rows = await db
      .select({
        assignment: prizeAssignments,
        prize: prizes,
      })
      .from(prizeAssignments)
      .innerJoin(prizes, eq(prizeAssignments.prize_id, prizes.id));
    return rows.map((r) => toAssignmentWithPrize(r.assignment, r.prize));
  } catch (err) {
    console.error("[fetchAllAssignments]", err);
    return [];
  }
}
