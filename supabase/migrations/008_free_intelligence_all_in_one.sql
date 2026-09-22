-- v5 FREE Intelligence all-in-one
-- Run after 001-007. Idempotent.
alter table public.sources add column if not exists source_key text;
alter table public.sources add column if not exists query_terms jsonb not null default '{}'::jsonb;
alter table public.research_tasks add column if not exists last_http_status integer;
alter table public.research_tasks add column if not exists last_checked_at timestamptz;
alter table public.properties add column if not exists latitude numeric(10,7);
alter table public.properties add column if not exists longitude numeric(10,7);
alter table public.properties add column if not exists free_research_summary jsonb not null default '{}'::jsonb;
create table if not exists public.risk_findings(
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 category text not null, severity text not null default 'info', title text not null, detail text, source_url text,
 status text not null default 'found', raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
alter table public.risk_findings enable row level security;
create index if not exists risk_findings_property_idx on public.risk_findings(property_id,category);
create unique index if not exists sources_property_source_key_unique on public.sources(property_id,source_key) where source_key is not null;
