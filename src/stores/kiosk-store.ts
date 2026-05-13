"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeId = "midnight-garage" | "orange-metro";

interface KioskState {
  soundEnabled: boolean;
  reducedMotion: boolean;
  theme: ThemeId;
  idleAnnounced: boolean;
  setSound: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  setTheme: (t: ThemeId) => void;
}

export const useKioskStore = create<KioskState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      reducedMotion: false,
      theme: "midnight-garage",
      idleAnnounced: false,
      setSound: (soundEnabled) => set({ soundEnabled }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "mke-hd-kiosk" },
  ),
);
