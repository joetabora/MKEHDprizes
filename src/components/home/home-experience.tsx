"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MkeLogo } from "@/components/brand/mke-logo";
import { useKioskStore } from "@/stores/kiosk-store";
import { Gamepad2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const idleMs = 45_000;

export function HomeExperience() {
  const [attract, setAttract] = useState(false);
  const timer = useRef<number | null>(null);
  const reduced = useKioskStore((s) => s.reducedMotion);

  const bumpIdle = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setAttract(false);
    timer.current = window.setTimeout(() => setAttract(true), idleMs);
  }, []);

  useEffect(() => {
    bumpIdle();
    const onVis = () => bumpIdle();
    window.addEventListener("pointerdown", bumpIdle);
    window.addEventListener("keydown", bumpIdle);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      window.removeEventListener("pointerdown", bumpIdle);
      window.removeEventListener("keydown", bumpIdle);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [bumpIdle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        toast.message("Staff console", {
          description: "Opening admin sign-in.",
          action: {
            label: "Go",
            onClick: () => {
              window.location.href = "/sign-in?redirect_url=" + encodeURIComponent("/admin");
            },
          },
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_15%_0%,rgba(249,115,22,0.2),transparent_45%),radial-gradient(circle_at_95%_30%,rgba(14,165,233,0.12),transparent_42%),linear-gradient(180deg,#050506,#020202)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(120deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-orange-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col gap-10 px-4 pb-16 pt-8 md:px-10 md:pt-12">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <MkeLogo />
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/sign-in?redirect_url=/admin"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-base font-medium text-white hover:bg-white/10"
            >
              Staff console
            </Link>
            <p className="text-xs text-zinc-500">
              Hidden shortcut:{" "}
              <kbd className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                ⌃⇧A
              </kbd>
            </p>
          </div>
        </header>

        <div className="space-y-4">
          <motion.p
            className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.35em] text-orange-200/80"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Live floor experience
          </motion.p>
          <motion.h1
            className="max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold uppercase leading-tight md:text-6xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Built for Milwaukee iron. Tuned for touchscreen theaters.
          </motion.h1>
          <motion.p
            className="max-w-2xl text-lg text-zinc-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Three premium activations — each with kiosk-ready controls, cinematic motion, and a secure back-office
            that never leaks odds to the crowd.
          </motion.p>
        </div>

        <div className="grid flex-1 gap-5 md:grid-cols-3 md:gap-6">
          <GameCard
            href="/game/wheel"
            title="Prize Wheel"
            subtitle="Arc physics • glowing jackpots"
            icon={<Sparkles className="h-8 w-8 text-orange-300" />}
            delay={0}
            reduced={reduced}
          />
          <GameCard
            href="/game/plinko"
            title="Digital Plinko"
            subtitle="Garage peg lattice • weighted landings"
            icon={<Gamepad2 className="h-8 w-8 text-cyan-300" />}
            delay={0.06}
            reduced={reduced}
          />
          <GameCard
            href="/game/slots"
            title="Iron Bank Slots"
            subtitle="Neon reels • near-miss cadence"
            icon={<Sparkles className="h-8 w-8 text-violet-300" />}
            delay={0.12}
            reduced={reduced}
          />
        </div>

        <footer className="border-t border-white/10 pt-8 text-center text-xs text-zinc-500 md:text-left">
          Sponsor rail + event presets ship in-console — tailor artwork per rally without forking code.
        </footer>
      </div>

      <AnimatePresence>
        {attract && (
          <motion.button
            type="button"
            className="fixed inset-0 z-40 grid place-items-center bg-black/78 p-6 text-center backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => bumpIdle()}
          >
            <div className="max-w-xl space-y-6">
              <p className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.4em] text-orange-200">
                Attract mode
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold uppercase md:text-5xl">
                Tap anywhere to wake the floor
              </h2>
              <p className="text-lg text-zinc-400">Idle overlay keeps burn-in calm on showroom panels.</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameCard({
  href,
  title,
  subtitle,
  icon,
  delay,
  reduced,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  delay: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduced ? 0 : delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduced ? undefined : { y: -4 }}
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/40 p-[1px] shadow-[0_0_60px_rgba(0,0,0,0.65)]"
    >
      <Link
        href={href}
        className="flex h-full min-h-[220px] flex-col justify-between rounded-[27px] bg-zinc-950/75 p-6 md:min-h-[260px] md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3 shadow-[0_0_32px_rgba(249,115,22,0.12)]">
            {icon}
          </div>
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-200">
            Play
          </span>
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold uppercase md:text-3xl">
            {title}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 via-transparent to-cyan-500/10" />
        </div>
      </Link>
    </motion.div>
  );
}
