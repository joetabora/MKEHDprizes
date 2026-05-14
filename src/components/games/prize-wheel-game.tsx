"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { GameConfigResponse, WheelSegmentPublic } from "@/types/database";
import type { WheelPlayResult } from "@/types/database";
import { GameHud } from "@/components/games/game-hud";
import { WinOverlay } from "@/components/games/win-overlay";
import { useGameSessionStore } from "@/stores/game-session-store";
import { fireJackpotConfetti, fireWinConfetti } from "@/components/games/confetti-burst";
import { useGameSounds } from "@/hooks/use-game-sounds";
import { useKioskStore } from "@/stores/kiosk-store";
import { FloorSetupNeeded } from "@/components/games/floor-setup-needed";

function polar(r: number, angle: number) {
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

function wedgePath(r: number, start: number, end: number) {
  const p1 = polar(r, start);
  const p2 = polar(r, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M 0 0 L ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
}

export function PrizeWheelGame() {
  const [segments, setSegments] = useState<WheelSegmentPublic[]>([]);
  const [inventoryReady, setInventoryReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelPlayResult | null>(null);
  const rotation = useMotionValue(0);
  const sounds = useGameSounds();
  const reduced = useKioskStore((s) => s.reducedMotion);
  const sessionId = useGameSessionStore((s) => s.sessionId);
  const recent = useGameSessionStore((s) => s.recentAssignmentIds);
  const pushAssignment = useGameSessionStore((s) => s.pushAssignment);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/games/wheel/config");
        const data = (await res.json()) as GameConfigResponse;
        if (!cancelled) {
          setInventoryReady(data.ready !== false);
          if (data.wheel?.segments) {
            setSegments(data.wheel.segments);
          }
        }
      } catch {
        if (!cancelled) setInventoryReady(false);
      } finally {
        if (!cancelled) requestAnimationFrame(() => setLoading(false));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const centersDeg = useMemo(() => {
    let acc = 0;
    return segments.map((s) => {
      const start = acc;
      acc += s.angleFraction;
      const center = (start + s.angleFraction / 2) * 360;
      return center;
    });
  }, [segments]);

  const play = useCallback(async () => {
    if (spinning || segments.length === 0 || inventoryReady !== true) return;
    sounds.resumeAudio();
    sounds.spin();
    setSpinning(true);
    setResult(null);
    try {
      const res = await fetch("/api/games/wheel/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, recentAssignmentIds: recent }),
      });
      const json = (await res.json()) as WheelPlayResult | { error: string };
      if (!res.ok || "error" in json) {
        console.error(json);
        setSpinning(false);
        return;
      }
      const data = json;
      const center = centersDeg[data.winningSegmentIndex] ?? 0;
      const extraTurns = data.spinTurns ?? 5;
      const current = rotation.get();
      const normalize = (d: number) => ((d % 360) + 360) % 360;
      const targetBase = -center;
      const cycle = extraTurns * 360;
      const adjusted =
        current -
        normalize(current - targetBase) -
        cycle -
        (10 + Math.random() * 6) * (reduced ? 0 : 1);

      await animate(rotation, adjusted, {
        duration: reduced ? 0.85 : 5.8,
        ease: reduced ? "easeOut" : [0.12, 0.8, 0.16, 1],
      });

      const seg = segments[data.winningSegmentIndex];
      if (seg) pushAssignment(seg.assignmentId);

      if (data.prize.rarity === "jackpot") {
        fireJackpotConfetti();
        sounds.winBig();
      } else if (["legendary", "epic"].includes(data.prize.rarity)) {
        fireWinConfetti();
        sounds.winBig();
      } else {
        sounds.winSmall();
      }
      setResult(data);
    } finally {
      setSpinning(false);
    }
  }, [
    centersDeg,
    inventoryReady,
    pushAssignment,
    recent,
    rotation,
    segments,
    sessionId,
    spinning,
    sounds,
    reduced,
  ]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.18),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(14,165,233,0.12),transparent_40%),linear-gradient(180deg,#09090b,#020202)] px-4 pb-8 pt-4 text-white md:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <GameHud
          title="Prize Wheel"
          onPlayAgain={() => setResult(null)}
          staffReset={() => {
            setResult(null);
            rotation.set(0);
          }}
        />

        {!loading && inventoryReady === false ? <FloorSetupNeeded gameLabel="the wheel" /> : null}

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative mx-auto aspect-square w-full max-w-xl">
            <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2">
              <div className="h-0 w-0 border-x-[18px] border-x-transparent border-t-[28px] border-t-orange-400 drop-shadow-[0_0_18px_rgba(249,115,22,0.9)]" />
            </div>
            <div className="relative grid h-full w-full place-items-center">
              <div className="absolute inset-[-8%] rounded-full bg-gradient-to-b from-orange-500/30 via-transparent to-cyan-500/20 blur-3xl" />
              <motion.div
                className="relative aspect-square w-[88%] rounded-full border-4 border-white/10 bg-zinc-950/60 shadow-[0_0_60px_rgba(0,0,0,0.85)]"
                style={{ rotate: rotation }}
              >
                <svg viewBox="-120 -120 240 240" className="h-full w-full">
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {segments.map((seg, i) => {
                    const start = segments
                      .slice(0, i)
                      .reduce((a, s) => a + s.angleFraction * Math.PI * 2, 0);
                    const end = start + seg.angleFraction * Math.PI * 2;
                    return (
                      <g key={seg.assignmentId} filter={seg.isJackpot ? "url(#glow)" : undefined}>
                        <path d={wedgePath(118, start - Math.PI / 2, end - Math.PI / 2)} fill={seg.color} opacity={0.95} stroke="rgba(0,0,0,0.45)" strokeWidth={1.2} />
                        {(() => {
                          const mid = (start + end) / 2 - Math.PI / 2;
                          const labelR = 74;
                          const tx = Math.cos(mid) * labelR;
                          const ty = Math.sin(mid) * labelR;
                          const midDeg = (mid * 180) / Math.PI;
                          // Diagonal run through the slice (not radial): tilt baseline vs horizontal.
                          let rotDeg = midDeg + 32;
                          rotDeg = ((rotDeg % 360) + 360) % 360;
                          if (rotDeg > 90 && rotDeg < 270) rotDeg += 180;
                          const display =
                            seg.label.length > 18 ? `${seg.label.slice(0, 17)}…` : seg.label;
                          return (
                            <text
                              transform={`rotate(${rotDeg}, ${tx}, ${ty})`}
                              x={tx}
                              y={ty}
                              fill="white"
                              fontSize={10}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="font-[family-name:var(--font-display)] uppercase"
                              letterSpacing="0.06em"
                              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.85)" }}
                            >
                              {display}
                            </text>
                          );
                        })()}
                      </g>
                    );
                  })}
                  <circle r="22" fill="#0a0a0a" stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
                  <text
                    y="4"
                    textAnchor="middle"
                    className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.28em] fill-orange-200"
                  >
                    Spin
                  </text>
                </svg>
              </motion.div>
              <button
                type="button"
                disabled={spinning || loading || segments.length === 0 || inventoryReady !== true}
                onClick={() => void play()}
                className="absolute left-1/2 top-1/2 z-30 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-orange-400/70 bg-gradient-to-br from-orange-600 to-amber-500 text-lg font-black uppercase tracking-wide text-white shadow-[0_0_40px_rgba(249,115,22,0.55)] transition enabled:hover:scale-[1.03] enabled:active:scale-[0.98] disabled:opacity-60"
              >
                {spinning ? "…" : "Fire"}
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-5 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
            <p className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.35em] text-zinc-500">
              Floor copy
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-semibold uppercase leading-tight text-white md:text-5xl">
              Built Milwaukee tough. Spun dealership fair.
            </h2>
            <p className="text-lg text-zinc-300">
              Tap Fire for a weighted, inventory-aware outcome — prizes go out on the spot at the desk.
            </p>
            <ul className="grid gap-3 text-sm text-zinc-400 md:grid-cols-2">
              <li className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">Touch-native HUD</li>
              <li className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">Kiosk fullscreen</li>
              <li className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">Jackpot glow slices</li>
              <li className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">Arcade slowdown curve</li>
            </ul>
          </div>
        </div>
      </div>

      {result && (
        <WinOverlay open prize={result.prize} onClose={() => setResult(null)} />
      )}
    </div>
  );
}
