
create table if not exists public.research_tasks (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 task_type text not null,
 provider text not null,
 status text not null default 'pending',
 attempts integer not null default 0,
 result jsonb not null default '{}'::jsonb,
 error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.research_tasks enable row level security;
create index if not exists research_tasks_property_idx on public.research_tasks(property_id,status);
alter table public.sources add column if not exists content_type text;
alter table public.sources add column if not exists captured_at timestamptz default now();
alter table public.sources add column if not exists evidence_note text;
alter table public.documents add column if not exists mime_type text;
alter table public.documents add column if not exists sha256 text;
alter table public.documents add column if not exists original_url text;
