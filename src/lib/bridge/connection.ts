export type LaunchClient = {
  enabled: boolean;
  redirect_uris: readonly string[];
  launch_url: string | null;
};

export type BridgeConnection =
  | { type: "pending"; configured: false; launchUrl: null; address: null }
  | { type: "local" | "hosted"; configured: true; launchUrl: string; address: string };

const pending: BridgeConnection = { type: "pending", configured: false, launchUrl: null, address: null };

// Check raw authority before URL parsing: URL normalizes alternate IPv4 spellings.
function trustedUrl(value: string): URL | null {
  if (value !== value.trim() || /[\\\s]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || value.includes("?") || value.includes("#")) return null;
    if (url.protocol === "https:") return url;
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(value)) return url;
  } catch { /* Invalid configuration fails closed. */ }
  return null;
}

export function resolveConnection(clients: readonly LaunchClient[]): BridgeConnection {
  const supported: BridgeConnection[] = [];
  for (const client of clients) {
    if (!client.enabled) continue;
    const callbacks = client.redirect_uris.map(trustedUrl).filter((u): u is URL => u !== null);
    const derived = callbacks.find((u) => u.protocol === "http:" && u.pathname === "/auth/callback");
    const target = client.launch_url ?? (derived ? `${derived.origin}/login` : null);
    if (!target) continue;
    const launch = trustedUrl(target);
    if (!launch || launch.pathname !== "/login" || target !== `${launch.origin}/login`) continue;
    if (!callbacks.some((u) => u.origin === launch.origin)) continue;
    supported.push({ type: launch.protocol === "http:" ? "local" : "hosted", configured: true, launchUrl: launch.href, address: launch.origin });
  }
  return supported.find((c) => c.type === "hosted") ?? supported[0] ?? pending;
}