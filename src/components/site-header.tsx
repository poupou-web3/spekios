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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="/#how" className="hover:text-foreground">How it works</a>
          <a href="/#evidence" className="hover:text-foreground">Evidence</a>
          <a href="/#agents" className="hover:text-foreground">Agents</a>
        </nav>
        <div className="flex items-center gap-2">
          {ready && session ? (
            <Button asChild size="sm"><Link to="/account">Your account</Link></Button>
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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <Logo />
        <p>Exploratory website QA with evidence you can reproduce.</p>
        <p>© {new Date().getFullYear()} Spekios</p>
      </div>
    </footer>
  );
}
