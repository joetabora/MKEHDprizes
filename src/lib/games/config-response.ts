import type { GameConfigResponse, GameType } from "@/types/database";
import { DEFAULT_SLOT_SYMBOLS, toPlinkoSlots, toWheelSegments } from "@/lib/prize-engine";
import { fetchAssignments } from "@/lib/games/data";

export async function buildPublicGameConfig(game: GameType): Promise<GameConfigResponse> {
  const rows = await fetchAssignments(game);
  if (game === "wheel") {
    return { wheel: { segments: toWheelSegments(rows) } };
  }
  if (game === "plinko") {
    return {
      plinko: {
        slots: toPlinkoSlots(rows),
        pegRows: 12,
        pegCols: 9,
      },
    };
  }
  return {
    slots: {
      symbols: [...DEFAULT_SLOT_SYMBOLS],
      reelCount: 3,
    },
  };
}
