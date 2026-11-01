import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { checkBridgeRequest, issueHandoffCode } from "@/lib/bridge/bridge.functions";
import type { AuthorizeParams } from "@/lib/bridge/core";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

const KEYS = ["response_type", "client_id", "redirect_uri", "state", "code_challenge", "code_challenge_method"] as const;

export const Route = createFileRoute("/bridge/authorize")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): AuthorizeParams => {
    const out: AuthorizeParams = {};
    for (const k of KEYS) if (typeof s[k] === "string") out[k] = s[k] as string;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Continue to Spekios" },
      { name: "description", content: "Sign in to continue to the Spekios app." },
      { property: "og:title", content: "Continue to Spekios" },
      { property: "og:description", content: "Sign in to continue to the Spekios app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BridgeAuthorize,
});

function BridgeAuthorize() {
  const params = Route.useSearch();
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const check = useServerFn(checkBridgeRequest);
  const issue = useServerFn(issueHandoffCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["bridge-check", params], queryFn: () => check({ data: params }), retry: false });
  const here = `/bridge/authorize?${new URLSearchParams(params as Record<string, string>).toString()}`;

  async function proceed() {
    setBusy(true);
    setError(null);
    try {
      const { redirect } = await issue({ data: params });
      window.location.assign(redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not continue");
      setBusy(false);
    }
  }

  async function switchAccount() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: here }, replace: true });
  }

  if (q.isLoading || !ready) return <AuthShell title="Continue to Spekios"><p className="text-sm text-muted-foreground">Checking request…</p></AuthShell>;

  if (q.isError || !q.data) {
    return <AuthShell title="Something went wrong"><p className="text-sm text-muted-foreground">We couldn't verify this request. Please try again from the Spekios app.</p></AuthShell>;
  }

  if (!q.data.ok) {
    // Never redirect anywhere on an unverified request: show the problem here instead.
    return (
      <AuthShell title={q.data.code === "not_configured" ? "App connection pending" : "This link isn't valid"}>
        <p className="text-sm text-muted-foreground">
          {q.data.code === "not_configured"
            ? "The Spekios app isn't connected to this sign-in yet, so we can't send you there. Your account still works here."
            : `This sign-in link was rejected: ${q.data.reason}`}
        </p>
        <Button asChild variant="outline" className="mt-5"><Link to="/account">Go to your account</Link></Button>
      </AuthShell>
    );
  }

  if (!session) {
    return (
      <AuthShell title="Sign in to continue" subtitle={<>to <strong>{q.data.clientName}</strong></>}>
        <div className="grid gap-2">
          <Button asChild><Link to="/auth" search={{ redirect: here }}>Sign in</Link></Button>
          <Button asChild variant="outline"><Link to="/auth" search={{ mode: "signup", redirect: here }}>Create an account</Link></Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Continue to Spekios" subtitle={<>Signing in to <strong>{q.data.clientName}</strong></>}>
      <p className="min-w-0 text-sm">Signed in as <span className="block min-w-0 break-words font-mono [overflow-wrap:anywhere]">{session.user.email}</span></p>
      <div className="mt-5 grid gap-2">
        <Button className="min-h-12" onClick={proceed} disabled={busy}>{busy ? "Continuing…" : "Continue"}</Button>
        <Button className="min-h-12" variant="ghost" onClick={switchAccount}>Use a different account</Button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </AuthShell>
  );
}
