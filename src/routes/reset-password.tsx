import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Spekios" },
      { name: "description", content: "Set a new password for your Spekios account." },
      { property: "og:title", content: "Choose a new password — Spekios" },
      { property: "og:description", content: "Set a new password for your Spekios account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [recovery, setRecovery] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setRecovery(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    const t = setTimeout(() => setRecovery((r) => r ?? false), 2500);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
  }

  return (
    <AuthShell title="Choose a new password">
      {done ? (
        <div className="grid gap-4">
          <p className="text-sm">Your password has been updated.</p>
          <Button asChild><Link to="/account">Go to your account</Link></Button>
        </div>
      ) : recovery === false ? (
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">This reset link is invalid or has expired. Request a new one.</p>
          <Button asChild variant="outline"><Link to="/auth" search={{ mode: "forgot" }}>Request a new link</Link></Button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!recovery} />
          </div>
          <Button type="submit" disabled={busy || !recovery}>{recovery ? "Update password" : "Checking link…"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
