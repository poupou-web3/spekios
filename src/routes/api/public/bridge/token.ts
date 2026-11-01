import { createFileRoute } from "@tanstack/react-router";
import {
  REDEEM_LIMIT_PER_MINUTE_PER_CLIENT,
  REDEEM_LIMIT_PER_MINUTE_PER_IP,
  isValidClientId,
  isValidCodeFormat,
  isValidVerifier,
  pkceMatches,
  sha256Hex,
  timingSafeEqual,
} from "@/lib/bridge/core";

const HEADERS = {
  "content-type": "application/json",
  "cache-control": "no-store",
  pragma: "no-cache",
};

function err(status: number, error: string, description: string, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error, error_description: description }), {
    status,
    headers: { ...HEADERS, ...extra },
  });
}

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  const text = (await request.text()).slice(0, 8192);
  const out: Record<string, string> = {};
  if (type.includes("application/json")) {
    try {
      const j = JSON.parse(text) as Record<string, unknown>;
      for (const [k, v] of Object.entries(j)) if (typeof v === "string") out[k] = v;
    } catch {
      /* empty */
    }
  } else {
    new URLSearchParams(text).forEach((v, k) => (out[k] = v));
  }
  return out;
}

function basicAuth(request: Request): { id: string; secret: string } | null {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Basic ")) return null;
  try {
    const raw = atob(h.slice(6));
    const i = raw.indexOf(":");
    if (i < 0) return null;
    return { id: decodeURIComponent(raw.slice(0, i)), secret: decodeURIComponent(raw.slice(i + 1)) };
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/bridge/token")({
  server: {
    handlers: {
      GET: async () => err(405, "invalid_request", "Use POST.", { allow: "POST" }),
      POST: async ({ request }) => {
        const body = await readBody(request);
        const basic = basicAuth(request);
        const clientId = basic?.id ?? body.client_id;
        const clientSecret = basic?.secret ?? body.client_secret;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const { data: ipOk } = await supabaseAdmin.rpc("bridge_rate_hit", {
          p_bucket: `redeem-ip:${ip}`,
          p_window_seconds: 60,
          p_max: REDEEM_LIMIT_PER_MINUTE_PER_IP,
        });
        if (ipOk !== true) return err(429, "slow_down", "Rate limit exceeded.", { "retry-after": "60" });

        if (body.grant_type !== "authorization_code") {
          return err(400, "unsupported_grant_type", "grant_type must be authorization_code.");
        }
        if (!isValidClientId(clientId) || typeof clientSecret !== "string" || clientSecret.length < 32) {
          return err(401, "invalid_client", "Client authentication failed.");
        }

        const { data: clientOk } = await supabaseAdmin.rpc("bridge_rate_hit", {
          p_bucket: `redeem-client:${clientId}`,
          p_window_seconds: 60,
          p_max: REDEEM_LIMIT_PER_MINUTE_PER_CLIENT,
        });
        if (clientOk !== true) return err(429, "slow_down", "Rate limit exceeded.", { "retry-after": "60" });

        const { data: client } = await supabaseAdmin
          .from("bridge_clients")
          .select("client_id, secret_sha256, enabled")
          .eq("client_id", clientId)
          .maybeSingle();
        const presented = await sha256Hex(clientSecret);
        if (!client || !client.enabled || !timingSafeEqual(presented, client.secret_sha256)) {
          return err(401, "invalid_client", "Client authentication failed.");
        }

        const code = body.code;
        const verifier = body.code_verifier;
        const redirectUri = body.redirect_uri;
        if (!isValidCodeFormat(code) || !isValidVerifier(verifier) || typeof redirectUri !== "string") {
          return err(400, "invalid_request", "code, code_verifier and redirect_uri are required.");
        }

        // Atomic single-use consumption: the code is burned before any other check,
        // so a wrong verifier or redirect cannot be retried against the same code.
        const { data: rows, error: rpcError } = await supabaseAdmin.rpc("consume_bridge_code", {
          p_code_hash: await sha256Hex(code),
        });
        if (rpcError) return err(500, "server_error", "Temporary failure.");
        const row = Array.isArray(rows) ? rows[0] : undefined;
        if (!row) return err(400, "invalid_grant", "Code is invalid, expired or already used.");

        const valid =
          row.client_id === clientId &&
          row.redirect_uri === redirectUri &&
          new Date(row.expires_at).getTime() > Date.now() &&
          (await pkceMatches(verifier, row.code_challenge));
        if (!valid) return err(400, "invalid_grant", "Code is invalid, expired or already used.");

        // Opportunistic cleanup of stale codes.
        await supabaseAdmin
          .from("bridge_handoff_codes")
          .delete()
          .lt("expires_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());

        return new Response(
          JSON.stringify({
            iss: row.issuer,
            sub: row.subject,
            aud: row.client_id,
            email: row.email,
            email_verified: row.email_verified,
            providers: row.providers,
            auth_time: row.auth_time ? Math.floor(new Date(row.auth_time).getTime() / 1000) : null,
            handoff_id: row.id,
            issued_at: Math.floor(new Date(row.created_at).getTime() / 1000),
          }),
          { status: 200, headers: HEADERS },
        );
      },
    },
  },
});
