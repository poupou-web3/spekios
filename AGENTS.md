<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Authentication emails use the managed handler and scaffolded six-template map; share inline brand styles in email-templates/brand.ts. Why: verification and password recovery must retain managed security and email-client compatibility.
- Sitemap inventory is router-derived with required per-route decisions and private subtree exclusions; omit lastmod without authoritative page timestamps. Why: new public pages track routes without leaking account or auth URLs.
- External-app sign-in uses the opaque handoff-code bridge in `src/lib/bridge/` + `/api/public/bridge/token`; never send tokens to the external app. Why: the Rust app must own its own session; contract lives in `docs/AUTH_BRIDGE.md`, keep it in sync.
- `bridge_*` tables are server-only (service role, RLS with no policies). Why: they hold credential hashes and identity bindings.
- Bridge is fail-closed: no enabled `bridge_clients` row means "connection pending", never a redirect. Why: no trusted target exists until configured.
- Launch validation lives in pure `bridge/connection.ts`; status returns only a validated local/hosted target, never credentials. Why: account actions must share a testable trust boundary and derive only computer-local /login targets from registered callbacks.
- Auth return helpers allow only account or structurally valid authorize paths; the authorize server always revalidates registration before Continue. Why: OAuth URL callbacks preserve state/PKCE without arbitrary return destinations.
- Signed-in public entry points lead through account; device-aware local actions require a user click. Why: phones/tablets must not launch their own localhost, and no account visit can mint a handoff code.
