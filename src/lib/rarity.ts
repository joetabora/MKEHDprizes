import type { RarityTier } from "@/types/database";

const ORDER: RarityTier[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "jackpot",
];

export function rarityIndex(tier: RarityTier): number {
  return ORDER.indexOf(tier);
}

export function rarityLabel(tier: RarityTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/** Display colors — garage neon + Harley orange energy */
export function rarityUi(tier: RarityTier): {
  fg: string;
  bg: string;
  border: string;
  glow: string;
} {
  switch (tier) {
    case "common":
      return {
        fg: "text-zinc-200",
        bg: "bg-zinc-800/80",
        border: "border-zinc-600",
        glow: "shadow-[0_0_20px_rgba(161,161,170,0.25)]",
      };
    case "uncommon":
      return {
        fg: "text-emerald-200",
        bg: "bg-emerald-950/70",
        border: "border-emerald-600/60",
        glow: "shadow-[0_0_24px_rgba(16,185,129,0.35)]",
      };
    case "rare":
      return {
        fg: "text-sky-200",
        bg: "bg-sky-950/70",
        border: "border-sky-500/50",
        glow: "shadow-[0_0_26px_rgba(14,165,233,0.4)]",
      };
    case "epic":
      return {
        fg: "text-violet-200",
        bg: "bg-violet-950/80",
        border: "border-violet-500/60",
        glow: "shadow-[0_0_30px_rgba(168,85,247,0.45)]",
      };
    case "legendary":
      return {
        fg: "text-amber-100",
        bg: "bg-amber-950/80",
        border: "border-amber-500/70",
        glow: "shadow-[0_0_36px_rgba(245,158,11,0.55)]",
      };
    case "jackpot":
      return {
        fg: "text-orange-50",
        bg: "bg-orange-950/90",
        border: "border-orange-400",
        glow: "shadow-[0_0_48px_rgba(249,115,22,0.75)]",
      };
    default:
      return {
        fg: "text-zinc-200",
        bg: "bg-zinc-900",
        border: "border-zinc-600",
        glow: "",
      };
  }
}

export const RARITY_OPTIONS: { value: RarityTier; label: string }[] = ORDER.map(
  (value) => ({ value, label: rarityLabel(value) }),
);
