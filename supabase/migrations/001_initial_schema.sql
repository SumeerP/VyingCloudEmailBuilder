-- =============================================
-- VyingCloud Email Builder - Multi-tenant Schema
-- =============================================

-- Organizations (tenants)
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- User profiles (linked to auth.users)
create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  org_id uuid references public.organizations(id) on delete cascade not null,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Emails
create table public.emails (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null default 'Untitled Email',
  subject text not null default '',
  preheader text,
  from_name text,
  from_email text,
  components jsonb not null default '[]'::jsonb,
  global_styles jsonb not null default '{}'::jsonb,
  ab_enabled boolean not null default false,
  ab_config jsonb,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'sent')),
  created_by uuid references auth.users(id) not null,
  updated_by uuid references auth.users(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Email versions (history/snapshots)
create table public.email_versions (
  id uuid default gen_random_uuid() primary key,
  email_id uuid references public.emails(id) on delete cascade not null,
  version_number integer not null,
  components jsonb not null default '[]'::jsonb,
  global_styles jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz default now() not null,
  comment text,
  unique(email_id, version_number)
);

-- Content blocks (reusable)
create table public.content_blocks (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  description text,
  category text not null default 'Content',
  tags text[] not null default '{}',
  components jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Brand kits
create table public.brand_kits (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null default 'Default Brand',
  config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index idx_user_profiles_org on public.user_profiles(org_id);
create index idx_emails_org on public.emails(org_id);
create index idx_emails_status on public.emails(status);
create index idx_emails_created_by on public.emails(created_by);
create index idx_email_versions_email on public.email_versions(email_id);
create index idx_content_blocks_org on public.content_blocks(org_id);
create index idx_brand_kits_org on public.brand_kits(org_id);

-- Row Level Security
alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.emails enable row level security;
alter table public.email_versions enable row level security;
alter table public.content_blocks enable row level security;
alter table public.brand_kits enable row level security;

-- RLS Policies: Users can only access data within their organization

-- Organizations: users can read their own org
create policy "Users can view own org"
  on public.organizations for select
  using (id in (select org_id from public.user_profiles where id = auth.uid()));

-- User profiles: users can read profiles in their org
create policy "Users can view profiles in own org"
  on public.user_profiles for select
  using (org_id in (select org_id from public.user_profiles where id = auth.uid()));

create policy "Users can update own profile"
  on public.user_profiles for update
  using (id = auth.uid());

-- Emails: org-scoped CRUD
create policy "Users can view org emails"
  on public.emails for select
  using (org_id in (select org_id from public.user_profiles where id = auth.uid()));

create policy "Users can create org emails"
  on public.emails for insert
  with check (org_id in (select org_id from public.user_profiles where id = auth.uid()));

create policy "Users can update org emails"
  on public.emails for update
  using (org_id in (select org_id from public.user_profiles where id = auth.uid()));

create policy "Users can delete org emails"
  on public.emails for delete
  using (org_id in (select org_id from public.user_profiles where id = auth.uid())
    and (select role from public.user_profiles where id = auth.uid()) in ('owner', 'admin'));

-- Email versions: follow email access
create policy "Users can view email versions"
  on public.email_versions for select
  using (email_id in (select id from public.emails where org_id in (select org_id from public.user_profiles where id = auth.uid())));

create policy "Users can create email versions"
  on public.email_versions for insert
  with check (email_id in (select id from public.emails where org_id in (select org_id from public.user_profiles where id = auth.uid())));

-- Content blocks: org-scoped
create policy "Users can view org blocks"
  on public.content_blocks for select
  using (org_id in (select org_id from public.user_profiles where id = auth.uid()));

create policy "Users can create org blocks"
  on public.content_blocks for insert
  with check (org_id in (select org_id from public.user_profiles where id = auth.uid()));

create policy "Users can update org blocks"
  on public.content_blocks for update
  using (org_id in (select org_id from public.user_profiles where id = auth.uid()));

create policy "Users can delete org blocks"
  on public.content_blocks for delete
  using (org_id in (select org_id from public.user_profiles where id = auth.uid()));

-- Brand kits: org-scoped
create policy "Users can view org brand kits"
  on public.brand_kits for select
  using (org_id in (select org_id from public.user_profiles where id = auth.uid()));

create policy "Users can create org brand kits"
  on public.brand_kits for insert
  with check (org_id in (select org_id from public.user_profiles where id = auth.uid()));

create policy "Users can update org brand kits"
  on public.brand_kits for update
  using (org_id in (select org_id from public.user_profiles where id = auth.uid()));

-- Function to auto-create org and profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  new_org_id uuid;
  user_name text;
  org_name text;
begin
  user_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  org_name := coalesce(new.raw_user_meta_data->>'org_name', user_name || '''s Organization');

  insert into public.organizations (name, slug)
  values (org_name, replace(lower(org_name), ' ', '-') || '-' || substr(new.id::text, 1, 8))
  returning id into new_org_id;

  insert into public.user_profiles (id, email, full_name, org_id, role)
  values (new.id, new.email, user_name, new_org_id, 'owner');

  -- Create default brand kit
  insert into public.brand_kits (org_id, name, config, is_default, created_by)
  values (new_org_id, 'Default Brand', '{
    "version": 1, "locked": false, "org": "' || org_name || '",
    "logo": "", "primary": "#0ea5e9", "secondary": "#6366f1", "accent": "#f59e0b",
    "success": "#10b981", "danger": "#ef4444",
    "textPrimary": "#111827", "textSecondary": "#6b7280", "textInverse": "#ffffff",
    "bgPage": "#f1f5f9", "bgContent": "#ffffff", "bgMuted": "#f8fafc", "dividerColor": "#e2e8f0",
    "fontHeading": "Arial, Helvetica, sans-serif", "fontBody": "Arial, Helvetica, sans-serif",
    "sizeH1": 32, "sizeH2": 24, "sizeH3": 18, "sizeBody": 15, "sizeSmall": 13,
    "lineHeightBody": 1.6, "lineHeightHeading": 1.25,
    "fontWeightHeading": "700", "fontWeightBody": "400", "letterSpacingHeading": 0,
    "btnBg": "#0ea5e9", "btnText": "#ffffff", "btnBgSecondary": "#6366f1", "btnTextSecondary": "#ffffff",
    "btnRadius": 6, "btnFontSize": 15, "btnFontWeight": "700", "btnPaddingH": 28, "btnPaddingV": 13,
    "spacingUnit": 8, "emailWidth": 600, "contentPadding": 20,
    "linkColor": "#0ea5e9", "linkDecoration": "none"
  }'::jsonb, true, new.id);

  return new;
end;
$$;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger function
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.organizations for each row execute procedure public.update_updated_at();
create trigger set_updated_at before update on public.user_profiles for each row execute procedure public.update_updated_at();
create trigger set_updated_at before update on public.emails for each row execute procedure public.update_updated_at();
create trigger set_updated_at before update on public.content_blocks for each row execute procedure public.update_updated_at();
create trigger set_updated_at before update on public.brand_kits for each row execute procedure public.update_updated_at();
