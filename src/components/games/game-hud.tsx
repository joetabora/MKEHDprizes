"use client";

import { Maximize2, Minimize2, Volume2, VolumeX, RotateCcw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKioskStore } from "@/stores/kiosk-store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useRef } from "react";
import { enterFullscreen, exitFullscreen } from "@/hooks/use-fullscreen-kiosk";
import { useGameSessionStore } from "@/stores/game-session-store";
import { useGameSounds } from "@/hooks/use-game-sounds";

export function GameHud({
  title,
  onPlayAgain,
  staffReset,
  className,
}: {
  title: string;
  onPlayAgain?: () => void;
  staffReset?: () => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sound = useKioskStore((s) => s.soundEnabled);
  const setSound = useKioskStore((s) => s.setSound);
  const sounds = useGameSounds();
  const resetSession = useGameSessionStore((s) => s.resetSession);

  const toggleFs = useCallback(async () => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      await exitFullscreen();
    } else {
      await enterFullscreen(containerRef.current?.parentElement ?? document.documentElement);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.28em] text-zinc-500">
          Live floor
        </p>
        <p className="truncate font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-50">
          {title}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="h-12 min-w-[52px] rounded-xl border border-white/10 bg-white/5 px-3 hover:bg-white/10"
          onClick={() => {
            sounds.resumeAudio();
            setSound(!sound);
            sounds.click();
          }}
          aria-label="Toggle sound"
        >
          {sound ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="h-12 min-w-[52px] rounded-xl border border-white/10 bg-white/5 px-3 hover:bg-white/10"
          onClick={() => void toggleFs()}
          aria-label="Toggle fullscreen"
        >
          {typeof document !== "undefined" && document.fullscreenElement ? (
            <Minimize2 className="h-6 w-6" />
          ) : (
            <Maximize2 className="h-6 w-6" />
          )}
        </Button>
        {onPlayAgain && (
          <Button
            type="button"
            size="lg"
            className="h-12 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 text-base font-semibold text-white shadow-[0_0_32px_rgba(249,115,22,0.35)]"
            onClick={() => {
              sounds.click();
              onPlayAgain();
            }}
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Play again
          </Button>
        )}
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 rounded-xl border-orange-500/50 bg-transparent text-orange-200 hover:bg-orange-500/10"
          onClick={() => {
            sounds.click();
            staffReset?.();
            resetSession();
          }}
        >
          Staff reset
        </Button>
        <Link
          href="/"
          className="inline-flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-medium text-zinc-300 hover:bg-white/5"
        >
          <LogOut className="h-5 w-5" />
          Lobby
        </Link>
      </div>
    </div>
  );
}
