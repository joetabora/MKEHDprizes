"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { requireAdminDb } from "@/lib/auth/require-admin";
import { prizeAssignments, prizes } from "@/db/schema";
import { toAssignmentWithPrize, toPrizeRow } from "@/lib/db/mappers";
import type { AssignmentWithPrize, GameType, PrizeRow, RarityTier } from "@/types/database";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function finiteWeight(n: number, fallback: number): number {
  const x = Number(n);
  return Number.isFinite(x) && x >= 0 ? x : fallback;
}

function plinkoSlotIndex(n: number): number {
  const x = Math.floor(Number(n));
  return Number.isFinite(x) && x >= 0 ? x : 0;
}

function isPgUniqueViolation(e: unknown): boolean {
  if (typeof e === "object" && e !== null) {
    const any = e as { code?: string; cause?: unknown; message?: string };
    if (any.code === "23505") return true;
    if (typeof any.message === "string" && /duplicate key|unique constraint/i.test(any.message)) {
      return true;
    }
    if (any.cause) return isPgUniqueViolation(any.cause);
  }
  return false;
}

/** Plain JSON-safe payload for the client (avoids Flight serialization issues). */
function prizeLabPayload(prizes: PrizeRow[], assignments: AssignmentWithPrize[]) {
  return JSON.parse(JSON.stringify({ prizes, assignments })) as {
    prizes: PrizeRow[];
    assignments: AssignmentWithPrize[];
  };
}

export async function loadPrizeLabDataAction(): Promise<{
  prizes: PrizeRow[];
  assignments: AssignmentWithPrize[];
}> {
  const { db } = await requireAdminDb();
  const p = await db.select().from(prizes).orderBy(desc(prizes.created_at));
  const joined = await db
    .select({ assignment: prizeAssignments, prize: prizes })
    .from(prizeAssignments)
    .innerJoin(prizes, eq(prizeAssignments.prize_id, prizes.id));
  return prizeLabPayload(
    p.map(toPrizeRow),
    joined.map((r) => toAssignmentWithPrize(r.assignment, r.prize)),
  );
}

export async function upsertPrizeAction(payload: {
  editingId: string | null;
  name: string;
  description: string;
  image_url: string | null;
  rarity: RarityTier;
  quantity_total: number;
  quantity_remaining: number;
  active: boolean;
  redemption_instructions: string;
  internal_notes: string;
}) {
  const { db } = await requireAdminDb();
  if (payload.editingId) {
    await db
      .update(prizes)
      .set({
        name: payload.name,
        description: payload.description,
        image_url: payload.image_url,
        rarity: payload.rarity,
        quantity_total: payload.quantity_total,
        quantity_remaining: payload.quantity_remaining,
        active: payload.active,
        redemption_instructions: payload.redemption_instructions,
        internal_notes: payload.internal_notes,
        updated_at: new Date(),
      })
      .where(eq(prizes.id, payload.editingId));
  } else {
    await db.insert(prizes).values({
      name: payload.name,
      description: payload.description,
      image_url: payload.image_url,
      rarity: payload.rarity,
      quantity_total: payload.quantity_total,
      quantity_remaining: payload.quantity_remaining,
      active: payload.active,
      redemption_instructions: payload.redemption_instructions,
      internal_notes: payload.internal_notes,
    });
  }
  revalidatePath("/admin/prizes");
}

export async function duplicatePrizeAction(sourcePrizeId: string) {
  const { db } = await requireAdminDb();
  const [src] = await db.select().from(prizes).where(eq(prizes.id, sourcePrizeId)).limit(1);
  if (!src) {
    throw new Error("Prize not found");
  }

  const baseName = src.name.trimEnd();
  const copyLabel = baseName.endsWith("(copy)") ? `${baseName} 2` : `${baseName} (copy)`;

  const [inserted] = await db
    .insert(prizes)
    .values({
      name: copyLabel,
      description: src.description,
      image_url: src.image_url,
      rarity: src.rarity,
      quantity_total: src.quantity_total,
      quantity_remaining: src.quantity_remaining,
      active: src.active,
      redemption_instructions: src.redemption_instructions,
      internal_notes: src.internal_notes,
    })
    .returning({ id: prizes.id });

  if (!inserted) {
    throw new Error("Failed to duplicate prize");
  }

  const assigns = await db
    .select()
    .from(prizeAssignments)
    .where(eq(prizeAssignments.prize_id, sourcePrizeId));

  if (assigns.length > 0) {
    try {
      await db.insert(prizeAssignments).values(
        assigns.map((a) => ({
          prize_id: inserted.id,
          game: a.game,
          probability_weight: finiteWeight(Number(a.probability_weight), 1),
          visual_weight: finiteWeight(Number(a.visual_weight), 1),
          enabled: a.enabled,
          wheel_color: a.wheel_color,
          wheel_glow_jackpot: a.wheel_glow_jackpot,
          plinko_slot_index:
            a.game === "plinko" ? plinkoSlotIndex(Number(a.plinko_slot_index ?? 0)) : null,
          slot_symbol_key: a.slot_symbol_key,
          slot_payline_tier: a.slot_payline_tier,
          display_sort: Number.isFinite(Number(a.display_sort)) ? Math.floor(Number(a.display_sort)) : 0,
        })),
      );
    } catch (e) {
      if (isPgUniqueViolation(e)) {
        throw new Error(
          "Prize was duplicated but copying game assignments failed (plinko slot conflict). Remove the new prize or fix slot numbers and try again.",
        );
      }
      throw e;
    }
  }

  revalidatePath("/admin/prizes");
}

export async function insertAssignmentAction(payload: {
  prizeId: string;
  game: GameType;
  probability: number;
  visual: number;
  wheelColor: string;
  glow: boolean;
  slotIdx: number;
  displaySort: number;
}) {
  if (!UUID_RE.test(payload.prizeId)) {
    throw new Error("Invalid prize id");
  }
  const games: GameType[] = ["wheel", "plinko", "slots"];
  if (!games.includes(payload.game)) {
    throw new Error("Invalid game");
  }

  const prob = finiteWeight(payload.probability, 1);
  const visual = finiteWeight(payload.visual, 1);
  const sort = Number.isFinite(payload.displaySort) ? Math.floor(payload.displaySort) : 0;
  const plinkoIdx = payload.game === "plinko" ? plinkoSlotIndex(payload.slotIdx) : null;

  const { db } = await requireAdminDb();
  try {
    await db.insert(prizeAssignments).values({
      prize_id: payload.prizeId,
      game: payload.game,
      probability_weight: prob,
      visual_weight: visual,
      enabled: true,
      wheel_color: payload.wheelColor,
      wheel_glow_jackpot: payload.glow,
      plinko_slot_index: plinkoIdx,
      slot_symbol_key: null,
      slot_payline_tier: 0,
      display_sort: sort,
    });
  } catch (e) {
    if (isPgUniqueViolation(e)) {
      throw new Error(
        "This prize already has a plinko row for that slot (or a duplicate assignment). Pick another slot or remove the existing assignment.",
      );
    }
    throw e;
  }
  revalidatePath("/admin/prizes");
}

export async function setAssignmentEnabledAction(id: string, enabled: boolean) {
  const { db } = await requireAdminDb();
  await db
    .update(prizeAssignments)
    .set({ enabled, updated_at: new Date() })
    .where(eq(prizeAssignments.id, id));
  revalidatePath("/admin/prizes");
}
