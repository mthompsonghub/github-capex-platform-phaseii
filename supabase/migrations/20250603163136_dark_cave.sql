/*
  # Update allocations table schema
  
  1. Changes
    - Drop existing view and table
    - Recreate allocations table with project_quarter_number
    - Add necessary indexes and triggers
    - Enable RLS with policies
    - Create calendar_allocations view
    - Update import_data function

  2. Security
    - Enable RLS on allocations table
    - Add policies for authenticated users
*/

-- Drop existing objects in correct order
drop view if exists public.calendar_allocations;
drop trigger if exists handle_allocations_updated_at on public.allocations;
drop table if exists public.allocations;

-- Create new allocations table with project_quarter_number
create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  project_quarter_number integer not null check (project_quarter_number >= 1),
  percentage numeric not null check (percentage between 0 and 100),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(project_id, resource_id, project_quarter_number)
);

-- Create indexes
create index allocations_project_id_idx on public.allocations(project_id);
create index allocations_resource_id_idx on public.allocations(resource_id);
create index allocations_quarter_idx on public.allocations(project_quarter_number);

-- Create trigger for updated_at
create trigger handle_allocations_updated_at
  before update on public.allocations
  for each row
  execute function public.handle_updated_at();

-- Enable RLS
alter table public.allocations enable row level security;

-- RLS Policies
create policy "Enable read access for authenticated users"
  on public.allocations for select
  to authenticated
  using (true);

create policy "Enable all access for authenticated users"
  on public.allocations for all
  to authenticated
  using (true);

-- Create view for calendar-based allocations
create or replace view public.calendar_allocations as
select
    a.id,
    a.project_id,
    a.resource_id,
    a.percentage,
    a.created_at,
    a.updated_at,
    extract(year from (date_trunc('quarter', p.start_date) + ((a.project_quarter_number - 1) * interval '3 months'))) as calendar_year,
    extract(quarter from (date_trunc('quarter', p.start_date) + ((a.project_quarter_number - 1) * interval '3 months'))) as calendar_quarter
from
    public.allocations a
join
    public.projects p on a.project_id = p.id;

-- Update import_data function
create or replace function public.import_data(
  projects jsonb,
  resources jsonb,
  allocations jsonb
) returns void
language plpgsql
security definer
as $$
begin
  -- Temporarily disable RLS for the session
  set session_replication_role = 'replica';

  -- Clear existing data
  truncate public.allocations cascade;
  truncate public.resources cascade;
  truncate public.projects cascade;
  
  -- Import new data
  insert into public.projects select * from jsonb_populate_recordset(null::public.projects, projects);
  insert into public.resources select * from jsonb_populate_recordset(null::public.resources, resources);
  insert into public.allocations select * from jsonb_populate_recordset(null::public.allocations, allocations);

  -- Re-enable RLS
  set session_replication_role = 'origin';
end;
$$;