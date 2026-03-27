create extension if not exists pgcrypto;

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (brand_id, creator_id),
  check (brand_id <> creator_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists chat_conversations_brand_id_idx
  on public.chat_conversations (brand_id, last_message_at desc);
create index if not exists chat_conversations_creator_id_idx
  on public.chat_conversations (creator_id, last_message_at desc);
create index if not exists chat_messages_conversation_id_idx
  on public.chat_messages (conversation_id, created_at asc);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Participants can view conversations" on public.chat_conversations;
drop policy if exists "Participants can create conversations" on public.chat_conversations;
drop policy if exists "Participants can update conversations" on public.chat_conversations;

create policy "Participants can view conversations"
on public.chat_conversations
for select
to authenticated
using (auth.uid() = brand_id or auth.uid() = creator_id);

create policy "Participants can create conversations"
on public.chat_conversations
for insert
to authenticated
with check (
  auth.uid() = created_by
  and (
    auth.uid() = brand_id
    or auth.uid() = creator_id
  )
  and exists (
    select 1
    from public.campaign_applications applications
    join public.campaigns campaigns
      on campaigns.id = applications.campaign_id
    where campaigns.brand_id = public.chat_conversations.brand_id
      and applications.creator_id = public.chat_conversations.creator_id
  )
);

create policy "Participants can update conversations"
on public.chat_conversations
for update
to authenticated
using (auth.uid() = brand_id or auth.uid() = creator_id)
with check (auth.uid() = brand_id or auth.uid() = creator_id);

drop policy if exists "Participants can view messages" on public.chat_messages;
drop policy if exists "Participants can send messages" on public.chat_messages;

create policy "Participants can view messages"
on public.chat_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_conversations conversations
    where conversations.id = public.chat_messages.conversation_id
      and (conversations.brand_id = auth.uid() or conversations.creator_id = auth.uid())
  )
);

create policy "Participants can send messages"
on public.chat_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations conversations
    where conversations.id = public.chat_messages.conversation_id
      and (conversations.brand_id = auth.uid() or conversations.creator_id = auth.uid())
  )
);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'chat_messages'
    ) then
      alter publication supabase_realtime add table public.chat_messages;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'chat_conversations'
    ) then
      alter publication supabase_realtime add table public.chat_conversations;
    end if;
  end if;
end $$;
