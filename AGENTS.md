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
- External-app sign-in uses the opaque handoff-code bridge in `src/lib/bridge/` + `/api/public/bridge/token`; never send tokens to the external app. Why: the Rust app must own its own session; contract lives in `docs/AUTH_BRIDGE.md`, keep it in sync.
- `bridge_*` tables are server-only (service role, RLS with no policies). Why: they hold credential hashes and identity bindings.
- Bridge is fail-closed: no enabled `bridge_clients` row means "connection pending", never a redirect. Why: no trusted target exists until configured.
