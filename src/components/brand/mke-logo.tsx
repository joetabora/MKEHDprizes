"use client";

import { motion } from "framer-motion";

export function MkeLogo({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-orange-500/40 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-[0_0_40px_rgba(249,115,22,0.25)]">
        <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-orange-400">
          MKE
        </span>
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-2xl"
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            boxShadow: "inset 0 0 32px rgba(249,115,22,0.35)",
          }}
        />
      </div>
      <div className="leading-tight">
        <p className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.35em] text-zinc-500">
          Milwaukee
        </p>
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold uppercase tracking-wide text-zinc-100">
          Harley-Davidson
        </p>
        <p className="text-sm font-medium text-orange-300/80">Prize Hub</p>
      </div>
    </motion.div>
  );
}
