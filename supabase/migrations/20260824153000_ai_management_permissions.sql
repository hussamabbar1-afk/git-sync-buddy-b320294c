-- Administrative screens write only through tenant-scoped RLS policies. The
-- table privileges below make those existing policies reachable for signed-in
-- owners/admins without granting anonymous access or bypassing RLS.

grant update on table public.ai_agents to authenticated;
grant update on table public.companies to authenticated;
grant update on table public.widget_display_settings to authenticated;
grant update on table public.widget_security_settings to authenticated;

grant insert, update, delete on table public.knowledge_items to authenticated;
grant update on table public.knowledge_gaps to authenticated;
