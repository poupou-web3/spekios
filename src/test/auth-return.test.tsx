import { describe, expect, it } from "vitest";
import { authCallbackUrl, isComputerDevice, postLoginPath, sanitizeAuthReturn } from "@/lib/bridge/auth-return";

const params = new URLSearchParams({ response_type: "code", client_id: "spekios-local", redirect_uri: "http://localhost:18080/auth/callback", state: "test-state-preserved-0123456789", code_challenge: "a".repeat(43), code_challenge_method: "S256" });
const authorize = `/bridge/authorize?${params}`;

describe("sign-in return continuity", () => {
  it("direct login falls back to account without a fabricated attempt", () => {
    expect(postLoginPath(undefined, null)).toBe("/account");
    expect(authCallbackUrl("https://spekios.com", undefined)).toBe("https://spekios.com/auth");
  });
  it("preserves original state and PKCE in OAuth/email URL without storage", () => {
    const callback = new URL(authCallbackUrl("https://spekios.com", authorize));
    expect(callback.origin).toBe("https://spekios.com");
    expect(callback.pathname).toBe("/auth");
    expect(callback.searchParams.get("redirect")).toBe(authorize);
    expect(postLoginPath(callback.searchParams.get("redirect"), null)).toBe(authorize);
  });
  it("URL return takes precedence over storage, with storage as fallback", () => {
    expect(postLoginPath(authorize, "/account")).toBe(authorize);
    expect(postLoginPath(undefined, authorize)).toBe(authorize);
  });
  it("rejects arbitrary URLs, paths, nested redirects and malformed attempts", () => {
    for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/logout", "/auth", "/account?redirect=https://evil.test", "/bridge/authorize?x=1", `${authorize}&redirect=https://evil.test`, `${authorize}&state=duplicate`, `${authorize}#fragment`, "/\n/evil.test"]) {
      expect(sanitizeAuthReturn(path)).toBeNull();
      expect(postLoginPath(path, null)).toBe("/account");
    }
  });
  it("does not classify phones or tablets, including desktop-mode iPad, as computers", () => {
    expect(isComputerDevice("Mozilla iPhone Mobile", 5)).toBe(false);
    expect(isComputerDevice("Mozilla Android", 5)).toBe(false);
    expect(isComputerDevice("Mozilla Macintosh", 5)).toBe(false);
    expect(isComputerDevice("Mozilla iPad", 1)).toBe(false);
    expect(isComputerDevice("Mozilla Macintosh", 0)).toBe(true);
    expect(isComputerDevice("Mozilla Windows NT", 0)).toBe(true);
  });
});