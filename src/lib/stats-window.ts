import type { SupabaseClient } from "@supabase/supabase-js";
import { getStatsResetAt } from "@/lib/env";

export async function getEffectiveStatsSince(supa: SupabaseClient): Promise<string> {
  const env = getStatsResetAt()?.toISOString();
  const { data } = await supa
    .from("app_settings")
    .select("value")
    .eq("key", "stats_reset_at")
    .maybeSingle();
  const at = (data?.value as { at?: string } | null)?.at;
  if (at) return at;
  if (env) return env;
  return new Date(0).toISOString();
}
