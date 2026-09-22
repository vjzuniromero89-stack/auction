
-- Delaware Auction Intelligence v3
-- Run AFTER 001 and 002.
alter table public.properties add column if not exists zip_code text;
alter table public.properties add column if not exists property_type text;
alter table public.properties add column if not exists beds numeric(6,2);
alter table public.properties add column if not exists baths numeric(6,2);
alter table public.properties add column if not exists building_sqft numeric(14,2);
alter table public.properties add column if not exists lot_sqft numeric(14,2);
alter table public.properties add column if not exists year_built integer;
alter table public.properties add column if not exists assessed_value numeric(14,2);
alter table public.properties add column if not exists last_sale_price numeric(14,2);
alter table public.properties add column if not exists last_sale_date date;

alter table public.auctions add column if not exists attorney text;
alter table public.auctions add column if not exists upset_price numeric(14,2);
alter table public.auctions add column if not exists occupancy_status text;
alter table public.auctions add column if not exists property_note text;
alter table public.auctions add column if not exists status_history jsonb not null default '[]'::jsonb;

alter table public.encumbrances add column if not exists document_url text;
alter table public.encumbrances add column if not exists verified_at timestamptz;

alter table public.bid_models add column if not exists desired_profit numeric(14,2) default 0;
alter table public.bid_models add column if not exists acquisition_costs numeric(14,2) default 0;
alter table public.bid_models add column if not exists financing_costs numeric(14,2) default 0;
alter table public.bid_models add column if not exists model_version text default 'transparent-v1';
alter table public.bid_models add column if not exists assumptions jsonb not null default '{}'::jsonb;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  title text not null,
  document_type text not null,
  instrument_number text,
  recording_date date,
  url text,
  storage_path text,
  verification_status text not null default 'unverified',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.comparables (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  source text not null,
  address text not null,
  distance_miles numeric(8,3),
  sale_date date,
  sale_price numeric(14,2),
  sqft numeric(14,2),
  price_per_sqft numeric(14,2),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  run_type text not null,
  status text not null default 'running',
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  status text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;
alter table public.comparables enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.provider_events enable row level security;

create index if not exists documents_property_idx on public.documents(property_id);
create index if not exists comparables_property_idx on public.comparables(property_id);
create index if not exists analysis_runs_property_idx on public.analysis_runs(property_id);
create index if not exists dd_property_type_idx on public.due_diligence_checks(property_id, check_type);
create index if not exists valuations_property_idx on public.valuations(property_id);

-- No anon/authenticated policies: browser clients cannot read/write these tables directly.
-- The app's server routes use the server-only Supabase secret/service-role key.
