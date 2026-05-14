import type {
  AssignmentWithPrize,
  GameType,
  PlinkoSlotPublic,
  RarityTier,
  WheelSegmentPublic,
} from "@/types/database";
import { rarityIndex } from "@/lib/rarity";
import { wheelIconEmoji } from "@/lib/wheel-icons";

export interface WeightedPickContext {
  game: GameType;
  sessionId: string;
  /** recent assignment ids in this session (newest last) */
  recentAssignmentIds: string[];
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSession(sessionId: string): number {
  let h = 2166136261;
  for (let i = 0; i < sessionId.length; i++) {
    h ^= sessionId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Applies gentle down-weighting if the same prize was won recently in-session.
 */
function applyRecentPenalty(
  weight: number,
  assignmentId: string,
  recent: string[],
): number {
  if (recent.length === 0) return weight;
  const last = recent[recent.length - 1];
  const last2 = recent[recent.length - 2];
  let factor = 1;
  if (last === assignmentId) factor *= 0.35;
  if (last2 === assignmentId) factor *= 0.65;
  return weight * factor;
}

export function pickWeightedAssignment(
  rows: AssignmentWithPrize[],
  ctx: WeightedPickContext,
  rng: () => number = Math.random,
): AssignmentWithPrize {
  const eligible = rows.filter(
    (r) =>
      r.enabled !== false &&
      r.prize.active &&
      r.prize.quantity_remaining > 0 &&
      Number(r.probability_weight) > 0,
  );

  if (eligible.length === 0) {
    throw new Error("No eligible prizes available for this game.");
  }

  const weights = eligible.map((r) =>
    applyRecentPenalty(Number(r.probability_weight), r.id, ctx.recentAssignmentIds),
  );
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    throw new Error("Probability configuration invalid (all weights zero).");
  }
  let roll = rng() * sum;
  for (let i = 0; i < eligible.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}

/** True when at least one assignment could be chosen for a play (matches pickWeighted eligibility). */
export function hasPlayableAssignments(rows: AssignmentWithPrize[]): boolean {
  const eligible = rows.filter(
    (r) =>
      r.enabled !== false &&
      r.prize.active &&
      r.prize.quantity_remaining > 0 &&
      Number(r.probability_weight) > 0,
  );
  if (eligible.length === 0) return false;
  const sum = eligible.reduce((a, r) => a + Number(r.probability_weight), 0);
  return sum > 0;
}

export function makeSeededRng(sessionId: string, salt: string): () => number {
  const base = hashSession(`${sessionId}:${salt}:${Date.now()}`);
  return mulberry32(base);
}

/** Normalize visual weights into arc fractions for the wheel */
export function toWheelSegments(rows: AssignmentWithPrize[]): WheelSegmentPublic[] {
  const active = rows
    .filter(
      (r) =>
        r.game === "wheel" &&
        r.enabled &&
        r.prize.active &&
        r.prize.quantity_remaining > 0,
    )
    .sort((a, b) => a.display_sort - b.display_sort || a.prize.name.localeCompare(b.prize.name));

  const vw = active.map((r) => Math.max(0.0001, Number(r.visual_weight)));
  const total = vw.reduce((a, b) => a + b, 0);
  return active.map((r, i) => ({
    assignmentId: r.id,
    prizeId: r.prize_id,
    label: r.prize.name,
    iconEmoji: wheelIconEmoji(r.prize.wheel_icon_key),
    color: r.wheel_color || defaultWheelColor(i, r.prize.rarity as RarityTier),
    isJackpot: r.wheel_glow_jackpot || r.prize.rarity === "jackpot",
    angleFraction: vw[i] / total,
  }));
}

function defaultWheelColor(i: number, rarity: RarityTier): string {
  const palette: Record<RarityTier, string> = {
    common: "#3f3f46",
    uncommon: "#065f46",
    rare: "#0369a1",
    epic: "#6d28d9",
    legendary: "#b45309",
    jackpot: "#ea580c",
  };
  const bump = ["#27272a", "#18181b"];
  return palette[rarity] || bump[i % bump.length];
}

export function toPlinkoSlots(rows: AssignmentWithPrize[]): PlinkoSlotPublic[] {
  const active = rows
    .filter(
      (r) =>
        r.game === "plinko" &&
        r.enabled &&
        r.prize.active &&
        r.prize.quantity_remaining > 0 &&
        r.plinko_slot_index != null,
    )
    .sort((a, b) => (a.plinko_slot_index ?? 0) - (b.plinko_slot_index ?? 0));

  return active.map((r) => ({
    assignmentId: r.id,
    prizeId: r.prize_id,
    slotIndex: r.plinko_slot_index!,
    label: r.prize.name,
    rarity: r.prize.rarity as RarityTier,
    isJackpot: r.prize.rarity === "jackpot",
  }));
}

export interface DistributionPreviewRow {
  label: string;
  rarity: RarityTier;
  weight: number;
  adjustedWeight: number;
  expectedPct: number;
}

export function previewDistribution(
  rows: AssignmentWithPrize[],
  recentAssignmentIds: string[] = [],
): DistributionPreviewRow[] {
  const eligible = rows.filter(
    (r) =>
      r.enabled &&
      r.prize.active &&
      r.prize.quantity_remaining > 0 &&
      Number(r.probability_weight) > 0,
  );
  const adjusted = eligible.map((r) =>
    applyRecentPenalty(Number(r.probability_weight), r.id, recentAssignmentIds),
  );
  const sum = adjusted.reduce((a, b) => a + b, 0) || 1;
  return eligible.map((r, i) => ({
    label: r.prize.name,
    rarity: r.prize.rarity as RarityTier,
    weight: Number(r.probability_weight),
    adjustedWeight: adjusted[i],
    expectedPct: (adjusted[i] / sum) * 100,
  }));
}

/** For slots: build synthetic symbol map from assignment keys */
export const DEFAULT_SLOT_SYMBOLS = [
  { key: "FLAME", emoji: "🔥", label: "Flame", isWild: false },
  { key: "SKULL", emoji: "💀", label: "Skull", isWild: false },
  { key: "PISTON", emoji: "⚙️", label: "Piston", isWild: false },
  { key: "TIRE", emoji: "🛞", label: "Tire", isWild: false },
  { key: "EAGLE", emoji: "🦅", label: "Eagle", isWild: false },
  { key: "WILD", emoji: "⭐", label: "Route Star", isWild: true },
] as const;

export function slotsSymbolForRarity(rarity: RarityTier): string {
  if (rarity === "jackpot" || rarity === "legendary") return "WILD";
  if (rarity === "epic") return "EAGLE";
  if (rarity === "rare") return "SKULL";
  if (rarity === "uncommon") return "PISTON";
  return "TIRE";
}

/** Final reel symbols always match the winning outcome; nearMissReel is a motion hint only. */
export function buildSlotReels(
  winningSymbol: string,
  rarity: RarityTier,
  rng: () => number,
): { reels: [string, string, string]; nearMissReel: number | null } {
  const reels: [string, string, string] = [winningSymbol, winningSymbol, winningSymbol];
  const bumpNear =
    rarityIndex(rarity) >= rarityIndex("rare") ? rng() < 0.5 : rng() < 0.28;
  if (!bumpNear) return { reels, nearMissReel: null };
  return { reels, nearMissReel: Math.floor(rng() * 3) };
}
