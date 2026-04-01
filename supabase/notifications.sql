create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  type text not null check (
    type in (
      'campaign_invitation',
      'invitation_response',
      'chat_message',
      'submission_submitted',
      'submission_revision_requested',
      'submission_approved',
      'submission_rejected'
    )
  ),
  title text not null,
  body text not null default '',
  link text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_id_read_at_idx
  on public.notifications (user_id, read_at);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

create policy "Users can view own notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.insert_notification(
  target_user_id uuid,
  target_actor_id uuid,
  notification_type text,
  notification_title text,
  notification_body text,
  notification_link text default null,
  notification_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    return;
  end if;

  if target_actor_id is not null and target_user_id = target_actor_id then
    return;
  end if;

  insert into public.notifications (
    user_id,
    actor_id,
    type,
    title,
    body,
    link,
    metadata
  )
  values (
    target_user_id,
    target_actor_id,
    notification_type,
    notification_title,
    notification_body,
    notification_link,
    coalesce(notification_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.handle_campaign_invitation_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campaign_title text;
  brand_name text;
  creator_name text;
begin
  select
    campaigns.title,
    coalesce(brand_profiles.display_name, brand_profiles.company_name, brand_profiles.full_name, 'Brand'),
    coalesce(creator_profiles.display_name, creator_profiles.full_name, creator_profiles.company_name, 'Creator')
  into campaign_title, brand_name, creator_name
  from public.campaigns campaigns
  left join public.public_profiles brand_profiles
    on brand_profiles.id = new.brand_id
  left join public.public_profiles creator_profiles
    on creator_profiles.id = new.creator_id
  where campaigns.id = new.campaign_id;

  if tg_op = 'INSERT' then
    perform public.insert_notification(
      new.creator_id,
      new.brand_id,
      'campaign_invitation',
      'New campaign invitation',
      brand_name || ' invited you to "' || coalesce(campaign_title, 'Campaign') || '".',
      '/dashboard/my-brands',
      jsonb_build_object(
        'campaign_id', new.campaign_id,
        'invitation_id', new.id
      )
    );

    return new;
  end if;

  if new.status is distinct from old.status and new.status in ('accepted', 'declined') then
    perform public.insert_notification(
      new.brand_id,
      new.creator_id,
      'invitation_response',
      case
        when new.status = 'accepted' then 'Invitation accepted'
        else 'Invitation declined'
      end,
      creator_name || ' ' ||
        case
          when new.status = 'accepted' then 'accepted'
          else 'declined'
        end || ' your invitation for "' || coalesce(campaign_title, 'Campaign') || '".',
      '/dashboard/creators',
      jsonb_build_object(
        'campaign_id', new.campaign_id,
        'invitation_id', new.id,
        'status', new.status
      )
    );
  end if;

  return new;
end;
$$;

create or replace function public.handle_chat_message_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  brand_member_id uuid;
  creator_member_id uuid;
  campaign_member_id uuid;
  recipient_id uuid;
  sender_name text;
  campaign_title text;
  message_preview text;
begin
  select brand_id, creator_id, campaign_id
  into brand_member_id, creator_member_id, campaign_member_id
  from public.chat_conversations
  where id = new.conversation_id;

  if brand_member_id is null or creator_member_id is null then
    return new;
  end if;

  recipient_id := case
    when new.sender_id = brand_member_id then creator_member_id
    else brand_member_id
  end;

  select coalesce(display_name, company_name, full_name, 'Member')
  into sender_name
  from public.public_profiles
  where id = new.sender_id;

  if campaign_member_id is not null then
    select title
    into campaign_title
    from public.campaigns
    where id = campaign_member_id;
  end if;

  message_preview := case
    when char_length(new.body) > 120 then left(new.body, 117) || '...'
    else new.body
  end;

  perform public.insert_notification(
    recipient_id,
    new.sender_id,
    'chat_message',
    'New message from ' || coalesce(sender_name, 'Member'),
    case
      when campaign_title is not null and campaign_title <> '' then
        '"' || campaign_title || '": ' || coalesce(message_preview, '')
      else
        coalesce(message_preview, '')
    end,
    '/dashboard/chat',
    jsonb_build_object(
      'conversation_id', new.conversation_id,
      'message_id', new.id
    )
  );

  return new;
end;
$$;

create or replace function public.handle_campaign_submission_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campaign_title text;
  brand_name text;
  creator_name text;
  review_body text;
begin
  select
    campaigns.title,
    coalesce(brand_profiles.display_name, brand_profiles.company_name, brand_profiles.full_name, 'Brand'),
    coalesce(creator_profiles.display_name, creator_profiles.full_name, creator_profiles.company_name, 'Creator')
  into campaign_title, brand_name, creator_name
  from public.campaigns campaigns
  left join public.public_profiles brand_profiles
    on brand_profiles.id = new.brand_id
  left join public.public_profiles creator_profiles
    on creator_profiles.id = new.creator_id
  where campaigns.id = new.campaign_id;

  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.status = 'submitted' and new.status is distinct from old.status) then
    perform public.insert_notification(
      new.brand_id,
      new.creator_id,
      'submission_submitted',
      'New submission for ' || coalesce(campaign_title, 'Campaign'),
      creator_name || ' submitted deliverables for review.',
      '/dashboard/submissions',
      jsonb_build_object(
        'campaign_id', new.campaign_id,
        'submission_id', new.id
      )
    );

    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    review_body := case
      when coalesce(new.feedback, '') <> '' then new.feedback
      when new.status = 'revision_requested' then brand_name || ' requested revisions on your submission.'
      when new.status = 'approved' then brand_name || ' approved your submission.'
      else brand_name || ' reviewed your submission.'
    end;

    if new.status = 'revision_requested' then
      perform public.insert_notification(
        new.creator_id,
        new.brand_id,
        'submission_revision_requested',
        'Revision requested for ' || coalesce(campaign_title, 'Campaign'),
        review_body,
        '/dashboard',
        jsonb_build_object(
          'campaign_id', new.campaign_id,
          'submission_id', new.id
        )
      );
    elsif new.status = 'approved' then
      perform public.insert_notification(
        new.creator_id,
        new.brand_id,
        'submission_approved',
        'Submission approved for ' || coalesce(campaign_title, 'Campaign'),
        review_body,
        '/dashboard/payouts',
        jsonb_build_object(
          'campaign_id', new.campaign_id,
          'submission_id', new.id
        )
      );
    elsif new.status = 'rejected' then
      perform public.insert_notification(
        new.creator_id,
        new.brand_id,
        'submission_rejected',
        'Submission rejected for ' || coalesce(campaign_title, 'Campaign'),
        review_body,
        '/dashboard',
        jsonb_build_object(
          'campaign_id', new.campaign_id,
          'submission_id', new.id
        )
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists notify_on_campaign_invitation on public.campaign_invitations;
create trigger notify_on_campaign_invitation
after insert or update on public.campaign_invitations
for each row execute procedure public.handle_campaign_invitation_notifications();

drop trigger if exists notify_on_chat_message on public.chat_messages;
create trigger notify_on_chat_message
after insert on public.chat_messages
for each row execute procedure public.handle_chat_message_notifications();

drop trigger if exists notify_on_campaign_submission on public.campaign_submissions;
create trigger notify_on_campaign_submission
after insert or update on public.campaign_submissions
for each row execute procedure public.handle_campaign_submission_notifications();

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
        and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end $$;
