/**
 * Human-friendly redemption codes for loud event floors.
 */
export function generateRedemptionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
      "",
    );
  return `MKE-${part()}-${part()}`;
}
