-- Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
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
  user_id uuid references public.profiles(id) on delete set null,
  template_slug text not null,
  title text not null,
  status text default 'open' check (status in ('open', 'pending', 'closed')),
  visibility text default 'open' check (visibility in ('open', 'internal')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ticket fields (answers)
create table if not exists public.ticket_fields (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade,
  field_name text not null,
  field_value text,
  file_url text
);

-- Ticket messages (chat)
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  message text not null,
  is_staff boolean default false,
  created_at timestamptz default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_fields enable row level security;
alter table public.ticket_messages enable row level security;

-- Profiles: anyone can read, users can update own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Templates: anyone can read
create policy "Templates are viewable by everyone" on public.templates for select using (true);
create policy "Owners can insert templates" on public.templates for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);
create policy "Owners can update templates" on public.templates for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);
create policy "Owners can delete templates" on public.templates for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- Tickets: open tickets are public, users see own
create policy "Open tickets are public" on public.tickets for select using (visibility = 'open');
create policy "Users can view own tickets" on public.tickets for select using (user_id = auth.uid());
create policy "Authenticated users can create tickets" on public.tickets for insert with check (auth.uid() is not null);
create policy "Users can update own tickets" on public.tickets for update using (user_id = auth.uid());
create policy "Owners can update any ticket" on public.tickets for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- Ticket fields: same as tickets
create policy "Ticket fields follow ticket visibility" on public.ticket_fields for select using (
  exists (select 1 from public.tickets where id = ticket_id and visibility = 'open')
  or exists (select 1 from public.tickets t join public.profiles p on t.user_id = p.id where t.id = ticket_id and p.id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);
create policy "Users can insert own ticket fields" on public.ticket_fields for insert with check (
  exists (select 1 from public.tickets where id = ticket_id and user_id = auth.uid())
);
create policy "Users can update own ticket fields" on public.ticket_fields for update using (
  exists (select 1 from public.tickets where id = ticket_id and user_id = auth.uid())
);

-- Ticket messages: public for open tickets, auth for own
create policy "Open ticket messages are public" on public.ticket_messages for select using (
  exists (select 1 from public.tickets where id = ticket_id and visibility = 'open')
);
create policy "Users can view own ticket messages" on public.ticket_messages for select using (
  exists (select 1 from public.tickets where id = ticket_id and user_id = auth.uid())
);
create policy "Users can insert own messages" on public.ticket_messages for insert with check (
  exists (select 1 from public.tickets where id = ticket_id and user_id = auth.uid())
);
create policy "Users can insert staff messages" on public.ticket_messages for insert with check (
  is_staff = false or exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);
create policy "Owners can insert staff messages" on public.ticket_messages for insert with check (
  is_staff = false or exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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

-- Storage bucket for avatars and uploads
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true);

create policy "Anyone can view avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload own avatar" on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Anyone can view uploads" on storage.objects for select using (bucket_id = 'uploads');
create policy "Authenticated can upload" on storage.objects for insert with check (
  bucket_id = 'uploads' and auth.uid() is not null
);
