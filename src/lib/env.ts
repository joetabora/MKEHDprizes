export function isLocalOnlyMode(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_ONLY_MODE === "true";
}

export function getStatsResetAt(): Date | null {
  const raw = process.env.STATS_RESET_AT;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}
