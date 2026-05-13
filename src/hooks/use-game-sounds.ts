"use client";

import { useKioskStore } from "@/stores/kiosk-store";

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function beep(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  const c = ctx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export function useGameSounds() {
  const enabled = useKioskStore((s) => s.soundEnabled);

  return {
    tick: () => enabled && beep(880, 0.04, "square", 0.05),
    click: () => enabled && beep(440, 0.06, "triangle", 0.06),
    spin: () => enabled && beep(120, 0.12, "sawtooth", 0.04),
    winSmall: () => {
      if (!enabled) return;
      beep(523, 0.08);
      setTimeout(() => beep(659, 0.1), 60);
    },
    winBig: () => {
      if (!enabled) return;
      [392, 494, 587, 784].forEach((f, i) => {
        setTimeout(() => beep(f, 0.14, "sine", 0.09), i * 90);
      });
    },
    nearMiss: () => enabled && beep(160, 0.2, "sawtooth", 0.05),
    resumeAudio: () => {
      void ctx()?.resume();
    },
  };
}
