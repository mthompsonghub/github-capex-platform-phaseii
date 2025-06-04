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

-- Create a function to check if a user is an admin
create or replace function public.is_admin()
returns boolean as $$
declare
  user_role text;
begin
  select role into user_role
  from public.user_roles
  where user_id = auth.uid();
  
  return coalesce(user_role = 'admin', false);
end;
$$ language plpgsql security definer;

-- Create admin policy for full access
create policy "Enable full access for admin users"
  on public.projects
  for all
  to authenticated
  using (public.is_admin());

create policy "Enable full access for admin users"
  on public.resources
  for all
  to authenticated
  using (public.is_admin());

create policy "Enable full access for admin users"
  on public.allocations
  for all
  to authenticated
  using (public.is_admin());

-- Update import_data function with proper permissions
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
  is_admin_user boolean;
begin
  -- Check if user is admin
  select public.is_admin() into is_admin_user;
  if not is_admin_user then
    raise exception 'Access denied. Only administrators can import data.';
  end if;

  -- Validate input data
  if projects is null or resources is null or allocations is null then
    raise exception 'Invalid input data: all parameters must be provided';
  end if;

  -- Start transaction
  begin
    -- Clear existing data with proper error handling
    begin
      delete from public.allocations;
      delete from public.resources;
      delete from public.projects;
    exception when others then
      get stacked diagnostics error_message = message_text;
      raise exception 'Failed to clear existing data: %', error_message;
    end;
    
    -- Import new data with error handling
    begin
      insert into public.projects 
      select * from jsonb_populate_recordset(null::public.projects, projects)
      on conflict (id) do update 
      set name = EXCLUDED.name,
          status = EXCLUDED.status,
          priority = EXCLUDED.priority,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          resource_order = EXCLUDED.resource_order;
    exception when others then
      get stacked diagnostics error_message = message_text;
      raise exception 'Failed to import projects: %', error_message;
    end;

    begin
      insert into public.resources 
      select * from jsonb_populate_recordset(null::public.resources, resources)
      on conflict (id) do update 
      set name = EXCLUDED.name,
          title = EXCLUDED.title,
          department = EXCLUDED.department;
    exception when others then
      get stacked diagnostics error_message = message_text;
      raise exception 'Failed to import resources: %', error_message;
    end;

    begin
      insert into public.allocations 
      select * from jsonb_populate_recordset(null::public.allocations, allocations)
      on conflict (project_id, resource_id, project_quarter_number) do update 
      set percentage = EXCLUDED.percentage;
    exception when others then
      get stacked diagnostics error_message = message_text;
      raise exception 'Failed to import allocations: %', error_message;
    end;

    return;
  exception when others then
    raise;
  end;
end;
$$;

-- Reset and grant proper permissions
revoke all on function public.import_data(jsonb, jsonb, jsonb) from public, authenticated;
revoke all on function public.is_admin() from public, authenticated;

alter function public.import_data(jsonb, jsonb, jsonb) owner to postgres;
alter function public.is_admin() owner to postgres;

grant execute on function public.import_data(jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.is_admin() to authenticated;