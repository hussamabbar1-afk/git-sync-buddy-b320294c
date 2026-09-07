-- Version matches the migration recorded by the production migration API.
-- Profile membership and role are authorization data, not self-editable settings.
-- Onboarding and team changes use the existing company-scoped SECURITY DEFINER RPCs.
revoke update on table public.profiles from public, anon, authenticated;
revoke update (id, company_id, role, created_at) on table public.profiles
  from public, anon, authenticated;
grant update (full_name, preferences) on table public.profiles to authenticated;

do $$
begin
  if has_column_privilege('authenticated', 'public.profiles', 'company_id', 'update')
     or has_column_privilege('authenticated', 'public.profiles', 'role', 'update') then
    raise exception 'Profile authorization fields must not be self-editable';
  end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'full_name', 'update')
     or not has_column_privilege('authenticated', 'public.profiles', 'preferences', 'update') then
    raise exception 'Profile preferences must remain editable';
  end if;
end;
$$;
