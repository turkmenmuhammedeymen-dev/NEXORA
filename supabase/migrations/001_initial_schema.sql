-- NEXORA initial schema — Supabase / PostgreSQL
-- Independent community platform. Apply in a dedicated Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.clans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 3 and 50),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  description text not null default '' check (char_length(description) <= 700),
  game_tag text not null default 'Car Parking Multiplayer',
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now()
);

create table if not exists public.clan_members (
  clan_id uuid not null references public.clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','moderator','member')),
  status text not null default 'active' check (status in ('pending','active','banned')),
  joined_at timestamptz not null default now(),
  primary key (clan_id, user_id)
);

create table if not exists public.clan_invites (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses between 1 and 100),
  uses integer not null default 0 check (uses >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.clan_messages (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid references public.clans(id) on delete set null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  message_id uuid references public.clan_messages(id) on delete set null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists clan_members_user_idx on public.clan_members(user_id, status);
create index if not exists clan_messages_clan_created_idx on public.clan_messages(clan_id, created_at desc);
create index if not exists reports_clan_status_idx on public.moderation_reports(clan_id, status);

create or replace function public.is_active_clan_member(target_clan uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.clan_members m
    where m.clan_id = target_clan and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function public.is_clan_moderator(target_clan uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.clan_members m
    where m.clan_id = target_clan and m.user_id = auth.uid()
      and m.status = 'active' and m.role in ('owner','moderator')
  );
$$;

alter table public.profiles enable row level security;
alter table public.clans enable row level security;
alter table public.clan_members enable row level security;
alter table public.clan_invites enable row level security;
alter table public.clan_messages enable row level security;
alter table public.moderation_reports enable row level security;

create policy "profiles visible to signed in users" on public.profiles for select to authenticated using (true);
create policy "profile owner insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profile owner update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "public clans and member clans readable" on public.clans for select to authenticated
  using (visibility = 'public' or public.is_active_clan_member(id));
create policy "signed in users create clans as owner" on public.clans for insert to authenticated
  with check (owner_id = auth.uid());
create policy "clan owner updates" on public.clans for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "clan owner deletes" on public.clans for delete to authenticated using (owner_id = auth.uid());

create policy "members visible to clan members" on public.clan_members for select to authenticated
  using (public.is_active_clan_member(clan_id) or user_id = auth.uid());
-- Membership role/status changes should be performed by trusted server functions.
create policy "invites visible to clan moderators" on public.clan_invites for select to authenticated
  using (public.is_clan_moderator(clan_id));
-- Invite issuance/redemption is server-only to prevent token guessing and race conditions.

create policy "members read clan chat" on public.clan_messages for select to authenticated
  using (public.is_active_clan_member(clan_id));
create policy "members send own messages" on public.clan_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_active_clan_member(clan_id));
create policy "sender or moderator removes messages" on public.clan_messages for delete to authenticated
  using (sender_id = auth.uid() or public.is_clan_moderator(clan_id));
create policy "sender edits own messages" on public.clan_messages for update to authenticated
  using (sender_id = auth.uid() and public.is_active_clan_member(clan_id))
  with check (sender_id = auth.uid() and public.is_active_clan_member(clan_id));

create policy "reporter creates own report" on public.moderation_reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy "reporter and clan moderators read reports" on public.moderation_reports for select to authenticated
  using (reporter_id = auth.uid() or (clan_id is not null and public.is_clan_moderator(clan_id)));
-- Report status changes are reserved for a trusted moderation backend.

-- Realtime publication must be enabled from the Supabase dashboard after reviewing project settings.
