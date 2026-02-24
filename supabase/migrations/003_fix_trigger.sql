-- =============================================
-- Fix: handle_new_user() trigger function
-- =============================================
-- The original trigger used `set search_path = ''` which breaks
-- access to gen_random_uuid() and other extension functions.
-- Also, building JSON via string concatenation is fragile.
--
-- This version uses json_build_object() and sets search_path
-- to include 'public' and 'extensions'.

-- Drop existing trigger first
drop trigger if exists on_auth_user_created on auth.users;

-- Recreate the function with proper search_path
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $$
declare
  new_org_id uuid;
  user_name text;
  org_name_val text;
  org_slug text;
begin
  user_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  org_name_val := coalesce(new.raw_user_meta_data->>'org_name', user_name || '''s Organization');
  org_slug := replace(lower(org_name_val), ' ', '-') || '-' || substr(new.id::text, 1, 8);

  -- Create org
  insert into organizations (name, slug)
  values (org_name_val, org_slug)
  returning id into new_org_id;

  -- Create user profile
  insert into user_profiles (id, email, full_name, org_id, role)
  values (new.id, new.email, user_name, new_org_id, 'owner');

  -- Create default brand kit using json_build_object (safer than string concatenation)
  insert into brand_kits (org_id, name, config, is_default, created_by)
  values (
    new_org_id,
    'Default Brand',
    json_build_object(
      'version', 1,
      'locked', false,
      'org', org_name_val,
      'logo', '',
      'primary', '#0ea5e9',
      'secondary', '#6366f1',
      'accent', '#f59e0b',
      'success', '#10b981',
      'danger', '#ef4444',
      'textPrimary', '#111827',
      'textSecondary', '#6b7280',
      'textInverse', '#ffffff',
      'bgPage', '#f1f5f9',
      'bgContent', '#ffffff',
      'bgMuted', '#f8fafc',
      'dividerColor', '#e2e8f0',
      'fontHeading', 'Arial, Helvetica, sans-serif',
      'fontBody', 'Arial, Helvetica, sans-serif',
      'sizeH1', 32,
      'sizeH2', 24,
      'sizeH3', 18,
      'sizeBody', 15,
      'sizeSmall', 13,
      'lineHeightBody', 1.6,
      'lineHeightHeading', 1.25,
      'fontWeightHeading', '700',
      'fontWeightBody', '400',
      'letterSpacingHeading', 0,
      'btnBg', '#0ea5e9',
      'btnText', '#ffffff',
      'btnBgSecondary', '#6366f1',
      'btnTextSecondary', '#ffffff',
      'btnRadius', 6,
      'btnFontSize', 15,
      'btnFontWeight', '700',
      'btnPaddingH', 28,
      'btnPaddingV', 13,
      'spacingUnit', 8,
      'emailWidth', 600,
      'contentPadding', 20,
      'linkColor', '#0ea5e9',
      'linkDecoration', 'none'
    )::jsonb,
    true,
    new.id
  );

  return new;
end;
$$;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Clean up any orphaned auth users from failed signups
-- (They exist in auth.users but have no profile/org)
-- You may need to delete these manually from Supabase Auth dashboard
