import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getBridgeStatus } from "@/lib/bridge/bridge.functions";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppConnection } from "@/components/app-connection";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Your account — Spekios" },
      { name: "description", content: "Manage your Spekios account and app connection." },
      { property: "og:title", content: "Your account — Spekios" },
      { property: "og:description", content: "Manage your Spekios account and app connection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function Account() {
  const { session } = useAuth();
  const user = session?.user;
  const fetchStatus = useServerFn(getBridgeStatus);
  const status = useQuery({ queryKey: ["bridge-status"], queryFn: () => fetchStatus(), enabled: !!session });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const providers = Array.from(new Set(user?.identities?.map((i) => i.provider) ?? []));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow">Account</p>
        <h1 className="font-display mt-3 text-4xl sm:text-5xl">Your account is ready.</h1>

        <section className="mt-10 min-w-0 border-y border-border py-6">
          {status.isLoading ? (
            <p className="text-sm text-muted-foreground">Checking app connection…</p>
          ) : status.isError ? (
            <p className="text-sm text-destructive">Could not check the app connection. Please refresh.</p>
          ) : status.data ? <AppConnection connection={status.data} /> : null}
        </section>

        <section className="mt-6 grid min-w-0 gap-4 rounded-lg border border-border bg-card p-5 text-sm">
          <Row k="Email" v={user?.email ?? "—"} />
          <Row k="Email confirmed" v={user?.email_confirmed_at ? "Yes" : "No"} />
          <Row k="Sign-in methods" v={providers.join(", ") || "—"} />
        </section>

        {providers.includes("email") && <ChangePassword />}

        <div className="mt-8">
          <Button variant="outline" className="min-h-12" onClick={signOut}>Sign out</Button>
        </div>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid min-w-0 gap-1 border-b border-border pb-3 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="min-w-0 break-words font-mono [overflow-wrap:anywhere] sm:text-right">{v}</span>
    </div>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setCurrent("");
    setNext("");
    toast.success("Password updated");
  }
  return (
    <form onSubmit={submit} className="mt-6 grid min-w-0 gap-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-medium">Change password</h2>
      <div className="grid gap-1.5">
        <Label htmlFor="cur">Current password</Label>
        <Input id="cur" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new">New password</Label>
        <Input id="new" type="password" minLength={8} required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <Button type="submit" variant="outline" disabled={busy} className="min-h-12 justify-self-start">Update password</Button>
    </form>
  );
}
