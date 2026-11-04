import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
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
        <Signals />
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
        <p className="eyebrow">
          Built for the <a href="https://dev.meta.ai/events/global-hackathon" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-foreground">Meta Global AI Developer Hackathon</a>
        </p>
        <h1 className="font-display mt-5 max-w-4xl text-5xl leading-[1.02] md:text-7xl">
          Point it at a URL.<br />
          <em className="text-signal">Get evidence,</em> not guesses.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Traditional QA checks the tests you thought to write. Spekios explores what you didn't: it works through your site in a real Chromium browser and brings back evidence you can replay.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <LandingActions />
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
          <span>exploration · larchwood-faulty.spekios.com</span>
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
    ["Predicts, then acts", "Before every click, form entry or navigation, the agent writes down what should happen. Then it does it."],
    ["Checks every signal", "It compares the result with that prediction using the screenshot, the page structure, network requests and console errors, not just one of them."],
    ["Replayed, then reviewed", "Suspected bugs are replayed in a fresh browser. Then you or your coding agent review them."],
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

function Signals() {
  const signals = [
    ["Sees the screen", "Screenshots before and after each action, compared pixel by pixel."],
    ["Reads the structure", "Buttons, links, fields and their state, from the page itself."],
    ["Watches the network", "Failed requests and slow or unfinished responses."],
    ["Listens to the console", "JavaScript errors raised by the action."],
  ];
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="font-display max-w-4xl text-4xl md:text-5xl">It looks at the page the way you do, and then checks what you can't see.</h2>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {signals.map(([heading, text]) => (
            <li key={heading} className="min-w-0 rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-medium">{heading}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-muted-foreground">A finding needs a broken expectation. A changed screenshot or an error on its own is a clue, not a verdict.</p>
      </div>
    </section>
  );
}

function Evidence() {
  const points = [
    ["Screenshots at each step", "See exactly what the browser showed when something looked wrong."],
    ["Reproduction steps", "Every potential bug comes with the path that led to it, so you can replay it yourself."],
    ["AI proposes. You or your agent decide.", "The AI only proposes potential bugs. Each one is replayed in a fresh browser, and nothing counts as confirmed until a person, or an agent working through the MCP API, has reviewed the evidence."],
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
          <h2 className="font-display mt-4 text-4xl md:text-5xl">Review by a person or by an agent.</h2>
          <p className="mt-5 text-muted-foreground">
            Everything in the workspace is also available over MCP and HTTP. A coding agent can list findings, read the screenshots and network evidence, replay a bug, triage it as a bug, intended behaviour or a duplicate, and check that its fix works on a new deployment.
          </p>
        </div>
        <figure className="min-w-0">
          <pre className="overflow-x-auto rounded-xl border border-ink-border bg-ink p-5 font-mono text-sm leading-relaxed text-ink-foreground shadow-panel">
{`agent  → spekios.list_findings()
spekios ← 1 potential bug awaiting review
agent  → spekios.get_finding("signup-500")
spekios ← steps, screenshots, network trace
agent  → spekios.reproduce("signup-500")   spekios ← reproduced in a fresh browser
agent  → opens a fix, then spekios.verify_fix()   spekios ← resolved`}
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
          <LandingActions />
        </div>
      </div>
    </section>
  );
}

function LandingActions() {
  const { session, ready } = useAuth();
  if (ready && session) return (
    <>
      <Button asChild size="lg" className="min-h-12"><Link to="/account">Open Spekios</Link></Button>
      <Button asChild size="lg" variant="outline" className="min-h-12"><Link to="/account">Your account</Link></Button>
    </>
  );
  return (
    <>
      <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
      <Button asChild size="lg" variant="outline"><Link to="/auth">Sign in</Link></Button>
    </>
  );
}
