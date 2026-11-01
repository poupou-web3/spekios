import { describe, expect, it } from "vitest";
import { resolveConnection } from "@/lib/bridge/connection";

const local = { enabled: true, redirect_uris: ["http://localhost:18080/auth/callback"], launch_url: null };
const hosted = { enabled: true, redirect_uris: ["https://app.example.test/auth/callback"], launch_url: "https://app.example.test/login" };

describe("trusted app launch configuration", () => {
  it("derives the known local /login target, never a callback", () => {
    expect(resolveConnection([local])).toEqual({ type: "local", configured: true, launchUrl: "http://localhost:18080/login", address: "http://localhost:18080" });
  });
  it("accepts explicitly registered literal 127.0.0.1", () => {
    expect(resolveConnection([{ ...local, redirect_uris: ["http://127.0.0.1:18080/auth/callback"], launch_url: "http://127.0.0.1:18080/login" }]).type).toBe("local");
  });
  it("rejects disabled and unregistered local targets", () => {
    expect(resolveConnection([{ ...local, enabled: false }]).configured).toBe(false);
    expect(resolveConnection([{ ...local, redirect_uris: [], launch_url: "http://localhost:18080/login" }]).configured).toBe(false);
  });
  it("requires the exact registered origin including port", () => {
    for (const launch_url of ["http://localhost:18081/login", "http://127.0.0.1:18080/login", "https://localhost:18080/login"]) {
      expect(resolveConnection([{ ...local, launch_url }]).type).toBe("pending");
    }
  });
  it("rejects nonliteral HTTP loopback spellings and remote HTTP", () => {
    for (const host of ["127.1", "2130706433", "0x7f000001", "127.000.000.001", "LOCALHOST", "localhost.", "localhost.evil.test", "[::1]", "app.example.test"]) {
      expect(resolveConnection([{ ...local, launch_url: `http://${host}:18080/login`, redirect_uris: [`http://${host}:18080/auth/callback`] }]).configured).toBe(false);
    }
  });
  it("rejects callback launches, query, fragment, userinfo and normalized paths", () => {
    for (const suffix of ["/auth/callback", "/login?x=1", "/login?", "/login#x", "/login#", "/login/", "/x/../login", "/%6cogin"]) {
      expect(resolveConnection([{ ...local, launch_url: `http://localhost:18080${suffix}` }]).type).toBe("pending");
    }
    expect(resolveConnection([{ ...local, launch_url: "http://user@localhost:18080/login" }]).configured).toBe(false);
    expect(resolveConnection([{ ...local, launch_url: "http://localhost:18080\\login" }]).configured).toBe(false);
  });
  it("accepts trusted HTTPS production launches and prefers hosted", () => {
    expect(resolveConnection([local, hosted])).toEqual({ type: "hosted", configured: true, launchUrl: "https://app.example.test/login", address: "https://app.example.test" });
    expect(resolveConnection([{ ...hosted, launch_url: "https://evil.example.test/login" }]).configured).toBe(false);
  });
  it("does not derive an absent hosted launch or mask an invalid explicit launch", () => {
    expect(resolveConnection([{ ...hosted, launch_url: null }]).configured).toBe(false);
    expect(resolveConnection([{ ...local, launch_url: "https://evil.test/login" }]).configured).toBe(false);
    expect(resolveConnection([{ ...local, redirect_uris: ["http://localhost:18080/other"] }]).configured).toBe(false);
  });
  it("keeps HTTPS loopback computer-only too", () => {
    expect(resolveConnection([{ ...local, redirect_uris: ["https://localhost:18080/auth/callback"], launch_url: "https://localhost:18080/login" }]).type).toBe("local");
  });
});