import Link from "next/link";

export function FloorSetupNeeded({ gameLabel }: { gameLabel: string }) {
  return (
    <div
      className="rounded-2xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/95"
      role="status"
    >
      <p className="font-[family-name:var(--font-display)] text-base font-semibold uppercase tracking-wide text-amber-200">
        No floor inventory for {gameLabel}
      </p>
      <p className="mt-2 text-amber-100/85">
        Prizes only appear here after you add them in{" "}
        <Link href="/admin/prizes" className="font-medium text-white underline decoration-amber-400/80 underline-offset-2 hover:text-orange-200">
          Admin → Prize lab
        </Link>
        : scroll to <strong className="text-white">Game assignments</strong>, pick each prize, choose this game
        (wheel / plinko / slots), set probability weight, then <strong className="text-white">Add assignment</strong>.
        Plinko also needs a <strong className="text-white">slot index</strong>.
      </p>
    </div>
  );
}
