"use client";

import { useEffect } from "react";

export function useFullscreenKiosk(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    const onFsChange = () => {
      /* reserved for HUD state sync */
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [enabled]);
}

export async function enterFullscreen(el: HTMLElement | null) {
  if (!el || typeof document === "undefined") return;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    await el.requestFullscreen({ navigationUI: "hide" });
  } catch {
    /* kiosk browsers may block without gesture */
  }
}

export async function exitFullscreen() {
  if (typeof document === "undefined") return;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {
    /* ignore */
  }
}
