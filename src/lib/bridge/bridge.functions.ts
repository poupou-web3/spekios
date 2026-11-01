import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CODE_TTL_SECONDS,
  ISSUE_LIMIT_PER_MINUTE,
  buildCallbackUrl,
  canonicalIssuer,
  checkAuthorizeShape,
  isRegisteredRedirect,
  randomToken,
  sha256Hex,
  type AuthorizeParams,
} from "./core";

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
function parseParams(input: unknown): AuthorizeParams {
  const o = (input ?? {}) as Record<string, unknown>;
  return {
    response_type: str(o["response_type"]),
    client_id: str(o["client_id"]),
    redirect_uri: str(o["redirect_uri"]),
    state: str(o["state"]),
    code_challenge: str(o["code_challenge"]),
    code_challenge_method: str(o["code_challenge_method"]),
  };
}

type ClientRow = { client_id: string; display_name: string; redirect_uris: string[]; enabled: boolean };

async function loadClient(clientId: string): Promise<ClientRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("bridge_clients")
    .select("client_id, display_name, redirect_uris, enabled")
    .eq("client_id", clientId)
    .maybeSingle();
  return data && data.enabled ? data : null;
}

export type BridgeCheck =
  | { ok: true; clientName: string }
  | { ok: false; code: "invalid_request" | "not_configured"; reason: string };

async function validate(p: AuthorizeParams): Promise<BridgeCheck> {
  const shape = checkAuthorizeShape(p);
  if (!shape.ok) return { ok: false, code: "invalid_request", reason: shape.reason };
  const client = await loadClient(p.client_id!);
  if (!client) {
    return { ok: false, code: "not_configured", reason: "This app connection is not configured or is disabled." };
  }
  if (!isRegisteredRedirect(p.redirect_uri!, client.redirect_uris)) {
    return { ok: false, code: "invalid_request", reason: "redirect_uri is not registered for this client." };
  }
  return { ok: true, clientName: client.display_name };
}

/** Public: validates an authorize request. Reveals only whether it is acceptable. */
export const checkBridgeRequest = createServerFn({ method: "POST" })
  .inputValidator(parseParams)
  .handler(async ({ data }) => validate(data));

/** Signed-in: is any trusted external app configured yet? */
export const getBridgeStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("bridge_clients")
      .select("display_name, launch_url, redirect_uris")
      .eq("enabled", true);
    const ready = (data ?? []).filter((c) => c.redirect_uris.length > 0);
    const launch = ready.find((c) => c.launch_url && /^https:\/\//.test(c.launch_url));
    return { configured: ready.length > 0, launchUrl: launch?.launch_url ?? null };
  });

/** Signed-in: mint a single-use, short-lived handoff code and return the callback URL. */
export const issueHandoffCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseParams)
  .handler(async ({ data, context }) => {
    const check = await validate(data);
    if (!check.ok) throw new Error(check.reason);

    const { data: userRes, error: userErr } = await context.supabase.auth.getUser();
    const user = userRes?.user;
    if (userErr || !user || user.id !== context.userId) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: allowed } = await supabaseAdmin.rpc("bridge_rate_hit", {
      p_bucket: `issue:${user.id}`,
      p_window_seconds: 60,
      p_max: ISSUE_LIMIT_PER_MINUTE,
    });
    if (allowed !== true) throw new Error("Too many attempts. Please wait a minute and try again.");

    const projectRef = process.env["SUPABASE_PROJECT_ID"];
    if (!projectRef) throw new Error("Server misconfigured");

    const code = randomToken(32);
    const providers = Array.from(
      new Set((user.identities ?? []).map((i) => i.provider).filter(Boolean)),
    );
    const { error } = await supabaseAdmin.from("bridge_handoff_codes").insert({
      code_hash: await sha256Hex(code),
      client_id: data.client_id!,
      redirect_uri: data.redirect_uri!,
      code_challenge: data.code_challenge!,
      user_id: user.id,
      issuer: canonicalIssuer(projectRef),
      subject: user.id,
      email: user.email ?? null,
      email_verified: Boolean(user.email_confirmed_at),
      providers,
      auth_time: user.last_sign_in_at ?? null,
      expires_at: new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString(),
    });
    if (error) throw new Error("Could not create handoff");

    return { redirect: buildCallbackUrl(data.redirect_uri!, code, data.state!) };
  });
