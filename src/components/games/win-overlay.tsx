"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PlayResultPrize, RarityTier } from "@/types/database";
import { rarityLabel, rarityUi } from "@/lib/rarity";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export function WinOverlay({
  open,
  prize,
  code,
  onClose,
}: {
  open: boolean;
  prize: PlayResultPrize;
  code: string;
  onClose: () => void;
}) {
  const r = prize.rarity as RarityTier;
  const ui = rarityUi(r);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-black/70 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className={`relative max-w-lg overflow-hidden rounded-3xl border ${ui.border} ${ui.bg} ${ui.glow} p-8 text-center shadow-2xl`}
          >
            <div className={`mb-2 text-xs font-semibold uppercase tracking-[0.3em] ${ui.fg}`}>
              Winner
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold uppercase tracking-wide text-white md:text-5xl">
              {prize.name}
            </h2>
            <p className="mt-3 text-lg text-zinc-200/90">{prize.description}</p>
            <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 rounded-2xl border border-white/10 bg-black/35 p-5 text-left">
              <p className="text-xs uppercase tracking-widest text-zinc-400">Redemption code</p>
              <p className="font-mono text-3xl font-bold tracking-[0.2em] text-orange-200">{code}</p>
              {prize.redemptionInstructions && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{prize.redemptionInstructions}</p>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                <QrCode className="h-4 w-4" />
                Staff can scan or enter this code in Admin → Redemptions.
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-500">Tier: {rarityLabel(r)}</div>
            <Button
              type="button"
              size="lg"
              className="mt-8 h-14 w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 text-lg font-semibold"
              onClick={onClose}
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
