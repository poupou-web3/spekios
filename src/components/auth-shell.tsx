import type { ReactNode } from "react";
import { Logo } from "@/components/site-header";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div aria-hidden className="paper-grid absolute inset-0 opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
        <Logo />
        <div className="my-auto py-10">
          <h1 className="font-display text-4xl">{title}</h1>
          {subtitle && <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div>}
          <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-panel">{children}</div>
        </div>
      </div>
    </div>
  );
}
