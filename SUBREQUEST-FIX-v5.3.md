# v5.3 Cloudflare subrequest-limit fix

The previous engine performed many Supabase HTTP requests inside nested loops:
one SELECT/UPDATE/INSERT per due-diligence check and per research provider.
On Cloudflare Workers these requests all count as subrequests, so one button click
could exceed the Worker invocation limit.

v5.3 builds checklist/task/evidence arrays in memory and writes them in batches.
The external public-source probes remain bounded. Census and FEMA are at most two
additional public requests.

No new SQL migration is required. Migration 008 remains current.
