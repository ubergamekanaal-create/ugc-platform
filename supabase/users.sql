create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('brand', 'creator')),
  naam text,
  aangemaakt_op timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Service role can insert users"
on public.users
for insert
to service_role
with check (true);
