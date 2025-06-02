-- Drop existing view first
drop view if exists public.calendar_allocations;

-- Drop existing objects
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
    extract(year from (date_trunc('quarter', p.start_date) + ((a.project_quarter_number - 1) * interval '3 months')))::integer as calendar_year,
    extract(quarter from (date_trunc('quarter', p.start_date) + ((a.project_quarter_number - 1) * interval '3 months')))::integer as calendar_quarter
from
    public.allocations a
join
    public.projects p on a.project_id = p.id;

-- Drop existing import_data function if it exists
drop function if exists public.import_data(jsonb, jsonb, jsonb);

-- Create new import_data function with proper permissions and error handling
create or replace function public.import_data(
  projects jsonb,
  resources jsonb,
  allocations jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  error_message text;
begin
  -- Validate input data
  if projects is null or resources is null or allocations is null then
    raise exception 'Invalid input data: all parameters must be provided';
  end if;

  -- Start transaction
  begin
    -- Temporarily disable RLS for the session
    set local session_replication_role = 'replica';

    -- Clear existing data
    truncate public.allocations cascade;
    truncate public.resources cascade;
    truncate public.projects cascade;
    
    -- Import new data with error handling
    begin
      insert into public.projects select * from jsonb_populate_recordset(null::public.projects, projects);
    exception when others then
      get stacked diagnostics error_message = message_text;
      raise exception 'Failed to import projects: %', error_message;
    end;

    begin
      insert into public.resources select * from jsonb_populate_recordset(null::public.resources, resources);
    exception when others then
      get stacked diagnostics error_message = message_text;
      raise exception 'Failed to import resources: %', error_message;
    end;

    begin
      insert into public.allocations select * from jsonb_populate_recordset(null::public.allocations, allocations);
    exception when others then
      get stacked diagnostics error_message = message_text;
      raise exception 'Failed to import allocations: %', error_message;
    end;

    -- Re-enable RLS
    set local session_replication_role = 'origin';
  exception when others then
    -- Re-enable RLS even if an error occurs
    set local session_replication_role = 'origin';
    raise;
  end;
end;
$$;

-- Revoke public access and grant to authenticated users only
revoke execute on function public.import_data(jsonb, jsonb, jsonb) from public;
grant execute on function public.import_data(jsonb, jsonb, jsonb) to authenticated;