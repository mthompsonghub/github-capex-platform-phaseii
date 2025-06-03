-- Create tables first
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null check (status in ('Active', 'Inactive', 'Planned', 'Completed', 'On Hold')),
  priority text not null check (priority in ('Critical', 'High', 'Medium', 'Low')),
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint valid_dates check (end_date >= start_date)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  department text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.allocations (
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
create index projects_name_idx on public.projects using gin (name gin_trgm_ops);
create index resources_name_idx on public.resources using gin (name gin_trgm_ops);
create index allocations_project_id_idx on public.allocations(project_id);
create index allocations_resource_id_idx on public.allocations(resource_id);
create index allocations_year_quarter_idx on public.allocations(year, quarter);

-- Create updated_at triggers
create function public.handle_updated_at()
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