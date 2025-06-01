-- Add resource_order column to projects table
alter table public.projects 
add column if not exists resource_order jsonb default '[]'::jsonb;

-- Create function to update resource order
create or replace function public.update_resource_order(
  project_id uuid,
  new_order jsonb
) returns void
language plpgsql
security definer
as $$
begin
  update public.projects
  set resource_order = new_order
  where id = project_id;
end;
$$;