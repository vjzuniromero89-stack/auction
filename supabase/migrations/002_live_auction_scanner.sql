-- Run this after 001_initial_schema.sql
-- Supports idempotent CivilView imports.
create unique index if not exists auctions_source_sheriff_uidx
  on public.auctions(source, sheriff_number);

create unique index if not exists properties_county_parcel_uidx
  on public.properties(county, parcel_number);

create index if not exists properties_county_address_idx
  on public.properties(county, address);

create index if not exists auctions_status_idx
  on public.auctions(status);
