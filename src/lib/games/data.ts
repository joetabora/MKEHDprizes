import type { GameType } from "@/types/database";
import type { AssignmentWithPrize } from "@/types/database";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getMockAssignments } from "@/lib/mock-data";
import { isLocalOnlyMode } from "@/lib/env";

function normalizeAssignment(row: Record<string, unknown>): AssignmentWithPrize {
  const p = row.prize;
  const prize = (Array.isArray(p) ? p[0] : p) as AssignmentWithPrize["prize"];
  return { ...(row as unknown as AssignmentWithPrize), prize };
}

export async function fetchAssignments(game: GameType): Promise<AssignmentWithPrize[]> {
  if (isLocalOnlyMode()) {
    return getMockAssignments(game);
  }
  try {
    const supa = createServiceRoleClient();
    const { data, error } = await supa
      .from("prize_assignments")
      .select("*, prize:prizes(*)")
      .eq("game", game);
    if (error) throw error;
    return (data ?? []).map((r) => normalizeAssignment(r as Record<string, unknown>));
  } catch {
    return getMockAssignments(game);
  }
}

export async function fetchAllAssignments(): Promise<AssignmentWithPrize[]> {
  if (isLocalOnlyMode()) {
    const { getMockAllAssignments } = await import("@/lib/mock-data");
    return getMockAllAssignments();
  }
  try {
    const supa = createServiceRoleClient();
    const { data, error } = await supa.from("prize_assignments").select("*, prize:prizes(*)");
    if (error) throw error;
    return (data ?? []).map((r) => normalizeAssignment(r as Record<string, unknown>));
  } catch {
    const { getMockAllAssignments } = await import("@/lib/mock-data");
    return getMockAllAssignments();
  }
}
