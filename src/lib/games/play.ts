import type {
  GameType,
  AnyPlayResult,
  AssignmentWithPrize,
  PlayResultPrize,
  RarityTier,
} from "@/types/database";
import {
  buildSlotReels,
  makeSeededRng,
  pickWeightedAssignment,
  slotsSymbolForRarity,
  toWheelSegments,
} from "@/lib/prize-engine";
import { fetchAssignments } from "@/lib/games/data";
import { generateRedemptionCode } from "@/lib/redemption-code";
import { getDb, tryGetDb } from "@/db/index";
import { plays, redemptions, prizes, prizeAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isLocalOnlyMode } from "@/lib/env";
import { randomUUID } from "crypto";

function toPlayResultPrize(row: AssignmentWithPrize): PlayResultPrize {
  return {
    id: row.prize.id,
    name: row.prize.name,
    description: row.prize.description,
    imageUrl: row.prize.image_url,
    rarity: row.prize.rarity,
    redemptionInstructions: row.prize.redemption_instructions,
  };
}

async function persistPlay(opts: {
  game: GameType;
  assignment: AssignmentWithPrize;
  sessionId: string;
  serverMeta: Record<string, unknown>;
}): Promise<{ playId: string; redemptionCode: string }> {
  if (isLocalOnlyMode()) {
    return { playId: randomUUID(), redemptionCode: generateRedemptionCode() };
  }
  if (!tryGetDb()) {
    return { playId: randomUUID(), redemptionCode: generateRedemptionCode() };
  }
  const db = getDb();
  const code = generateRedemptionCode();

  const playId = await db.transaction(async (tx) => {
    const [play] = await tx
      .insert(plays)
      .values({
        game: opts.game,
        prize_id: opts.assignment.prize_id,
        assignment_id: opts.assignment.id,
        session_id: opts.sessionId,
        server_meta: opts.serverMeta,
      })
      .returning({ id: plays.id });

    if (!play) {
      throw new Error("Failed to record play");
    }

    await tx.insert(redemptions).values({
      play_id: play.id,
      prize_id: opts.assignment.prize_id,
      code,
      status: "pending",
      claim_later: false,
    });

    const newQty = Math.max(0, opts.assignment.prize.quantity_remaining - 1);
    await tx
      .update(prizes)
      .set({
        quantity_remaining: newQty,
        active: newQty > 0 ? opts.assignment.prize.active : false,
        updated_at: new Date(),
      })
      .where(eq(prizes.id, opts.assignment.prize_id));

    if (newQty === 0) {
      await tx
        .update(prizeAssignments)
        .set({ enabled: false, updated_at: new Date() })
        .where(eq(prizeAssignments.prize_id, opts.assignment.prize_id));
    }

    return play.id;
  });

  return { playId, redemptionCode: code };
}

export async function playWheel(opts: {
  sessionId: string;
  recentAssignmentIds: string[];
}): Promise<Extract<AnyPlayResult, { game: "wheel" }>> {
  const rows = await fetchAssignments("wheel");
  const rng = makeSeededRng(opts.sessionId, "wheel");
  const winner = pickWeightedAssignment(rows, {
    game: "wheel",
    sessionId: opts.sessionId,
    recentAssignmentIds: opts.recentAssignmentIds,
  });
  const segments = toWheelSegments(rows);
  const idx = segments.findIndex((s) => s.assignmentId === winner.id);
  const safeIdx = idx >= 0 ? idx : 0;
  const spinTurns = 4 + Math.floor(rng() * 4);

  const { playId, redemptionCode } = await persistPlay({
    game: "wheel",
    assignment: winner,
    sessionId: opts.sessionId,
    serverMeta: { winningSegmentIndex: safeIdx, spinTurns },
  });

  return {
    game: "wheel",
    playId,
    assignmentId: winner.id,
    prize: toPlayResultPrize(winner),
    winningSegmentIndex: safeIdx,
    spinTurns,
    redemptionCode,
  };
}

export async function playPlinko(opts: {
  sessionId: string;
  recentAssignmentIds: string[];
}): Promise<Extract<AnyPlayResult, { game: "plinko" }>> {
  const rows = await fetchAssignments("plinko");
  const rng = makeSeededRng(opts.sessionId, "plinko");
  const winner = pickWeightedAssignment(rows, {
    game: "plinko",
    sessionId: opts.sessionId,
    recentAssignmentIds: opts.recentAssignmentIds,
  });
  const slot = winner.plinko_slot_index ?? 0;

  const { playId, redemptionCode } = await persistPlay({
    game: "plinko",
    assignment: winner,
    sessionId: opts.sessionId,
    serverMeta: { targetSlotIndex: slot },
  });

  return {
    game: "plinko",
    playId,
    assignmentId: winner.id,
    prize: toPlayResultPrize(winner),
    targetSlotIndex: slot,
    redemptionCode,
  };
}

export async function playSlots(opts: {
  sessionId: string;
  recentAssignmentIds: string[];
}): Promise<Extract<AnyPlayResult, { game: "slots" }>> {
  const rows = await fetchAssignments("slots");
  const rng = makeSeededRng(opts.sessionId, "slots");
  const winner = pickWeightedAssignment(rows, {
    game: "slots",
    sessionId: opts.sessionId,
    recentAssignmentIds: opts.recentAssignmentIds,
  });
  const rarity = winner.prize.rarity as RarityTier;
  const sym = winner.slot_symbol_key || slotsSymbolForRarity(rarity);
  const { reels, nearMissReel } = buildSlotReels(sym, rarity, rng);

  const { playId, redemptionCode } = await persistPlay({
    game: "slots",
    assignment: winner,
    sessionId: opts.sessionId,
    serverMeta: { reels, nearMissReel },
  });

  return {
    game: "slots",
    playId,
    assignmentId: winner.id,
    prize: toPlayResultPrize(winner),
    reelResults: [...reels],
    nearMissReel,
    redemptionCode,
  };
}
