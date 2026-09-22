# v5.2 build fix
Cloudflare build failed because `lib/free-research.ts` imported `@/lib/free-intelligence` but the module was missing from the archive.
This release adds `lib/free-intelligence.ts` with:
- county public-source probes for New Castle, Kent and Sussex
- Delaware CourtConnect public probe
- U.S. Census geocoding
- FEMA NFHL point query
No database migration change is required beyond v5 migration 008.
