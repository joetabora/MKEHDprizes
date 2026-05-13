import type { GameConfigResponse, GameType } from "@/types/database";
import {
  DEFAULT_SLOT_SYMBOLS,
  hasPlayableAssignments,
  toPlinkoSlots,
  toWheelSegments,
} from "@/lib/prize-engine";
import { fetchAssignments } from "@/lib/games/data";

export async function buildPublicGameConfig(game: GameType): Promise<GameConfigResponse> {
  const rows = await fetchAssignments(game);
  const ready = hasPlayableAssignments(rows);
  if (game === "wheel") {
    return { ready, wheel: { segments: toWheelSegments(rows) } };
  }
  if (game === "plinko") {
    return {
      ready,
      plinko: {
        slots: toPlinkoSlots(rows),
        pegRows: 12,
        pegCols: 9,
      },
    };
  }
  return {
    ready,
    slots: {
      symbols: [...DEFAULT_SLOT_SYMBOLS],
      reelCount: 3,
    },
  };
}
