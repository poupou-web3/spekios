// Pure, runtime-agnostic helpers for the Spekios auth bridge (Web Crypto only).

export const CODE_TTL_SECONDS = 60;
export const ISSUE_LIMIT_PER_MINUTE = 10;
export const REDEEM_LIMIT_PER_MINUTE_PER_IP = 30;
export const REDEEM_LIMIT_PER_MINUTE_PER_CLIENT = 120;

const B64URL = /^[A-Za-z0-9_-]+$/;

export function isValidClientId(v: unknown): v is string {
  return typeof v === "string" && /^[a-z0-9][a-z0-9_-]{2,63}$/.test(v);
}

/** S256 challenge = base64url(sha256(verifier)) without padding: always 43 chars. */
export function isValidChallenge(v: unknown): v is string {
  return typeof v === "string" && v.length === 43 && B64URL.test(v);
}

/** RFC 7636 verifier: 43-128 chars of unreserved characters. */
export function isValidVerifier(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9._~-]{43,128}$/.test(v);
}

/** State must be opaque, printable, and long enough to carry real randomness. */
export function isValidState(v: unknown): v is string {
  return typeof v === "string" && /^[\x21-\x7E]{16,512}$/.test(v);
}

/** Handoff codes are 32 random bytes, base64url → 43 chars. */
export function isValidCodeFormat(v: unknown): v is string {
  return typeof v === "string" && v.length === 43 && B64URL.test(v);
}

/** Structural safety of a callback URL (allowlist membership is checked separately). */
export function isSafeRedirectUri(v: unknown): v is string {
  if (typeof v !== "string" || v.length > 2048) return false;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return false;
  }
  if (u.username || u.password || u.hash) return false;
  if (u.protocol === "https:") return true;
  return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
}

/** Exact string match only — no prefix, wildcard or normalization. */
export function isRegisteredRedirect(uri: string, registered: readonly string[]): boolean {
  return isSafeRedirectUri(uri) && registered.some((r) => r === uri);
}

export function sanitizeLocalPath(v: unknown): string | null {
  if (typeof v !== "string" || !v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return null;
  return v.length > 4096 ? null : v;
}

export function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomToken(byteLength = 32): string {
  const b = new Uint8Array(byteLength);
  crypto.getRandomValues(b);
  return base64url(b);
}

async function sha256(input: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)));
}

export async function sha256Hex(input: string): Promise<string> {
  return Array.from(await sha256(input), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function s256Challenge(verifier: string): Promise<string> {
  return base64url(await sha256(verifier));
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function pkceMatches(verifier: string, challenge: string): Promise<boolean> {
  if (!isValidVerifier(verifier) || !isValidChallenge(challenge)) return false;
  return timingSafeEqual(await s256Challenge(verifier), challenge);
}

export function buildCallbackUrl(redirectUri: string, code: string, state: string): string {
  const u = new URL(redirectUri);
  u.searchParams.set("code", code);
  u.searchParams.set("state", state);
  return u.toString();
}

export function canonicalIssuer(projectRef: string): string {
  return `https://${projectRef}.supabase.co/auth/v1`;
}

export type AuthorizeParams = {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
};

export type ParamCheck = { ok: true } | { ok: false; reason: string };

/** Structural checks on the authorize request before any DB lookup. */
export function checkAuthorizeShape(p: AuthorizeParams): ParamCheck {
  if (p.response_type !== "code") return { ok: false, reason: "response_type must be 'code'." };
  if (!isValidClientId(p.client_id)) return { ok: false, reason: "client_id is missing or malformed." };
  if (!isSafeRedirectUri(p.redirect_uri)) return { ok: false, reason: "redirect_uri is missing or not allowed." };
  if (!isValidState(p.state)) return { ok: false, reason: "state must be 16-512 printable characters." };
  if (p.code_challenge_method !== "S256") return { ok: false, reason: "code_challenge_method must be S256." };
  if (!isValidChallenge(p.code_challenge)) return { ok: false, reason: "code_challenge must be a 43-character base64url S256 value." };
  return { ok: true };
}
