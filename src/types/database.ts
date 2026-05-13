export type RarityTier =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "jackpot";

export type GameType = "wheel" | "plinko" | "slots";

export interface PrizeRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  rarity: RarityTier;
  quantity_total: number;
  quantity_remaining: number;
  active: boolean;
  redemption_instructions: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrizeAssignmentRow {
  id: string;
  prize_id: string;
  game: GameType;
  probability_weight: number;
  visual_weight: number;
  enabled: boolean;
  wheel_color: string | null;
  wheel_glow_jackpot: boolean;
  plinko_slot_index: number | null;
  slot_symbol_key: string | null;
  slot_payline_tier: number;
  display_sort: number;
  created_at: string;
  updated_at: string;
}

export interface PlayRow {
  id: string;
  game: GameType;
  prize_id: string | null;
  assignment_id: string | null;
  session_id: string;
  client_meta: Record<string, unknown>;
  server_meta: Record<string, unknown>;
  created_at: string;
}

export interface RedemptionRow {
  id: string;
  play_id: string;
  prize_id: string;
  code: string;
  status: "pending" | "redeemed" | "expired";
  claim_later: boolean;
  redeemed_at: string | null;
  redeemed_by: string | null;
  created_at: string;
}

/** Joined row used by engines — includes assignment + prize */
export interface AssignmentWithPrize extends PrizeAssignmentRow {
  prize: PrizeRow;
}

/** Public-safe segment for wheel rendering (no probability) */
export interface WheelSegmentPublic {
  assignmentId: string;
  prizeId: string;
  label: string;
  color: string;
  isJackpot: boolean;
  /** 0–1 fraction of full circle for arc drawing */
  angleFraction: number;
}

export interface PlinkoSlotPublic {
  assignmentId: string;
  prizeId: string;
  slotIndex: number;
  label: string;
  rarity: RarityTier;
  isJackpot: boolean;
}

export interface SlotSymbolPublic {
  key: string;
  emoji: string;
  label: string;
  isWild: boolean;
}

export interface GameConfigResponse {
  /** False when using the database but nothing is playable for this game (add assignments + stock in admin). */
  ready: boolean;
  wheel?: { segments: WheelSegmentPublic[] };
  plinko?: {
    slots: PlinkoSlotPublic[];
    pegRows: number;
    pegCols: number;
  };
  slots?: {
    symbols: SlotSymbolPublic[];
    reelCount: number;
  };
}

export interface PlayResultPrize {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  rarity: RarityTier;
  redemptionInstructions: string | null;
}

export interface WheelPlayResult {
  game: "wheel";
  playId: string;
  assignmentId: string;
  prize: PlayResultPrize;
  /** Index in segments array (config order) */
  winningSegmentIndex: number;
  /** Extra rotations for animation */
  spinTurns: number;
  redemptionCode: string;
}

export interface PlinkoPlayResult {
  game: "plinko";
  playId: string;
  assignmentId: string;
  prize: PlayResultPrize;
  targetSlotIndex: number;
  redemptionCode: string;
}

export interface SlotsPlayResult {
  game: "slots";
  playId: string;
  assignmentId: string;
  prize: PlayResultPrize;
  reelResults: string[];
  /** Which reel shows near-miss (0-based), or null */
  nearMissReel: number | null;
  redemptionCode: string;
}

export type AnyPlayResult = WheelPlayResult | PlinkoPlayResult | SlotsPlayResult;
