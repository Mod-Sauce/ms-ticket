-- Custom auth: no Supabase Auth used
-- auth_users: id, username, password_hash (bcrypt)
create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Profiles (extends auth_users)
create table if not exists public.profiles (
  id uuid references public.auth_users(id) on delete cascade primary key,
  username text not null,
  avatar_url text,
  role text default 'user' check (role in ('user', 'owner')),
  discord_id text,
  created_at timestamptz default now()
);

-- Templates
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  fields jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.auth_users(id) on delete set null,
  template_slug text not null,
  title text not null,
  status text default 'open' check (status in ('open', 'pending', 'closed')),
  visibility text default 'internal' check (visibility in ('open', 'internal')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ticket fields
create table if not exists public.ticket_fields (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade,
  field_name text not null,
  field_value text,
  file_url text
);

-- Ticket messages
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade,
  user_id uuid references public.auth_users(id) on delete set null,
  message text not null,
  is_staff boolean default false,
  created_at timestamptz default now()
);

-- RLS - using auth.role() set via request header
alter table public.auth_users enable row level security;
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_fields enable row level security;
alter table public.ticket_messages enable row level security;

-- auth_users
create policy "auth_users_insert" on public.auth_users for insert with check (true);
create policy "auth_users_read" on public.auth_users for select using (true);

-- profiles: public read, insert allowed, update own
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (true);
create policy "profiles_update" on public.profiles for update using (
  current_setting('request.headers', true)::json->>'x-user-id' = id::text
);

-- Templates
create policy "templates_read" on public.templates for select using (true);
create policy "templates_insert" on public.templates for insert with check (
  (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
);
create policy "templates_update" on public.templates for update using (
  (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
);
create policy "templates_delete" on public.templates for delete using (
  (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
);

-- Tickets
create policy "tickets_open_read" on public.tickets for select using (visibility = 'open');
create policy "tickets_own_read" on public.tickets for select using (
  (current_setting('request.headers', true)::json->>'x-user-id') = user_id::text
);
create policy "tickets_owner_read" on public.tickets for select using (
  (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
);
create policy "tickets_insert" on public.tickets for insert with check (
  current_setting('request.headers', true)::json->>'x-user-id' is not null
);
create policy "tickets_update" on public.tickets for update
  using (
    (current_setting('request.headers', true)::json->>'x-user-id') = user_id::text
    or (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
  )
  with check (
    (current_setting('request.headers', true)::json->>'x-user-id') = user_id::text
    or (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
  );

-- Ticket fields
create policy "ticket_fields_open_read" on public.ticket_fields for select using (
  exists (select 1 from public.tickets where id = ticket_id and visibility = 'open')
);
create policy "ticket_fields_own_read" on public.ticket_fields for select using (
  exists (
    select 1 from public.tickets
    where id = ticket_id
    and (current_setting('request.headers', true)::json->>'x-user-id') != ''
    and user_id = (current_setting('request.headers', true)::json->>'x-user-id')::uuid
  )
);
create policy "ticket_fields_owner_read" on public.ticket_fields for select using (
  (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
);
create policy "ticket_fields_insert" on public.ticket_fields for insert with check (
  exists (select 1 from public.tickets where id = ticket_id and user_id = (current_setting('request.headers', true)::json->>'x-user-id')::uuid)
);
create policy "ticket_fields_update" on public.ticket_fields for update using (
  exists (select 1 from public.tickets where id = ticket_id and user_id = (current_setting('request.headers', true)::json->>'x-user-id')::uuid)
);

-- Ticket messages
create policy "ticket_messages_open_read" on public.ticket_messages for select using (
  exists (select 1 from public.tickets where id = ticket_id and visibility = 'open')
);
create policy "ticket_messages_own_read" on public.ticket_messages for select using (
  exists (
    select 1 from public.tickets
    where id = ticket_id
    and (current_setting('request.headers', true)::json->>'x-user-id') != ''
    and user_id = (current_setting('request.headers', true)::json->>'x-user-id')::uuid
  )
);
create policy "ticket_messages_owner_read" on public.ticket_messages for select using (
  (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
);
create policy "ticket_messages_insert" on public.ticket_messages for insert with check (
  current_setting('request.headers', true)::json->>'x-user-id' is not null
);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tickets_updated_at
  before update on public.tickets
  for each row execute procedure public.update_updated_at();

-- Storage
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true) on conflict do nothing;

create policy "storage_read" on storage.objects for select using (true);
create policy "storage_upload" on storage.objects for insert with check (
  current_setting('request.headers', true)::json->>'x-user-id' is not null
);
