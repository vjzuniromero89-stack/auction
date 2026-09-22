# v4.4 Free public-source execution

New Castle County is the first live FREE-ONLY connector.

The Worker now makes ordinary GET requests to official public pages for:
- New Castle County Parcel Search
- Recorder Document Search information
- County tax information
- Community Association Portal
- Delaware CourtConnect

It records HTTP reachability, final URL, retrieval time, an excerpt, and the property's parcel/address/owner search identifiers as source evidence.

Important: many of these official systems are interactive forms. A successful GET proves the official source was reached; it does NOT prove that the parcel/person search was executed. The app therefore keeps the substantive check as MANUAL REVIEW REQUIRED until actual result data is returned.

New Castle's Recorder states occasional users may search documents at no charge, but viewing ordinary recorded document images is $1/page. The app therefore does not claim free PDF retrieval for those images.

This version does not bypass CAPTCHAs, logins, paywalls, or access controls.
