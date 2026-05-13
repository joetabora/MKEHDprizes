import { NextResponse } from "next/server";
import type { GameType } from "@/types/database";
import { buildPublicGameConfig } from "@/lib/games/config-response";

const games: GameType[] = ["wheel", "plinko", "slots"];

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ game: string }> },
) {
  const { game } = await ctx.params;
  if (!games.includes(game as GameType)) {
    return NextResponse.json({ error: "Unknown game" }, { status: 400 });
  }
  const config = await buildPublicGameConfig(game as GameType);
  return NextResponse.json(config);
}
