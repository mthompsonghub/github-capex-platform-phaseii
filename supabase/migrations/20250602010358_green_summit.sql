-- Drop existing import_data function if it exists
drop function if exists public.import_data(jsonb, jsonb, jsonb);

-- Create new import_data function with explicit role setting
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
  -- Set role to postgres explicitly
  set role postgres;

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

    -- Reset role
    reset role;
    
    -- Re-enable RLS
    set local session_replication_role = 'origin';
  exception when others then
    -- Reset role and re-enable RLS even if an error occurs
    reset role;
    set local session_replication_role = 'origin';
    raise;
  end;
end;
$$;

-- Revoke public access and grant to authenticated users only
revoke execute on function public.import_data(jsonb, jsonb, jsonb) from public;
grant execute on function public.import_data(jsonb, jsonb, jsonb) to authenticated;