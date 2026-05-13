"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameConfigResponse, PlinkoPlayResult } from "@/types/database";
import { GameHud } from "@/components/games/game-hud";
import { WinOverlay } from "@/components/games/win-overlay";
import { useGameSessionStore } from "@/stores/game-session-store";
import { fireJackpotConfetti, fireWinConfetti } from "@/components/games/confetti-burst";

const COLS = 9;
const ROWS = 12;

function pegs() {
  const list: { x: number; y: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    const offset = r % 2 === 0 ? 0 : 0.5;
    for (let c = 0; c < COLS; c++) {
      list.push({ x: (c + offset) / COLS - 0.15, y: (r + 1) / (ROWS + 3) });
    }
  }
  return list;
}

export function PlinkoGame() {
  const [cfg, setCfg] = useState<GameConfigResponse["plinko"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [ball, setBall] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.06 });
  const [result, setResult] = useState<PlinkoPlayResult | null>(null);
  const sessionId = useGameSessionStore((s) => s.sessionId);
  const recent = useGameSessionStore((s) => s.recentAssignmentIds);
  const pushAssignment = useGameSessionStore((s) => s.pushAssignment);
  const pegList = useMemo(() => pegs(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/games/plinko/config");
      const data = (await res.json()) as GameConfigResponse;
      if (!cancelled && data.plinko) setCfg(data.plinko);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slotTargetX = useCallback(
    (idx: number, count: number) => {
      const pad = 0.08;
      const span = 1 - pad * 2;
      return pad + (idx / Math.max(1, count - 1 || 1)) * span;
    },
    [],
  );

  const drop = useCallback(async () => {
    if (busy || !cfg?.slots.length) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/games/plinko/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, recentAssignmentIds: recent }),
      });
      const json = (await res.json()) as PlinkoPlayResult | { error: string };
      if (!res.ok || "error" in json) {
        console.error(json);
        return;
      }
      const data = json;
      const maxIdx = Math.max(...cfg.slots.map((s) => s.slotIndex));
      const count = maxIdx + 1;
      const tx = slotTargetX(data.targetSlotIndex, count);
      setBall({ x: 0.5 + (Math.random() - 0.5) * 0.04, y: 0.06 });
      setBall({ x: 0.5, y: 0.06 });
      await new Promise((r) => setTimeout(r, 30));
      setBall({ x: 0.48 + (Math.random() - 0.5) * 0.05, y: 0.32 });
      await new Promise((r) => setTimeout(r, 220));
      setBall({ x: 0.52, y: 0.52 });
      await new Promise((r) => setTimeout(r, 260));
      setBall({ x: tx + (Math.random() - 0.5) * 0.03, y: 0.82 });
      await new Promise((r) => setTimeout(r, 340));
      const won = cfg.slots.find((s) => s.slotIndex === data.targetSlotIndex);
      if (won) pushAssignment(won.assignmentId);
      if (data.prize.rarity === "jackpot") fireJackpotConfetti();
      else if (["legendary", "epic"].includes(data.prize.rarity)) fireWinConfetti();
      setResult(data);
    } finally {
      setBusy(false);
    }
  }, [busy, cfg, pushAssignment, recent, sessionId, slotTargetX]);

  const slots = cfg?.slots.slice().sort((a, b) => a.slotIndex - b.slotIndex) ?? [];

  return (
    <div className="relative min-h-[100dvh] bg-[radial-gradient(circle_at_50%_-10%,rgba(249,115,22,0.22),transparent_50%),linear-gradient(180deg,#050506,#020202)] px-4 pb-10 pt-4 text-white md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <GameHud
          title="Digital Plinko"
          onPlayAgain={() => setResult(null)}
          staffReset={() => {
            setResult(null);
            setBall({ x: 0.5, y: 0.06 });
          }}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="relative aspect-[10/16] w-full overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.9)]">
            <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(120deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_26px]" />
            {pegList.map((p, i) => (
              <div
                key={i}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-500 shadow-[0_0_12px_rgba(249,115,22,0.35)]"
                style={{ left: `${(p.x + 0.15) * 100}%`, top: `${p.y * 100}%` }}
              />
            ))}

            <motion.div
              className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-300/70 bg-gradient-to-br from-orange-500 to-amber-300 shadow-[0_0_30px_rgba(249,115,22,0.8)]"
              animate={{ left: `${ball.x * 100}%`, top: `${ball.y * 100}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            />

            <div className="absolute inset-x-0 bottom-0 h-[16%] border-t border-white/10 bg-black/55 backdrop-blur-md">
              <div className="flex h-full">
                {slots.map((s) => (
                  <div
                    key={s.assignmentId}
                    className="flex flex-1 flex-col items-center justify-center border-r border-white/5 px-1 text-center last:border-r-0"
                  >
                    <span className="font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase leading-tight text-orange-200">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Controls</p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold uppercase">
              Drop the puck
            </h3>
            <p className="mt-3 text-sm text-zinc-400">
              Physics-forward motion with a server-selected, inventory-safe landing. The house always knows the
              inventory — the crowd only feels the bounce.
            </p>
            <button
              type="button"
              disabled={busy || slots.length === 0}
              onClick={() => void drop()}
              className="mt-6 h-16 w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 text-lg font-bold uppercase tracking-wide text-white shadow-[0_0_34px_rgba(249,115,22,0.45)] transition enabled:hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Dropping…" : "Release puck"}
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
