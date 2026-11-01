import { describe, expect, it } from "vitest";
import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { sitemapStaticPaths, sitemapXML } from "@/lib/sitemap";

describe("public sitemap", () => {
  it("includes the public homepage and excludes auth and private subtrees", () => {
    const root = createRootRoute({ staticData: { sitemap: false } });
    const home = createRoute({ getParentRoute: () => root, path: "/", staticData: { sitemap: true } });
    const auth = createRoute({ getParentRoute: () => root, path: "auth", staticData: { sitemap: false } });
    const privateLayout = createRoute({ getParentRoute: () => root, id: "_private", staticData: { sitemap: "exclude-subtree" } });
    const account = createRoute({ getParentRoute: () => privateLayout, path: "account", staticData: { sitemap: true } });
    const router = createRouter({ routeTree: root.addChildren([home, auth, privateLayout.addChildren([account])]) });
    expect(sitemapStaticPaths(router)).toEqual(["/"]);
  });
  it("uses the public origin without invented lastmod timestamps", () => {
    const xml = sitemapXML("https://spekios.com", [{ path: "/" }]);
    expect(xml).toContain("<loc>https://spekios.com/</loc>");
    expect(xml).not.toContain("<lastmod>");
  });
  it("rejects cross-origin paths", () => {
    expect(() => sitemapXML("https://spekios.com", [{ path: "//other.test/" }])).toThrow("Invalid sitemap path");
  });
});