# Delaware Auction Intelligence v3 — Setup

## Required
1. Existing migrations 001 and 002 must already be applied.
2. Run `supabase/migrations/003_intelligence_engine.sql`.
3. Cloudflare secrets:
   - `NEXT_PUBLIC_SUPABASE_URL` (already configured)
   - Keep your existing public/anon key if present.
   - Add `SUPABASE_SECRET_KEY` as a **Secret** (preferred current Supabase server key).
     If your project only exposes the legacy service role key, `SUPABASE_SERVICE_ROLE_KEY` is supported as fallback.
4. Cloudflare build command: `npm run build:cloudflare`
5. Deploy command: `npx wrangler deploy`

## Optional later
- PACER_USERNAME / PACER_PASSWORD / PACER_CLIENT_CODE
- ATTOM_API_KEY
- FIRST_AMERICAN_API_KEY

The app deploys without optional provider credentials. It never interprets an unavailable provider as “no lien/no bankruptcy”.

## First review
1. Deploy.
2. Open Dashboard.
3. Click Scan Auctions.
4. Open a property with Investigate.
5. Click Run Due Diligence.
6. Review each source status.
7. Enter assumptions in Bid Calculator and save a modeled ceiling.

## Evidence rule
FOUND, VERIFIED, NOT FOUND, PENDING, MANUAL REVIEW REQUIRED are distinct states.
“Not found” should only be used after the relevant source was actually searched.
CivilView is auction discovery, not proof of clean title.


## v3.1 Cloudflare runtime fix
Server-side Supabase credentials are read from OpenNext Cloudflare runtime bindings first, with `process.env` only as a local fallback.
Diagnostic endpoint `/api/runtime-check` returns only booleans showing whether binding names are present; it never returns secret values.
