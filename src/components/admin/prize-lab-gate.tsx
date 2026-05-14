"use client";

import dynamic from "next/dynamic";

/**
 * Base UI Select is not SSR-safe: the trigger resolves the selected label before
 * the item list exists on the server, which can throw in production. Load the lab
 * only after mount.
 */
const PrizeLab = dynamic(
  () => import("@/components/admin/prize-lab").then((m) => ({ default: m.PrizeLab })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="h-[560px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      </div>
    ),
  },
);

export function PrizeLabGate() {
  return <PrizeLab />;
}
