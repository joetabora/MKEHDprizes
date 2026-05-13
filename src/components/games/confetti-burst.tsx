"use client";

import confetti from "canvas-confetti";

export function fireJackpotConfetti() {
  const count = 160;
  const defaults = {
    origin: { y: 0.65 },
    spread: 80,
    ticks: 220,
    gravity: 0.9,
    decay: 0.94,
    startVelocity: 35,
    colors: ["#f97316", "#fbbf24", "#a3a3a3", "#0ea5e9", "#a855f7"],
  };
  confetti({ ...defaults, particleCount: count, scalar: 1.1 });
  window.setTimeout(() => {
    confetti({ ...defaults, particleCount: Math.floor(count * 0.6), scalar: 0.9 });
  }, 180);
}

export function fireWinConfetti() {
  confetti({
    particleCount: 70,
    spread: 60,
    origin: { y: 0.7 },
    colors: ["#f97316", "#fcd34d", "#e4e4e7"],
  });
}
