import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-foreground">
      <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full border border-foreground">
        <span className="h-2 w-2 rounded-full bg-signal" />
      </span>
      <span className="font-display text-2xl leading-none">Spekios</span>
    </Link>
  );
}

export function SiteHeader() {
  const { session, ready } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 md:flex md:justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="/#how" className="hover:text-foreground">How it works</a>
          <a href="/#evidence" className="hover:text-foreground">Evidence</a>
          <a href="/#agents" className="hover:text-foreground">Agents</a>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {ready && session ? (
            <>
              <Button asChild variant="ghost" size="sm" className="min-h-11"><Link to="/account">Account</Link></Button>
              <Button asChild size="sm" className="min-h-11"><Link to="/account">Open app</Link></Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
              <Button asChild size="sm"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Logo />
          <p>Exploratory QA that finds what your tests don't, with evidence you can replay.</p>
          <p>© {new Date().getFullYear()} Spekios</p>
        </div>
        <p className="mt-3 md:text-right">
          <a href="mailto:contact@spekios.com" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-foreground">contact@spekios.com</a>
        </p>
        <p className="mt-3 text-xs md:text-right">
          Built for the <a href="https://dev.meta.ai/events/global-hackathon" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-foreground">Meta Global AI Developer Hackathon</a> · Powered by Meta's Wonder and Spark
        </p>
      </div>
    </footer>
  );
}
