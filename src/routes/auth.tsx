import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { RETURN_KEY, authCallbackUrl, postLoginPath, sanitizeAuthReturn } from "@/lib/bridge/auth-return";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup" | "forgot";
type Search = { mode?: Mode | undefined; redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s["mode"] === "signup" || s["mode"] === "forgot" ? s["mode"] : undefined,
    redirect: sanitizeAuthReturn(s["redirect"]) ?? undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Spekios" },
      { name: "description", content: "Sign in or create your Spekios account." },
      { property: "og:title", content: "Sign in — Spekios" },
      { property: "og:description", content: "Sign in or create your Spekios account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "signin", redirect } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const { session, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // After any successful sign-in (password, OAuth return, email confirmation), go to the intended page.
  useEffect(() => {
    if (!ready || !session) return;
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(RETURN_KEY);
      sessionStorage.removeItem(RETURN_KEY);
    } catch { /* URL return survives browsers that block storage. */ }
    router.history.replace(postLoginPath(redirect, stored));
  }, [ready, session, redirect, router]);

  const setMode = (m: Mode) => {
    setNotice(null);
    navigate({ to: "/auth", search: { mode: m === "signin" ? undefined : m, redirect }, replace: true });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const emailReturn = authCallbackUrl(window.location.origin, redirect);
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: emailReturn } });
        if (error) throw error;
        if (!data.session) setNotice("Check your inbox to confirm your email address, then come back to sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("If an account exists for that email, a password reset link is on its way.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "google" | "apple") {
    const safe = sanitizeAuthReturn(redirect);
    try {
      if (safe) sessionStorage.setItem(RETURN_KEY, safe);
      else sessionStorage.removeItem(RETURN_KEY);
    } catch { /* Return is also encoded in the same-origin OAuth callback. */ }
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: authCallbackUrl(window.location.origin, safe) });
      if (result.error) toast.error(result.error.message ?? `Could not continue with ${provider}`);
    } catch {
      toast.error(`Could not continue with ${provider}. Please try again.`);
    }
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";

  return (
    <AuthShell
      title={title}
      subtitle={mode === "forgot" ? "We'll email you a secure link." : "Use email, Google or Apple."}
    >
      {mode !== "forgot" && (
        <>
          <div className="grid gap-2">
            <Button variant="outline" type="button" onClick={() => social("google")}>Continue with Google</Button>
            <Button variant="outline" type="button" onClick={() => social("apple")}>Continue with Apple</Button>
          </div>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== "forgot" && (
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "signin" && (
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
              )}
            </div>
            <Input id="password" type="password" minLength={8} required autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
        </Button>
        {notice && <p role="status" className="rounded-md bg-ok-soft p-3 text-sm text-foreground">{notice}</p>}
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>Already have an account? <button className="text-foreground underline" onClick={() => setMode("signin")}>Sign in</button></>
        ) : mode === "forgot" ? (
          <button className="text-foreground underline" onClick={() => setMode("signin")}>Back to sign in</button>
        ) : (
          <>New to Spekios? <button className="text-foreground underline" onClick={() => setMode("signup")}>Create an account</button></>
        )}
      </p>
      <p className="mt-4 text-center text-xs text-muted-foreground"><Link to="/">← Back to home</Link></p>
    </AuthShell>
  );
}
