"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameConfigResponse, SlotsPlayResult } from "@/types/database";
import { GameHud } from "@/components/games/game-hud";
import { WinOverlay } from "@/components/games/win-overlay";
import { useGameSessionStore } from "@/stores/game-session-store";
import { fireJackpotConfetti, fireWinConfetti } from "@/components/games/confetti-burst";
import { DEFAULT_SLOT_SYMBOLS } from "@/lib/prize-engine";
import { FloorSetupNeeded } from "@/components/games/floor-setup-needed";

const REEL_SYMBOLS = DEFAULT_SLOT_SYMBOLS;

function makeStrip(centerKey: string) {
  const keys = REEL_SYMBOLS.map((s) => s.key);
  const pad = Array.from({ length: 22 }, (_, i) => keys[i % keys.length]);
  const mid = 14;
  return [...pad.slice(0, mid), centerKey, ...pad.slice(mid)];
}

/** Longer reel strip so the motion scrolls through many symbols before landing. */
function makeExtendedStrip(centerKey: string, reelIndex: number): string[] {
  const keys = REEL_SYMBOLS.map((s) => s.key);
  const inner = makeStrip(centerKey);
  const leadLen = 36 + Math.floor(Math.random() * 18) + reelIndex * 5;
  const lead = Array.from(
    { length: leadLen },
    (_, i) => keys[(i * 5 + reelIndex * 3 + 7) % keys.length],
  );
  return [...lead, ...inner];
}

function rowHeight() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches ? 64 : 54;
}

export function SlotsGame() {
  const [, setCfg] = useState<GameConfigResponse["slots"] | null>(null);
  const [floorReady, setFloorReady] = useState<boolean | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [strips, setStrips] = useState<[string[], string[], string[]]>(() => [
    makeStrip("TIRE"),
    makeStrip("TIRE"),
    makeStrip("TIRE"),
  ]);
  const [offsets, setOffsets] = useState<[number, number, number]>([0, 0, 0]);
  const [result, setResult] = useState<SlotsPlayResult | null>(null);
  const sessionId = useGameSessionStore((s) => s.sessionId);
  const recent = useGameSessionStore((s) => s.recentAssignmentIds);
  const pushAssignment = useGameSessionStore((s) => s.pushAssignment);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/games/slots/config");
        const data = (await res.json()) as GameConfigResponse;
        if (!cancelled) {
          setFloorReady(data.ready !== false);
          if (data.slots) setCfg(data.slots);
        }
      } catch {
        if (!cancelled) setFloorReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rowH = useMemo(() => 54, []);

  const spin = useCallback(async () => {
    if (spinning || floorReady !== true) return;
    setSpinning(true);
    setResult(null);
    try {
      const res = await fetch("/api/games/slots/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, recentAssignmentIds: recent }),
      });
      const json = (await res.json()) as SlotsPlayResult | { error: string };
      if (!res.ok || "error" in json) {
        console.error(json);
        return;
      }
      const data = json;
      const h = rowHeight();
      const nextStrips: [string[], string[], string[]] = [
        makeExtendedStrip(data.reelResults[0] ?? "TIRE", 0),
        makeExtendedStrip(data.reelResults[1] ?? "TIRE", 1),
        makeExtendedStrip(data.reelResults[2] ?? "TIRE", 2),
      ];
      setStrips(nextStrips);
      const nextOffsets: [number, number, number] = [0, 0, 0];
      setOffsets(nextOffsets);
      await new Promise((r) => requestAnimationFrame(r));
      const targetOffsets = nextStrips.map((strip, idx) => {
        const key = data.reelResults[idx] ?? "TIRE";
        const inner = makeStrip(key);
        const innerRow = inner.lastIndexOf(key);
        const row = strip.length - inner.length + innerRow;
        const base = (strip.length - row) * h;
        const near = data.nearMissReel === idx ? Math.floor(Math.random() * 2 + 1) * (h / 3) : 0;
        return base + near;
      }) as [number, number, number];
      setOffsets(targetOffsets);
      await new Promise((r) => setTimeout(r, 3400));
      if (data.prize.rarity === "jackpot") fireJackpotConfetti();
      else if (["legendary", "epic"].includes(data.prize.rarity)) fireWinConfetti();
      pushAssignment(data.assignmentId);
      setResult(data);
    } finally {
      setSpinning(false);
    }
  }, [floorReady, pushAssignment, recent, sessionId, spinning]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(249,115,22,0.25),transparent_55%),radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.12),transparent_50%),#040404] px-4 pb-12 pt-4 text-white md:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(-12deg,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_10px)]" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6">
        <GameHud
          title="Iron Bank Slots"
          onPlayAgain={() => setResult(null)}
          staffReset={() => {
            setResult(null);
            setOffsets([0, 0, 0]);
            setStrips([makeStrip("TIRE"), makeStrip("TIRE"), makeStrip("TIRE")]);
          }}
        />

        {floorReady === false ? <FloorSetupNeeded gameLabel="slots" /> : null}

        <div className="rounded-[36px] border border-orange-500/25 bg-gradient-to-b from-zinc-950/90 via-black to-zinc-950/90 p-6 shadow-[0_0_90px_rgba(249,115,22,0.18)] md:p-10">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-orange-200/70">Milwaukee floor</p>
              <h2 className="font-[family-name:var(--font-display)] text-4xl font-semibold uppercase md:text-5xl">
                Highway jackpot cabinet
              </h2>
            </div>
            <p className="max-w-md text-sm text-zinc-400">
              Reels honor a server-authored outcome with near-miss cadence on premium rarities — suspense without
              exposing the underlying weights.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-5">
            {strips.map((strip, i) => (
              <div
                key={i}
                className="relative h-64 overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] md:h-80"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black via-black/70 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-black via-black/70 to-transparent" />
                <motion.div
                  className="absolute left-0 right-0 flex flex-col items-center"
                  initial={false}
                  animate={{ y: -offsets[i] }}
                  transition={{
                    duration: spinning ? 2.85 : 0,
                    ease: spinning ? [0.08, 0.55, 0.18, 1] : "easeOut",
                    delay: i * 0.22,
                  }}
                >
                  {strip.map((k, idx) => {
                    const sym = REEL_SYMBOLS.find((s) => s.key === k);
                    return (
                      <div
                        key={`${i}-${idx}-${k}`}
                        className="flex h-[54px] w-full items-center justify-center border-b border-white/5 text-3xl md:h-[64px] md:text-4xl"
                      >
                        {sym?.emoji}
                      </div>
                    );
                  })}
                </motion.div>
                <div className="pointer-events-none absolute inset-y-8 left-1/2 z-20 w-[92%] -translate-x-1/2 rounded-2xl border border-orange-400/40 shadow-[0_0_40px_rgba(249,115,22,0.25)]" />
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
              {REEL_SYMBOLS.map((s) => (
                <span key={s.key} className="rounded-full border border-white/5 bg-white/5 px-3 py-1">
                  {s.emoji} {s.label}
                </span>
              ))}
            </div>
            <button
              type="button"
              disabled={spinning || floorReady !== true}
              onClick={() => void spin()}
              className="h-16 min-w-[220px] rounded-2xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 px-8 font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-[0.12em] text-black shadow-[0_0_40px_rgba(249,115,22,0.45)] transition enabled:hover:brightness-110 disabled:opacity-60"
            >
              {spinning ? "Rolling…" : "Crank it"}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <WinOverlay
          open
          prize={result.prize}
          code={result.redemptionCode}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}
