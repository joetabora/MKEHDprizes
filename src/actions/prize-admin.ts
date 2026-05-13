"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { requireAdminDb } from "@/lib/auth/require-admin";
import { prizeAssignments, prizes, redemptions } from "@/db/schema";
import { toAssignmentWithPrize, toPrizeRow } from "@/lib/db/mappers";
import type { AssignmentWithPrize, GameType, PrizeRow, RarityTier } from "@/types/database";

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
  return {
    prizes: p.map(toPrizeRow),
    assignments: joined.map((r) => toAssignmentWithPrize(r.assignment, r.prize)),
  };
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
    await db.insert(prizeAssignments).values(
      assigns.map((a) => ({
        prize_id: inserted.id,
        game: a.game,
        probability_weight: a.probability_weight,
        visual_weight: a.visual_weight,
        enabled: a.enabled,
        wheel_color: a.wheel_color,
        wheel_glow_jackpot: a.wheel_glow_jackpot,
        plinko_slot_index: a.plinko_slot_index,
        slot_symbol_key: a.slot_symbol_key,
        slot_payline_tier: a.slot_payline_tier,
        display_sort: a.display_sort,
      })),
    );
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
  const { db } = await requireAdminDb();
  await db.insert(prizeAssignments).values({
    prize_id: payload.prizeId,
    game: payload.game,
    probability_weight: payload.probability,
    visual_weight: payload.visual,
    enabled: true,
    wheel_color: payload.wheelColor,
    wheel_glow_jackpot: payload.glow,
    plinko_slot_index: payload.game === "plinko" ? payload.slotIdx : null,
    slot_symbol_key: null,
    slot_payline_tier: 0,
    display_sort: payload.displaySort,
  });
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

export async function listRedemptionsAdminAction(): Promise<
  {
    id: string;
    code: string;
    status: string;
    claim_later: boolean;
    created_at: Date;
    prizeName: string | null;
  }[]
> {
  const { db } = await requireAdminDb();
  const rows = await db
    .select({
      id: redemptions.id,
      code: redemptions.code,
      status: redemptions.status,
      claim_later: redemptions.claim_later,
      created_at: redemptions.created_at,
      prizeName: prizes.name,
    })
    .from(redemptions)
    .innerJoin(prizes, eq(redemptions.prize_id, prizes.id))
    .orderBy(desc(redemptions.created_at))
    .limit(200);
  return rows.map((r) => ({
    ...r,
    created_at: r.created_at as Date,
  }));
}

export async function markRedemptionRedeemedAction(redemptionId: string) {
  const { db } = await requireAdminDb();
  await db
    .update(redemptions)
    .set({
      status: "redeemed",
      redeemed_at: new Date(),
      redeemed_by: null,
    })
    .where(eq(redemptions.id, redemptionId));
  revalidatePath("/admin/redemptions");
}
