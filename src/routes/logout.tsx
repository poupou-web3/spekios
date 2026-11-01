import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/logout")({
  head: () => ({
    meta: [
      { title: "Signed out — Spekios" },
      { name: "description", content: "You have been signed out of Spekios." },
      { property: "og:title", content: "Signed out — Spekios" },
      { property: "og:description", content: "You have been signed out of Spekios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Logout,
});

function Logout() {
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);
  useEffect(() => {
    (async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      setDone(true);
    })();
  }, [queryClient]);
  return (
    <AuthShell title={done ? "You're signed out" : "Signing out…"}>
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">Your Spekios sign-in on this browser has ended.</p>
        <Button asChild><Link to="/auth">Sign in again</Link></Button>
        <Button asChild variant="ghost"><Link to="/">Back to home</Link></Button>
      </div>
    </AuthShell>
  );
}
