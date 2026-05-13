import Link from "next/link";
import { count, gte, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEffectiveStatsSince } from "@/lib/stats-window";
import type { GameType } from "@/types/database";
import { tryGetDb } from "@/db/index";
import { plays } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const since = await getEffectiveStatsSince();
  const sinceDate = new Date(since);
  const db = tryGetDb();

  let playCount = 0;
  let playRows: { game: string }[] = [];
  let distinctPrizes = 0;

  if (db) {
    const [pc] = await db.select({ c: count() }).from(plays).where(gte(plays.created_at, sinceDate));
    playCount = Number(pc?.c ?? 0);
    playRows = await db.select({ game: plays.game }).from(plays).where(gte(plays.created_at, sinceDate));
    const [dc] = await db
      .select({ c: sql<number>`count(distinct ${plays.prize_id})::int` })
      .from(plays)
      .where(gte(plays.created_at, sinceDate));
    distinctPrizes = Number(dc?.c ?? 0);
  }

  const freq: Record<string, number> = {};
  for (const row of playRows) {
    const g = row.game as string;
    freq[g] = (freq[g] ?? 0) + 1;
  }
  let mostPlayed: GameType | "—" = "—";
  let top = 0;
  for (const [g, c] of Object.entries(freq)) {
    if (c > top) {
      top = c;
      mostPlayed = g as GameType;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold uppercase">
          Event command
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Snapshot of this activation. For full distribution analytics, jump into the analytics workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">Total plays (since reset)</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold text-white">{playCount}</CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">Most played game</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold capitalize text-orange-200">{mostPlayed}</CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">Unique prizes won</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold text-white">{distinctPrizes}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/10 bg-gradient-to-br from-orange-500/15 via-black/20 to-cyan-500/10">
          <CardHeader>
            <CardTitle>Prize engine</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-300">
            Configure weights independent of wheel arc sizing, preview expected blends, and keep inventory honest
            with automatic disable-at-zero behavior.
          </CardContent>
          <CardContent>
            <Link
              href="/admin/prizes"
              className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              Open prize lab
            </Link>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-300">
            Heatmaps and mix by game for the current stats window — tune the floor while the crowd is still
            here.
          </CardContent>
          <CardContent>
            <Link
              href="/admin/analytics"
              className="inline-flex rounded-full border border-orange-500/40 px-5 py-2 text-sm font-medium text-orange-200 hover:bg-orange-500/10"
            >
              Open analytics
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
