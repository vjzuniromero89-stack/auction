
alter table public.sources add column if not exists source_key text;
alter table public.sources add column if not exists query_terms jsonb not null default '{}'::jsonb;

create unique index if not exists sources_property_source_key_unique
on public.sources(property_id, source_key)
where source_key is not null;

alter table public.research_tasks add column if not exists last_http_status integer;
alter table public.research_tasks add column if not exists last_checked_at timestamptz;
