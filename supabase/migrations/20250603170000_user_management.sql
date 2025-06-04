-- Create users table to store additional user information
create table if not exists public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    last_login timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create trigger to update last_login
create or replace function public.handle_auth_user_login()
returns trigger as $$
begin
    insert into public.user_profiles (id, email, last_login)
    values (new.id, new.email, now())
    on conflict (id) do update
    set last_login = now(),
        email = new.email,
        updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users
create or replace trigger on_auth_user_login
    after insert or update on auth.users
    for each row
    execute function public.handle_auth_user_login();

-- Create view that combines user profiles with roles
create or replace view public.user_management_view as
select 
    u.id,
    u.email,
    u.last_login,
    u.created_at as user_created_at,
    coalesce(ur.role, 'user'::text) as role,
    ur.created_at as role_created_at,
    ur.updated_at as role_updated_at
from 
    public.user_profiles u
left join 
    public.user_roles ur on u.id = ur.user_id
order by 
    u.last_login desc nulls last; 