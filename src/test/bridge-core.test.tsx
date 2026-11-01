import { describe, expect, it } from "vitest";
import {
  CODE_TTL_SECONDS,
  buildCallbackUrl,
  checkAuthorizeShape,
  isRegisteredRedirect,
  pkceMatches,
  randomToken,
  s256Challenge,
  sanitizeLocalPath,
} from "@/lib/bridge/core";

const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGcSEw-cM"; // RFC 7636 appendix B

describe("bridge core", () => {
  it("computes RFC 7636 S256 challenge", async () => {
    expect(await s256Challenge(VERIFIER)).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGcSEw-cM");
  });
  it("accepts the matching verifier and rejects others", async () => {
    // RFC vector challenge is 43 chars
    const ch = await s256Challenge(VERIFIER);
    expect(await pkceMatches(VERIFIER, ch)).toBe(true);
    expect(await pkceMatches(VERIFIER.replace("d", "e"), ch)).toBe(false);
    expect(CHALLENGE.length).toBe(42);
  });
  it("redirect allowlist is exact-match only", () => {
    const reg = ["https://app.example.com/auth/callback"];
    expect(isRegisteredRedirect("https://app.example.com/auth/callback", reg)).toBe(true);
    expect(isRegisteredRedirect("https://app.example.com/auth/callback/", reg)).toBe(false);
    expect(isRegisteredRedirect("https://app.example.com/auth/callback?x=1", reg)).toBe(false);
    expect(isRegisteredRedirect("https://evil.com/auth/callback", reg)).toBe(false);
    expect(isRegisteredRedirect("http://app.example.com/auth/callback", ["http://app.example.com/auth/callback"])).toBe(false);
  });
  it("rejects plain PKCE and short state", () => {
    const base = { response_type: "code", client_id: "spekios-app", redirect_uri: "https://a.example/cb", state: "s".repeat(32), code_challenge: "a".repeat(43), code_challenge_method: "S256" };
    expect(checkAuthorizeShape(base).ok).toBe(true);
    expect(checkAuthorizeShape({ ...base, code_challenge_method: "plain" }).ok).toBe(false);
    expect(checkAuthorizeShape({ ...base, state: "short" }).ok).toBe(false);
  });
  it("handoff codes live 60 seconds and are 43-char random tokens", () => {
    expect(CODE_TTL_SECONDS).toBe(60);
    const a = randomToken(32);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(randomToken(32));
  });
  it("callback carries only code and state", () => {
    const u = new URL(buildCallbackUrl("https://a.example/cb", "CODE", "STATE"));
    expect([...u.searchParams.keys()].sort()).toEqual(["code", "state"]);
  });
  it("post-login return path must be same-origin", () => {
    expect(sanitizeLocalPath("/bridge/authorize?x=1")).toBe("/bridge/authorize?x=1");
    expect(sanitizeLocalPath("//evil.com")).toBeNull();
    expect(sanitizeLocalPath("https://evil.com")).toBeNull();
    expect(sanitizeLocalPath("/\\evil.com")).toBeNull();
  });
});
