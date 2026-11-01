# Spekios auth bridge — integration contract

Spekios (this project) is the public landing page and sign-in wrapper. The existing
Spekios application (Rust/Axum API, PostgreSQL, browser workers) stays separately
hosted and keeps all application data. This document is the contract between them.

Status legend: **[implemented]** code exists here · **[verified]** exercised by a test
listed in §9 · **[pending-rust]** work the Rust app must do · **[pending-config]** needs
a value nobody has yet (no domain / credentials exist today).

---

## 1. Capabilities actually available (verified 2026-11-01)

| Capability | Result |
|---|---|
| Email/password, confirmation emails, password recovery | Enabled. Email confirmation is ON (sign-up returns no session until the link is clicked). **[verified]** via the auth settings endpoint |
| Google sign-in, managed credentials | Enabled by the managed social-login tool. No Google Cloud project needed. **[verified]** `external.google = true` |
| Apple sign-in, managed credentials | Enabled by the managed social-login tool. No Apple Developer account needed. **[verified]** `external.apple = true` |
| Identity issuer | `https://ctgxazkkspnsukrpjesw.supabase.co/auth/v1` (from OpenID discovery). Subject = immutable user UUID |
| Built-in OAuth 2.1 server | Exists on the platform but **not used**: it would hand the Rust app access/refresh JWTs. The contract below never sends tokens to the Rust app |

