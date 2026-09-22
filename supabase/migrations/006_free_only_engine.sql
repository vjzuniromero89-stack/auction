
alter table public.research_tasks add column if not exists access_cost text not null default 'free';
alter table public.research_tasks add column if not exists execution_mode text not null default 'manual';
alter table public.research_tasks add column if not exists query_url text;

create table if not exists public.free_research_runs(
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 status text not null default 'running',
 sources_checked integer not null default 0,
 findings integer not null default 0,
 notes jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 completed_at timestamptz
);
alter table public.free_research_runs enable row level security;
create index if not exists free_research_runs_property_idx on public.free_research_runs(property_id,created_at desc);

-- Paid providers are disabled in FREE-ONLY mode.
update public.research_tasks
set status='disabled_paid_provider', access_cost='paid'
where provider in ('attom','pacer','first_american','datatree','corelogic');
