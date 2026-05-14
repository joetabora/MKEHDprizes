export const WHEEL_ICONS = [
  { key: "star", emoji: "⭐", label: "Star" },
  { key: "shirt", emoji: "👕", label: "Shirt" },
  { key: "credit_card", emoji: "💳", label: "Credit card" },
  { key: "bag", emoji: "🛍️", label: "Bag" },
  { key: "soda", emoji: "🥤", label: "Drink" },
  { key: "sticker", emoji: "🏷️", label: "Sticker" },
  { key: "helmet", emoji: "🪖", label: "Helmet" },
  { key: "motorcycle", emoji: "🏍️", label: "Bike" },
  { key: "wrench", emoji: "🔧", label: "Wrench" },
  { key: "oil", emoji: "🛢️", label: "Oil" },
  { key: "gift", emoji: "🎁", label: "Gift" },
  { key: "ticket", emoji: "🎟️", label: "Ticket" },
] as const;

export type WheelIconKey = (typeof WHEEL_ICONS)[number]["key"];

export const DEFAULT_WHEEL_ICON_KEY: WheelIconKey = "star";

const byKey = new Map<string, (typeof WHEEL_ICONS)[number]>(
  WHEEL_ICONS.map((x) => [x.key, x]),
);

export function normalizeWheelIconKey(key: string | null | undefined): WheelIconKey {
  if (key && byKey.has(key)) return key as WheelIconKey;
  return DEFAULT_WHEEL_ICON_KEY;
}

export function wheelIconEmoji(key: string | null | undefined): string {
  return byKey.get(normalizeWheelIconKey(key))?.emoji ?? "⭐";
}