Not verified end to end: a real Google or Apple sign-in round trip (needs a real
person's account in a browser), and arrival of confirmation/reset emails in an inbox.
Managed Google/Apple show Lovable-managed branding on the consent sheet. To use your own
branding, add your own credentials under Cloud → Users → Auth settings.

## 2. Flow

```text
Rust app                         Spekios sign-in (this project)            Browser
  | generate state (>=16 chars random) + PKCE verifier; store both in a
  | short-lived, HttpOnly, SameSite=Lax pre-auth cookie
  |--302--> GET {SPEKIOS_ORIGIN}/bridge/authorize?response_type=code&client_id=..&redirect_uri=..&state=..&code_challenge=..&code_challenge_method=S256
  |                                  validate client + exact redirect_uri  (fail closed: no redirect on any error)
  |                                  user signs in (email / Google / Apple) if needed
  |                                  user clicks "Continue"
  |                                  mint 32-byte random code, store SHA-256 only, TTL 60 s
  |<--302-- {redirect_uri}?code=<opaque>&state=<echoed>
  | check state == cookie state (constant time), drop the pre-auth cookie
  |--POST {SPEKIOS_ORIGIN}/api/public/bridge/token  (server to server, client secret + verifier)
  |<-- 200 identity JSON (no tokens)
  | map (iss, sub) -> local user/workspace, create own HttpOnly session
```

## 3. Endpoints

### 3.1 `GET /bridge/authorize` (browser) **[implemented][verified]**

| Param | Rule |
|---|---|
| `response_type` | must be `code` |
| `client_id` | `^[a-z0-9][a-z0-9_-]{2,63}$`, must be an enabled row in `bridge_clients` |
| `redirect_uri` | exact string match against the client's `redirect_uris`; must be `https://` (`http://localhost` / `127.0.0.1` only if explicitly registered); no fragment, no userinfo |
| `state` | 16–512 printable ASCII characters, echoed back unchanged |
| `code_challenge` | 43-char base64url = `BASE64URL(SHA256(verifier))` |
| `code_challenge_method` | must be `S256` (`plain` rejected) |

Behaviour: invalid request → error page, **never** a redirect. Unknown/disabled client →
"App connection pending" page. Signed out → sign-in/sign-up that returns to the same URL
(same-origin path only). Signed in → explicit "Continue" button (no silent issuance) and
"Use a different account".

### 3.2 Code issuance (server function, signed-in only) **[implemented][verified]**

Requires the caller's own session (bearer validated server-side). Re-validates every
authorize parameter, re-reads the user from the auth server (never from the browser),
rate-limits to 10 codes per user per minute, stores a row with:
`code_hash` (SHA-256 hex), `client_id`, `redirect_uri`, `code_challenge`, `user_id`,
`issuer`, `subject`, `email`, `email_verified`, `providers`, `auth_time`, `expires_at = now + 60 s`.
The plaintext code exists only in the redirect URL.

### 3.3 `POST /api/public/bridge/token` (server to server) **[implemented][verified]**

Request — `application/x-www-form-urlencoded` (preferred) or JSON:

```
grant_type=authorization_code
code=<43 chars from callback>
code_verifier=<43-128 chars>
redirect_uri=<exactly the one used in authorize>
client_id=<id>            # or HTTP Basic auth: base64(client_id:client_secret)
client_secret=<secret>    # >= 32 chars
```

Success `200` (headers `Cache-Control: no-store`, `Pragma: no-cache`):

```json
{
  "iss": "https://ctgxazkkspnsukrpjesw.supabase.co/auth/v1",
  "sub": "e15d05e3-a9ac-43f7-9582-e4f2c3ccc858",
  "aud": "<client_id>",
  "email": "person@example.com",
  "email_verified": true,
  "providers": ["email", "google"],
  "auth_time": 1793530861,
  "handoff_id": "uuid",
  "issued_at": 1793530865
}
```

Errors (`{"error","error_description"}`, always `no-store`):

| Status | `error` | When |
|---|---|---|
| 400 | `unsupported_grant_type` | grant_type ≠ authorization_code |
| 400 | `invalid_request` | malformed code / verifier / missing redirect_uri |
| 401 | `invalid_client` | unknown, disabled, or wrong secret (one message for all) |
| 400 | `invalid_grant` | unknown, used, expired, wrong client, wrong redirect_uri, wrong verifier (one message for all) |
| 429 | `slow_down` | > 30 req/min per IP or > 120 req/min per client; `Retry-After: 60` |
| 405 | `invalid_request` | non-POST |

Order of checks: rate limit → client authentication → **atomic consume** (single
`UPDATE … WHERE consumed_at IS NULL RETURNING`) → client/redirect/expiry/PKCE. The code
is burned before the binding checks, so a wrong verifier cannot be retried.

## 4. Rust-side requirements **[pending-rust]**

1. Start login: generate `state` (≥ 128 bits) and verifier (32 random bytes → base64url, 43 chars); `challenge = BASE64URL_NOPAD(SHA256(verifier))`. Store both server-side or in a signed/encrypted HttpOnly `Secure` `SameSite=Lax` cookie, lifetime ≤ 10 min.
2. Callback: reject if `state` missing or ≠ stored (constant time). Delete the pre-auth cookie whatever the outcome. Do not log the `code`.
3. Redeem within 60 s via §3.3 from the backend only; TLS required; timeout ~5 s; do not retry on `invalid_grant`.
4. Validate the response: `iss` equals the configured issuer exactly; `aud` equals your client_id; `sub` non-empty.
5. Account mapping: key users on **(iss, sub)** with a unique index. Email is display/contact data only — never the join key, never proof of identity; it can change. First-time `(iss, sub)` → create user + default workspace. Optional: link to a pre-existing email-keyed account only if `email_verified = true` and you have an explicit migration policy.
6. Create the app's own session: random ID, HttpOnly, Secure, SameSite=Lax, rotate on login, server-side store. Never use anything from the callback URL as a session.
7. Store the client secret in your secret manager; never ship it to a browser.

## 5. Configuration still needed **[pending-config]**

Nothing is configured today, so the bridge is **fail closed**: the authorize page shows
"App connection pending" and the account page shows "Your account is ready — app
connection pending".

To switch it on, once the production app domain exists:

1. Generate a secret on the Rust side: `openssl rand -base64 48 | tr '+/' '-_' | tr -d '='`.
2. Compute its hash: `printf %s "$SECRET" | sha256sum` (lowercase hex).
3. Insert the client (run in Cloud → Database, or ask the agent):
   ```sql
   insert into public.bridge_clients (client_id, display_name, redirect_uris, secret_sha256, launch_url, enabled)
   values ('spekios-app', 'Spekios app', array['https://<APP_DOMAIN>/auth/callback'],
           '<sha256 hex>', 'https://<APP_DOMAIN>/login', true);
   ```
4. Rust config: `SPEKIOS_AUTH_ORIGIN` (this site's published origin), `SPEKIOS_ISSUER` (§1), `SPEKIOS_CLIENT_ID`, `SPEKIOS_CLIENT_SECRET`, `SPEKIOS_REDIRECT_URI`.

Rotation: update `secret_sha256` (one secret at a time; brief overlap is not supported —
deploy the Rust secret and the hash together). Disable instantly with `enabled = false`.
`launch_url` is optional; when set (https only) the account page shows "Open the Spekios app".

## 6. Expiry and replay

- Code TTL 60 s; single use enforced atomically in the database (8 concurrent redemptions → exactly one 200, see §9).
- Only the SHA-256 of the code is stored; codes older than 24 h are purged on redemption.
- Every failure after consumption burns the code.
- `state` protects the Rust callback against CSRF/login injection; PKCE binds the code to the browser session that started login; the client secret binds redemption to the Rust backend.

## 7. Session lifecycle and logout

- The two sessions are independent. The Spekios sign-in session lives in this browser origin; the Rust app's session is its own cookie.
- Rust logout: destroy the Rust session. To also end the Spekios sign-in, redirect the browser to `{SPEKIOS_ORIGIN}/logout` (signs out locally, shows a "signed out" page; it never redirects to arbitrary URLs).
- Signing out on the Spekios account page does not end an existing Rust session (no back-channel exists). If that is required, add a Rust endpoint and we can call it — **[pending-rust]**.
- Account deletion / user disabling here does not propagate; the Rust app must re-run the bridge to refresh identity. A revocation webhook is not implemented.

## 8. What is deliberately not done

- No access/refresh tokens or identity assertions in any URL.
- No arbitrary return URLs; post-sign-in returns are same-origin paths only.
- No frontend-supplied user ID/email is trusted; identity comes from the auth server inside the signed-in server function.
- No hardcoded shared credential, no invented domain.
- Bridge tables are reachable only from server code (no browser access; RLS on, no policies — intentional).

## 9. Test results (2026-11-01, local preview)

Unit tests (`src/test/bridge-core.test.tsx`, 7 passing): RFC 7636 S256 vector, PKCE
match/mismatch, exact-match redirect allowlist (trailing slash, query, other host, http
rejected), `plain` method and short state rejected, 60 s TTL / 43-char random codes,
callback carries only `code` and `state`, same-origin return path sanitizer.

End-to-end (Playwright + HTTP, temporary test client and test user, both deleted afterwards):

| Case | Result |
|---|---|
| Landing page renders desktop + mobile, no page errors | pass |
| `/account` while signed out → `/auth` | pass |
| Authorize with unregistered redirect_uri | "This link isn't valid", no redirect |
| Authorize signed out → sign-in → returns to authorize | pass |
| Continue → callback has exactly `code`, `state`; state echoed | pass |
| Redeem with wrong client secret | 401 invalid_client (code not consumed) |
| Redeem correctly | 200, `iss`/`sub` = canonical issuer / user UUID |
| Replay same code | 400 invalid_grant |
| Wrong verifier, then correct verifier | 400, then 400 (burned) |
| Wrong redirect_uri | 400 invalid_grant |
| Redeem after 62 s | 400 invalid_grant |
| 8 concurrent redemptions of one code | one 200, seven 400 |
| DB holds only SHA-256 of the code; TTL ≈ 60 s | confirmed |
| GET on token endpoint | 405 |
| No client configured → account page and authorize page show "connection pending" | pass |
| Sign out → `/auth`; forgot-password form; reset page without valid link shows "expired" | pass |

Not tested: real Google/Apple consent screens, delivery of confirmation and reset emails,
the published (production) runtime, and the Rust side.
