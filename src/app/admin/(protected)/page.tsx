import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEffectiveStatsSince } from "@/lib/stats-window";
import type { GameType } from "@/types/database";

export default async function AdminHomePage() {
  const supa = await createServerSupabaseClient();
  const since = await getEffectiveStatsSince(supa);

  const [{ count: playCount }, { data: plays }, { count: pendingRedemptions }] = await Promise.all([
    supa.from("plays").select("*", { count: "exact", head: true }).gte("created_at", since),
    supa.from("plays").select("game").gte("created_at", since),
    supa.from("redemptions").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const freq: Record<string, number> = {};
  for (const row of plays ?? []) {
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
          <CardContent className="text-4xl font-bold text-white">{playCount ?? 0}</CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">Most played game</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold capitalize text-orange-200">{mostPlayed}</CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">Pending redemptions</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold text-white">{pendingRedemptions ?? 0}</CardContent>
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
            <CardTitle>Redemption desk</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-300">
            Claim codes generated on-device — reconcile quickly while lines are still hot.
          </CardContent>
          <CardContent>
            <Link
              href="/admin/redemptions"
              className="inline-flex rounded-full border border-orange-500/40 px-5 py-2 text-sm font-medium text-orange-200 hover:bg-orange-500/10"
            >
              Review queue
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
