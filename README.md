# Spekios

Create a project named Spekios: a polished public landing page and an authentication wrapper for an EXISTING external web app. Spekios is the public brand everywhere (page titles, UI, emails where configurable). Scout is only the internal code name; never show Scout in public copy.

Product: Spekios is an AI-powered exploratory website QA tool. Users provide a URL, the existing backend explores user flows in Chromium, captures screenshots and evidence, surfaces potential bugs, supports reproduction and human review, and connects coding agents via MCP. Avoid invented testimonials, customer counts, pricing, or unsupported guarantees.

Build an elegant responsive SaaS landing page with a distinctive restrained design, clear typography, product preview clearly labeled illustrative if simulated, how it works, evidence/reproduction benefits, agent integration, and strong Get started / Sign in calls to action. Add signup/login, email/password, confirmation and password recovery, and Google and Apple login using Lovable's built-in backend and MANAGED social providers so the owner does NOT need to create Google Cloud or Apple Developer credentials. Verify availability rather than assuming. If provider enablement needs a user action, report precisely.

The existing application remains separately hosted with a Rust/Axum API, PostgreSQL and browser workers; do not rebuild its dashboard, QA engine or move application data. Authenticated people need their own existing-app user/workspace, settings and history.

Implement the Lovable side of a secure auth bridge to this external app if supported. First verify the actual auth APIs/capabilities available. Preferred flow: external app starts login with random state and a PKCE S256 challenge, redirects to this login wrapper; after real authentication, issue a random short-lived single-use opaque handoff code, return it only to an explicitly allowlisted external-app callback; Rust redeems it server-to-server with the verifier and establishes its own HttpOnly session. Atomically consume codes, store hashes, bind identity/expiry/challenge/callback, rate limit and avoid secret leakage. Never put access/refresh tokens or identity assertions in redirect query strings, accept arbitrary return URLs, or treat a frontend user ID/email as proof of identity. Use immutable issuer+subject identity. If this architecture cannot be safely implemented with the available built-in backend, explain the limitation and supported alternative rather than fabricating success.

We do not yet have a production app URL/domain or bridge credentials. Build a fail-closed configuration and an honest signed-in 'Your account is ready / app connection pending' screen until the trusted target is configured. Do not invent domains or secrets or use a hardcoded shared credential. Include logout/account basics. Never display fake successful authentication.

Write an integration document in the project with the exact endpoints/request-response schemas, backend verification and account mapping requirements, configuration still needed, expiry/replay behavior, logout/session lifecycle, and meaningful test results. Clearly distinguish implemented, verified, and pending external Rust work. Test the landing page and authentication routes with available tools. Do not publish to production yet. Return your findings on managed Google/Apple and the auth bridge, not just a design summary.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://spekios.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a393e034-e3f2-4e09-9456-d2b48479023a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
