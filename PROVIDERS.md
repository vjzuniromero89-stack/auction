# Real evidence providers

## Live now
- CivilView: auction discovery.
- Official county/recorder/court/PACER source registry: source-specific research tasks and evidence links.
- Evidence ingestion API: stores source URLs, instrument numbers, amounts, recording dates, and document URLs without converting missing data into a negative finding.

## Requires credentials / commercial agreement
- PACER production API: username/password and explicit opt-in for billable searches.
- ATTOM: API key and licensed endpoints for property/valuation/comps/foreclosure.
- First American / DataTree: licensed title/property API credentials and Delaware coverage rights.

## Interactive official systems
New Castle Recorder/parcel, Kent deeds/property, Sussex Landmark/property, and Delaware CourtConnect can require interactive searches, subscriptions, document fees, or browser workflows. They remain MANUAL REVIEW REQUIRED until an authorized programmatic interface is configured.

## Evidence rule
A check becomes NOT FOUND only after the intended authoritative source was actually queried with adequate identifiers. A failed request, missing API credential, blocked automation, or empty unverified page never becomes NOT FOUND.


## v4.1 executable providers
ATTOM is now an executable live provider for property detail, AVM and sales comparables when `ATTOM_API_KEY` is configured. Raw provider responses are retained as evidence and normalized into `property_facts`.

PACER remains production-billing gated. Credentials alone do not enable billable searches; `PACER_ENABLE_BILLABLE_SEARCH=true` is additionally required, and account-specific MFA/client-code validation remains necessary.

County recorder/court portals that do not expose an authorized machine interface are not scraped around access controls. They remain source-linked research tasks so official PDFs/screenshots can be attached without falsely marking title clear.
