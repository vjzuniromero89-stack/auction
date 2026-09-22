
create table if not exists public.property_facts (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 provider text not null,
 fact_type text not null,
 value jsonb not null default '{}'::jsonb,
 source_url text,
 retrieved_at timestamptz not null default now()
);
alter table public.property_facts enable row level security;
create index if not exists property_facts_property_idx on public.property_facts(property_id, fact_type);

alter table public.research_tasks add column if not exists started_at timestamptz;
alter table public.research_tasks add column if not exists completed_at timestamptz;
alter table public.research_tasks add column if not exists evidence_count integer not null default 0;

-- remove repeated CivilView rows already created by repeated scans; retain newest
delete from public.sources a using public.sources b
where a.provider='CivilView' and b.provider='CivilView'
and a.property_id=b.property_id
and coalesce(a.external_reference,'')=coalesce(b.external_reference,'')
and a.created_at < b.created_at;

create unique index if not exists sources_civilview_unique
on public.sources(property_id, provider, external_reference)
where provider='CivilView';
