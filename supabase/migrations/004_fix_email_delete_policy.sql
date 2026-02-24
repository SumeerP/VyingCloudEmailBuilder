-- =============================================
-- Fix: Allow all org members to delete emails
-- =============================================
-- The original policy restricted email deletion to owner/admin only.
-- For the email builder, editors should be able to delete their own drafts.
-- RLS already scopes to org_id, so any org member can only delete org emails.

drop policy if exists "Users can delete org emails" on public.emails;

create policy "Users can delete org emails"
  on public.emails for delete
  using (org_id = public.get_user_org_id());
