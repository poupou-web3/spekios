import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spekios — Exploratory website QA with reproducible evidence" },
      { name: "description", content: "Give Spekios a URL. It explores real user flows in Chromium, captures screenshots and evidence, and surfaces potential bugs for human review and coding agents." },
      { property: "og:title", content: "Spekios — Exploratory website QA with reproducible evidence" },
      { property: "og:description", content: "AI-driven exploration of your site's user flows, with screenshots, reproduction steps and an MCP connection for coding agents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Evidence />
        <Agents />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="paper-grid absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 md:pt-28">
        <p className="eyebrow">Exploratory QA for the web</p>
        <h1 className="font-display mt-5 max-w-4xl text-5xl leading-[1.02] md:text-7xl">
          Point it at a URL.<br />
          <em className="text-signal">Get evidence,</em> not guesses.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Spekios explores your website's user flows in a real Chromium browser, captures screenshots
          and evidence along the way, and surfaces potential bugs for you to reproduce and review.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/auth">Sign in</Link></Button>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

function ProductPreview() {
  const steps = [
    { t: "00:02", a: "Opened /pricing", s: "ok" },
    { t: "00:05", a: "Clicked “Start trial”", s: "ok" },
    { t: "00:09", a: "Submitted signup form with valid email", s: "ok" },
    { t: "00:11", a: "Response 500 on POST /api/signup", s: "flag" },
    { t: "00:12", a: "Captured screenshot + console log", s: "ok" },
  ];
  return (
    <figure className="mt-16">
      <div className="overflow-hidden rounded-xl border border-ink-border bg-ink text-ink-foreground shadow-panel">
        <div className="flex items-center justify-between border-b border-ink-border px-4 py-2.5 font-mono text-xs text-ink-muted">
          <span>exploration · example-shop.test</span>
          <span className="rounded border border-ink-border px-2 py-0.5">Illustrative preview</span>
        </div>
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <ol className="divide-y divide-ink-border font-mono text-sm">
            {steps.map((s) => (
              <li key={s.t} className="flex gap-4 px-4 py-3">
                <span className="text-ink-muted">{s.t}</span>
                <span className={s.s === "flag" ? "text-signal" : ""}>{s.a}</span>
              </li>
            ))}
          </ol>
          <div className="border-t border-ink-border p-5 md:border-t-0 md:border-l">
            <p className="font-mono text-xs uppercase tracking-widest text-signal">Potential bug</p>
            <p className="mt-2 text-lg">Signup fails after valid submission</p>
            <div className="mt-4 aspect-[16/9] rounded-md border border-ink-border bg-ink-border/40 p-3">
              <div className="h-2 w-1/3 rounded bg-ink-muted/40" />
              <div className="mt-3 h-2 w-2/3 rounded bg-ink-muted/25" />
              <div className="mt-6 rounded border border-signal/60 p-2 font-mono text-xs text-signal">Something went wrong. Please try again.</div>
            </div>
            <p className="mt-4 font-mono text-xs text-ink-muted">5 steps · screenshot · network trace · awaiting review</p>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        Illustrative example with simulated data — not a real customer run.
      </figcaption>
    </figure>
  );
}

function HowItWorks() {
  const items = [
    ["Provide a URL", "Start with the site you want explored. No test scripts to write first."],
    ["Spekios explores", "An AI agent walks through user flows in Chromium — navigating, filling forms, clicking through."],
    ["Evidence is captured", "Screenshots, steps taken and page signals are recorded as the exploration runs."],
    ["You review", "Potential bugs are surfaced for human review, with steps to reproduce them."],
  ];
  return (
    <section id="how" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow">How it works</p>
        <h2 className="font-display mt-4 max-w-2xl text-4xl md:text-5xl">From a single URL to a reviewed finding.</h2>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
          {items.map(([h, p], i) => (
            <li key={h} className="bg-card p-6">
              <span className="font-mono text-xs text-signal">0{i + 1}</span>
              <h3 className="mt-6 text-lg font-medium">{h}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Evidence() {
  const points = [
    ["Screenshots at each step", "See exactly what the browser showed when something looked wrong."],
    ["Reproduction steps", "Every potential bug comes with the path that led to it, so you can replay it yourself."],
    ["Human review", "Findings are potential bugs until a person confirms or dismisses them."],
  ];
  return (
    <section id="evidence" className="border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 md:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow">Evidence & reproduction</p>
          <h2 className="font-display mt-4 text-4xl md:text-5xl">A finding you can check is worth more than a hunch.</h2>
          <p className="mt-5 text-muted-foreground">
            Spekios is built around evidence. Instead of a vague alert, you get what happened, where, and how to see it again.
          </p>
        </div>
        <ul className="space-y-px overflow-hidden rounded-xl border border-border bg-border">
          {points.map(([h, p]) => (
            <li key={h} className="flex gap-5 bg-card p-6">
              <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-signal" />
              <div>
                <h3 className="font-medium">{h}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Agents() {
  return (
    <section id="agents" className="border-t border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 md:grid-cols-2">
        <div>
          <p className="eyebrow">Agent integration</p>
          <h2 className="font-display mt-4 text-4xl md:text-5xl">Hand findings straight to your coding agent.</h2>
          <p className="mt-5 text-muted-foreground">
            Spekios connects to coding agents over MCP, so an agent can read a finding, its evidence and its
            reproduction steps — and work on a fix with the full context.
          </p>
        </div>
        <figure>
          <pre className="overflow-x-auto rounded-xl border border-ink-border bg-ink p-5 font-mono text-sm leading-relaxed text-ink-foreground shadow-panel">
{`agent  → spekios.list_findings()
spekios ← 1 potential bug awaiting review
agent  → spekios.get_finding("signup-500")
spekios ← steps, screenshots, network trace
agent  → opens a fix in your repository`}
          </pre>
          <figcaption className="mt-3 text-xs text-muted-foreground">Illustrative exchange; tool names are examples.</figcaption>
        </figure>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h2 className="font-display mx-auto max-w-2xl text-4xl md:text-6xl">Let Spekios take the first look.</h2>
        <div className="mt-9 flex justify-center gap-3">
          <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/auth">Sign in</Link></Button>
        </div>
      </div>
    </section>
  );
}
