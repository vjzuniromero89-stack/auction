# Delaware Auction Intelligence

Starter web app for Delaware foreclosure/sheriff-sale due diligence and bid modeling.

## Included
- Responsive dark command-center dashboard
- Opportunity cards for New Castle, Kent and Sussex
- Property intelligence page
- Transparent max-bid model
- Title / lien / bankruptcy / tax verification checklist
- Evidence/source model
- API-ready database schema for Supabase
- Placeholder environment variables for ATTOM, First American and PACER
- Demo data so the UI works before external APIs are connected

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env.local`
3. `npm run dev`

## Supabase
Create a new Supabase project, then run `supabase/migrations/001_initial_schema.sql` in SQL Editor. Copy the project URL and publishable key into `.env.local` / Vercel environment variables.

RLS is enabled with no public policies by default. This is intentional. When authentication is added, create per-user or per-organization policies rather than exposing these tables publicly.

## Vercel
Import the GitHub repository into Vercel, add the environment variables, and deploy. Build command: `npm run build`.

## Provider roadmap
1. CivilView / county sheriff discovery connector
2. County parcel + recorder verification
3. First American DataTree / DNA property data connector
4. ATTOM valuation/comps connector
5. PACER bankruptcy connector
6. Delaware CourtConnect judgment workflow
7. Title-priority rules and evidence reconciliation

## Important
This application is a due-diligence assistant, not a title insurance product or legal opinion. Never treat an estimated mortgage balance as a payoff amount. Provider results should retain source, retrieval date, document reference and verification state.
