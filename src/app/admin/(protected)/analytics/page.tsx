import { gte } from "drizzle-orm";
import { getEffectiveStatsSince } from "@/lib/stats-window";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsResetButton } from "@/components/admin/stats-reset-button";
import { tryGetDb } from "@/db/index";
import { plays } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const since = await getEffectiveStatsSince();
  const sinceDate = new Date(since);
  const db = tryGetDb();

  const playList = db
    ? await db
        .select({ created_at: plays.created_at, game: plays.game, prize_id: plays.prize_id })
        .from(plays)
        .where(gte(plays.created_at, sinceDate))
    : [];

  const hours = Array.from({ length: 24 }, (_, h) => h);
  const heat = hours.map((h) => {
    const count = playList.filter((p) => {
      const raw = p.created_at;
      const d = raw instanceof Date ? raw : new Date(raw as string);
      return d.getHours() === h;
    }).length;
    return { h, count };
  });
  const max = Math.max(1, ...heat.map((x) => x.count));

  const byGame: Record<string, number> = {};
  for (const p of playList) {
    byGame[p.game as string] = (byGame[p.game as string] ?? 0) + 1;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase">
            Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Plays since the last stats reset. Use this as a live telemetry rail during rallies.
          </p>
        </div>
        <StatsResetButton />
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Gameplay heatmap (local hour)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {heat.map(({ h, count: hourCount }) => (
              <div
                key={h}
                className="flex min-w-[36px] flex-1 basis-[4.16%] flex-col items-center gap-2"
              >
                <div
                  className="h-16 w-full rounded-lg bg-gradient-to-t from-orange-600/20 to-orange-400/90"
                  style={{ opacity: 0.25 + (0.75 * hourCount) / max }}
                  title={`${h}:00 — ${hourCount} plays`}
                />
                <span className="text-[10px] text-zinc-500">{h}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Mix by game</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {Object.entries(byGame).map(([g, c]) => (
            <div key={g} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500">{g}</p>
              <p className="mt-2 text-3xl font-bold text-white">{c}</p>
              <div className="mt-3 h-2 rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${Math.min(100, (c / (playList.length || 1)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {Object.keys(byGame).length === 0 && (
            <p className="text-sm text-zinc-500">No plays recorded in this window yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
