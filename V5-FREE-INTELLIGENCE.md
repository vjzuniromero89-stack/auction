# v5 FREE Intelligence — consolidated package

This replaces the incremental connector approach. It covers New Castle, Kent and Sussex source routing in one build.

## Automatic $0 execution included
- CivilView auction ingestion (existing scanner).
- Official public-source reachability/capture for all three counties.
- Delaware CourtConnect public-source capture.
- US Census public geocoding.
- FEMA NFHL spatial query when geocoding succeeds.
- Evidence provenance, timestamps, identifiers and source URLs.
- Paid providers disabled.

## Deliberately unresolved when the public system is interactive
County recorder/property and CourtConnect searches are not marked VERIFIED merely because their landing page loaded. If the system requires an interactive form/session, CAPTCHA, login, subscription, or paid image, the app keeps MANUAL REVIEW REQUIRED. It never converts that into NOT FOUND.

## One migration
Run `008_free_intelligence_all_in_one.sql` after your existing migrations. It is idempotent.
