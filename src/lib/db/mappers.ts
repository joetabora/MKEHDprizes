import type { PrizeAssignmentSelect, PrizeSelect } from "@/db/schema";
import type { AssignmentWithPrize, GameType, PrizeRow, RarityTier } from "@/types/database";

function toIso(v: unknown): string {
  if (v instanceof Date) {
    return v.toISOString();
  }
  if (typeof v === "string") {
    return v;
  }
  return new Date(0).toISOString();
}

export function toPrizeRow(p: PrizeSelect): PrizeRow {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    image_url: p.image_url,
    rarity: p.rarity as RarityTier,
    quantity_total: p.quantity_total,
    quantity_remaining: p.quantity_remaining,
    active: p.active,
    redemption_instructions: p.redemption_instructions,
    internal_notes: p.internal_notes,
    created_at: toIso(p.created_at),
    updated_at: toIso(p.updated_at),
  };
}

export function toAssignmentWithPrize(
  a: PrizeAssignmentSelect,
  p: PrizeSelect,
): AssignmentWithPrize {
  return {
    id: a.id,
    prize_id: a.prize_id,
    game: a.game as GameType,
    probability_weight: Number(a.probability_weight),
    visual_weight: Number(a.visual_weight),
    enabled: a.enabled,
    wheel_color: a.wheel_color,
    wheel_glow_jackpot: a.wheel_glow_jackpot,
    plinko_slot_index: a.plinko_slot_index,
    slot_symbol_key: a.slot_symbol_key,
    slot_payline_tier: a.slot_payline_tier,
    display_sort: a.display_sort,
    created_at: toIso(a.created_at),
    updated_at: toIso(a.updated_at),
    prize: toPrizeRow(p),
  };
}
