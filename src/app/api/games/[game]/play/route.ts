import { NextResponse } from "next/server";
import type { GameType } from "@/types/database";
import { playPlinko, playSlots, playWheel } from "@/lib/games/play";
import { z } from "zod";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  recentAssignmentIds: z.array(z.string().min(1).max(128)).max(12).optional().default([]),
});

const games: GameType[] = ["wheel", "plinko", "slots"];

export async function POST(
  req: Request,
  ctx: { params: Promise<{ game: string }> },
) {
  const { game } = await ctx.params;
  if (!games.includes(game as GameType)) {
    return NextResponse.json({ error: "Unknown game" }, { status: 400 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { sessionId, recentAssignmentIds } = parsed.data;
  try {
    if (game === "wheel") {
      const result = await playWheel({ sessionId, recentAssignmentIds });
      return NextResponse.json(result);
    }
    if (game === "plinko") {
      const result = await playPlinko({ sessionId, recentAssignmentIds });
      return NextResponse.json(result);
    }
    const result = await playSlots({ sessionId, recentAssignmentIds });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Play failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
