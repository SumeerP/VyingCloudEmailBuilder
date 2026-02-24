-- =============================================
-- Fix: Infinite recursion in RLS policies
-- =============================================
-- The original policies on user_profiles referenced user_profiles itself,
-- causing infinite recursion. Fix: use a security definer function to
-- get the user's org_id without triggering RLS.

-- Step 1: Create a helper function that bypasses RLS
create or replace function public.get_user_org_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select org_id from public.user_profiles where id = auth.uid()
$$;

-- Step 2: Drop all existing policies that cause recursion
drop policy if exists "Users can view own org" on public.organizations;
drop policy if exists "Users can view profiles in own org" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can view org emails" on public.emails;
drop policy if exists "Users can create org emails" on public.emails;
drop policy if exists "Users can update org emails" on public.emails;
drop policy if exists "Users can delete org emails" on public.emails;
drop policy if exists "Users can view email versions" on public.email_versions;
drop policy if exists "Users can create email versions" on public.email_versions;
drop policy if exists "Users can view org blocks" on public.content_blocks;
drop policy if exists "Users can create org blocks" on public.content_blocks;
drop policy if exists "Users can update org blocks" on public.content_blocks;
drop policy if exists "Users can delete org blocks" on public.content_blocks;
drop policy if exists "Users can view org brand kits" on public.brand_kits;
drop policy if exists "Users can create org brand kits" on public.brand_kits;
drop policy if exists "Users can update org brand kits" on public.brand_kits;

-- Step 3: Recreate policies using the helper function

-- Organizations: users can read their own org
create policy "Users can view own org"
  on public.organizations for select
  using (id = public.get_user_org_id());

-- User profiles: users can view profiles in their org
-- Use auth.uid() directly for the self-referencing table
create policy "Users can view own profile"
  on public.user_profiles for select
  using (id = auth.uid());

create policy "Users can view org profiles"
  on public.user_profiles for select
  using (org_id = public.get_user_org_id());

create policy "Users can update own profile"
  on public.user_profiles for update
  using (id = auth.uid());

-- Emails: org-scoped CRUD
create policy "Users can view org emails"
  on public.emails for select
  using (org_id = public.get_user_org_id());

create policy "Users can create org emails"
  on public.emails for insert
  with check (org_id = public.get_user_org_id());

create policy "Users can update org emails"
  on public.emails for update
  using (org_id = public.get_user_org_id());

create policy "Users can delete org emails"
  on public.emails for delete
  using (org_id = public.get_user_org_id()
    and (select role from public.user_profiles where id = auth.uid()) in ('owner', 'admin'));

-- Email versions: follow email access
create policy "Users can view email versions"
  on public.email_versions for select
  using (email_id in (select id from public.emails where org_id = public.get_user_org_id()));

create policy "Users can create email versions"
  on public.email_versions for insert
  with check (email_id in (select id from public.emails where org_id = public.get_user_org_id()));

-- Content blocks: org-scoped
create policy "Users can view org blocks"
  on public.content_blocks for select
  using (org_id = public.get_user_org_id());

create policy "Users can create org blocks"
  on public.content_blocks for insert
  with check (org_id = public.get_user_org_id());

create policy "Users can update org blocks"
  on public.content_blocks for update
  using (org_id = public.get_user_org_id());

create policy "Users can delete org blocks"
  on public.content_blocks for delete
  using (org_id = public.get_user_org_id());

-- Brand kits: org-scoped
create policy "Users can view org brand kits"
  on public.brand_kits for select
  using (org_id = public.get_user_org_id());

create policy "Users can create org brand kits"
  on public.brand_kits for insert
  with check (org_id = public.get_user_org_id());

create policy "Users can update org brand kits"
  on public.brand_kits for update
  using (org_id = public.get_user_org_id());
