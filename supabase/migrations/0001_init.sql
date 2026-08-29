-- Ajaia Docs — initial schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- for a fresh project. Safe to re-run: every statement is idempotent.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth.users row, kept in sync by a trigger below. Storing a
-- profile table (rather than querying auth.users directly) lets the app
-- read names/emails under RLS without exposing the auth schema.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by any authenticated user" on public.profiles;
create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- documents (table only — its policies reference document_shares below, so
-- both tables must exist before either one's policies are created)
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled Document',
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_owner_id_idx on public.documents (owner_id);

-- ---------------------------------------------------------------------------
-- document_shares (table only)
-- ---------------------------------------------------------------------------
create table if not exists public.document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission text not null check (permission in ('editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (document_id, user_id)
);

create index if not exists document_shares_document_id_idx on public.document_shares (document_id);
create index if not exists document_shares_user_id_idx on public.document_shares (user_id);

-- ---------------------------------------------------------------------------
-- RLS helper functions
--
-- documents' policies need to check document_shares, and document_shares'
-- policies need to check documents (to find the owner). If both policies
-- query each other directly, Postgres detects a circular dependency and
-- fails with "infinite recursion detected in policy" on every query.
--
-- SECURITY DEFINER functions break the cycle: they run with the privileges
-- of the function owner (the role that ran this migration), which owns
-- both tables and is therefore exempt from their RLS policies. A policy
-- calling one of these functions triggers a direct, non-RLS-checked lookup
-- instead of recursing back through the other table's policy.
-- ---------------------------------------------------------------------------
create or replace function public.is_document_owner(target_document_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.documents d
    where d.id = target_document_id
      and d.owner_id = auth.uid()
  );
$$;

create or replace function public.document_share_permission(target_document_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select permission from public.document_shares
  where document_id = target_document_id
    and user_id = auth.uid()
  limit 1;
$$;

revoke execute on function public.is_document_owner(uuid) from public;
revoke execute on function public.document_share_permission(uuid) from public;
grant execute on function public.is_document_owner(uuid) to authenticated;
grant execute on function public.document_share_permission(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- documents policies
-- ---------------------------------------------------------------------------
alter table public.documents enable row level security;

drop policy if exists "owners and shared users can view documents" on public.documents;
create policy "owners and shared users can view documents"
  on public.documents for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or public.document_share_permission(id) is not null
  );

drop policy if exists "users can create their own documents" on public.documents;
create policy "users can create their own documents"
  on public.documents for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "owners and editors can update documents" on public.documents;
create policy "owners and editors can update documents"
  on public.documents for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    or public.document_share_permission(id) = 'editor'
  )
  with check (
    owner_id = (select auth.uid())
    or public.document_share_permission(id) = 'editor'
  );

drop policy if exists "owners can delete documents" on public.documents;
create policy "owners can delete documents"
  on public.documents for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- document_shares policies
-- ---------------------------------------------------------------------------
alter table public.document_shares enable row level security;

drop policy if exists "owners and recipients can view shares" on public.document_shares;
create policy "owners and recipients can view shares"
  on public.document_shares for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_document_owner(document_id)
  );

drop policy if exists "owners can share their documents" on public.document_shares;
create policy "owners can share their documents"
  on public.document_shares for insert
  to authenticated
  with check (public.is_document_owner(document_id));

drop policy if exists "owners can update share permissions" on public.document_shares;
create policy "owners can update share permissions"
  on public.document_shares for update
  to authenticated
  using (public.is_document_owner(document_id))
  with check (public.is_document_owner(document_id));

drop policy if exists "owners can revoke shares" on public.document_shares;
create policy "owners can revoke shares"
  on public.document_shares for delete
  to authenticated
  using (public.is_document_owner(document_id));

-- ---------------------------------------------------------------------------
-- keep documents.updated_at current on every write
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auto-create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
