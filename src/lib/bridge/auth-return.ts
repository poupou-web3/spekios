import { checkAuthorizeShape, sanitizeLocalPath, type AuthorizeParams } from "./core";

export const RETURN_KEY = "spekios:return-to";
const KEYS = ["response_type", "client_id", "redirect_uri", "state", "code_challenge", "code_challenge_method"] as const;

// Only existing account and bridge surfaces, never arbitrary return destinations.
export function sanitizeAuthReturn(value: unknown): string | null {
  const path = sanitizeLocalPath(value);
  if (!path || /[\x00-\x20\x7f]/.test(path) || path.includes("#")) return null;
  if (path === "/account") return path;
  const url = new URL(path, "https://spekios.invalid");
  if (url.pathname !== "/bridge/authorize" || !path.startsWith("/bridge/authorize?")) return null;
  const params: AuthorizeParams = {};
  for (const key of KEYS) {
    if (url.searchParams.getAll(key).length !== 1) return null;
    params[key] = url.searchParams.get(key) ?? undefined;
  }
  if ([...url.searchParams.keys()].some((key) => !KEYS.some((allowed) => allowed === key))) return null;
  return checkAuthorizeShape(params).ok ? path : null;
}

export function postLoginPath(redirect: unknown, stored: unknown): string {
  return sanitizeAuthReturn(redirect) ?? sanitizeAuthReturn(stored) ?? "/account";
}

export function authCallbackUrl(origin: string, redirect: unknown): string {
  const url = new URL("/auth", origin);
  const safe = sanitizeAuthReturn(redirect);
  if (safe) url.searchParams.set("redirect", safe);
  return url.href;
}

export function isComputerDevice(userAgent: string, touchPoints: number): boolean {
  return !/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(userAgent) && !(/Macintosh/i.test(userAgent) && touchPoints > 1);
}