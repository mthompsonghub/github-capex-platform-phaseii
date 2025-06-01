-- Drop existing objects if they exist
drop trigger if exists handle_allocations_updated_at on public.allocations;
drop trigger if exists handle_resources_updated_at on public.resources;
drop trigger if exists handle_projects_updated_at on public.projects;
drop function if exists public.handle_updated_at();
drop function if exists public.import_data();
drop table if exists public.allocations;
drop table if exists public.resources;
drop table if exists public.projects;

-- Create tables
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null check (status in ('Active', 'Inactive', 'Planned', 'Completed', 'On Hold')),
  priority text not null check (priority in ('Critical', 'High', 'Medium', 'Low')),
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id) on delete set null,
  resource_order jsonb default '[]'::jsonb,
  constraint valid_dates check (end_date >= start_date)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  department text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  year integer not null check (year between 2000 and 2100),
  quarter integer not null check (quarter between 1 and 4),
  percentage numeric not null check (percentage between 0 and 100),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(project_id, resource_id, year, quarter)
);

-- Create extension for text search
create extension if not exists pg_trgm;

-- Create indexes
drop index if exists projects_name_idx;
create index projects_name_idx on public.projects using gin (name gin_trgm_ops);

drop index if exists resources_name_idx;
create index resources_name_idx on public.resources using gin (name gin_trgm_ops);

drop index if exists allocations_project_id_idx;
create index allocations_project_id_idx on public.allocations(project_id);

drop index if exists allocations_resource_id_idx;
create index allocations_resource_id_idx on public.allocations(resource_id);

drop index if exists allocations_year_quarter_idx;
create index allocations_year_quarter_idx on public.allocations(year, quarter);

-- Create updated_at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_projects_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();

create trigger handle_resources_updated_at
  before update on public.resources
  for each row
  execute function public.handle_updated_at();

create trigger handle_allocations_updated_at
  before update on public.allocations
  for each row
  execute function public.handle_updated_at();

-- Enable RLS after tables are created
alter table public.projects enable row level security;
alter table public.resources enable row level security;
alter table public.allocations enable row level security;

-- Drop existing policies
drop policy if exists "Enable read access for authenticated users" on public.projects;
drop policy if exists "Enable insert for authenticated users" on public.projects;
drop policy if exists "Enable update for project creators" on public.projects;
drop policy if exists "Enable delete for project creators" on public.projects;
drop policy if exists "Enable read access for authenticated users" on public.resources;
drop policy if exists "Enable all access for authenticated users" on public.resources;
drop policy if exists "Enable read access for authenticated users" on public.allocations;
drop policy if exists "Enable all access for authenticated users" on public.allocations;

-- RLS Policies
create policy "Enable read access for authenticated users"
  on public.projects for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated users"
  on public.projects for insert
  to authenticated
  with check (true);

create policy "Enable update for project creators"
  on public.projects for update
  to authenticated
  using (auth.uid() = created_by);

create policy "Enable delete for project creators"
  on public.projects for delete
  to authenticated
  using (auth.uid() = created_by);

create policy "Enable read access for authenticated users"
  on public.resources for select
  to authenticated
  using (true);

create policy "Enable all access for authenticated users"
  on public.resources for all
  to authenticated
  using (true);

create policy "Enable read access for authenticated users"
  on public.allocations for select
  to authenticated
  using (true);

create policy "Enable all access for authenticated users"
  on public.allocations for all
  to authenticated
  using (true);

-- Import data function
create or replace function public.import_data(
  projects jsonb,
  resources jsonb,
  allocations jsonb
) returns void
language plpgsql
security definer
as $$
begin
  -- Clear existing data
  delete from public.allocations;
  delete from public.resources;
  delete from public.projects;
  
  -- Import new data
  insert into public.projects select * from jsonb_populate_recordset(null::public.projects, projects);
  insert into public.resources select * from jsonb_populate_recordset(null::public.resources, resources);
  insert into public.allocations select * from jsonb_populate_recordset(null::public.allocations, allocations);
end;
$$;