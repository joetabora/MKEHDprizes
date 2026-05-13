/** HMAC-signed admin session cookie; uses Web Crypto (works in Edge middleware + Node). */

export const ADMIN_SESSION_COOKIE = "mke_admin_session";
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 days

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hexStr: string): Uint8Array | null {
  if (hexStr.length % 2 !== 0) return null;
  const out = new Uint8Array(hexStr.length / 2);
  for (let i = 0; i < hexStr.length; i += 2) {
    const byte = Number.parseInt(hexStr.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) return null;
    out[i / 2] = byte;
  }
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createAdminSessionToken(secret: string): Promise<string> {
  const exp = Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000;
  const payload = String(exp);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${hex(sig)}`;
}

export async function verifyAdminSessionToken(token: string, secret: string): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sigHex = token.slice(dot + 1);
  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const parsed = hexToBytes(sigHex);
  if (!parsed) return false;
  const sigBytes = new Uint8Array(parsed);
  const key = await hmacKey(secret);
  const payloadBytes = new TextEncoder().encode(payload);
  return crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
}
