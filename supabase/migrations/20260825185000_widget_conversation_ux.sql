-- Expose only the public, customer-facing information required for useful
-- first-message shortcuts and a graceful contact fallback in the widget.
create or replace function public.get_widget_public_config(p_widget_key uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'active',
      a.is_active
      and coalesce(w.enabled, false)
      and coalesce(ws.enabled, false)
      and cardinality(coalesce(ws.allowed_origins, '{}'::text[])) > 0,
    'widget_key', a.widget_key,
    'agent_name', a.name,
    'welcome_message', a.welcome_message,
    'fallback_message', a.fallback_message,
    'language', a.language,
    'supported_languages', a.supported_languages,
    'auto_detect_language', a.auto_detect_language,
    'position', coalesce(w.position, 'bottom_right'),
    'primary_color', coalesce(w.primary_color, '#111827'),
    'launcher_label', coalesce(w.launcher_label, 'Chat'),
    'launcher_icon', coalesce(w.launcher_icon, 'chat'),
    'show_branding', coalesce(w.show_branding, true),
    'mobile_fullscreen', coalesce(w.mobile_fullscreen, true),
    'z_index', coalesce(w.z_index, 2147483000),
    'public_widget_base_url', w.public_widget_base_url,
    'max_message_length', coalesce(ws.max_message_length, 4000),
    'contact_phone', c.phone,
    'contact_email', c.email,
    'service_options', coalesce((
      select jsonb_agg(service.name order by service.created_at)
      from (
        select s.name, s.created_at
        from public.services s
        where s.company_id = a.company_id
          and s.is_active
          and nullif(btrim(s.name), '') is not null
        order by s.created_at
        limit 4
      ) service
    ), '[]'::jsonb)
  )
  from public.ai_agents a
  join public.companies c on c.id = a.company_id
  left join public.widget_display_settings w on w.ai_agent_id = a.id
  left join public.widget_security_settings ws on ws.ai_agent_id = a.id
  where a.widget_key = p_widget_key
  limit 1
$$;

revoke all on function public.get_widget_public_config(uuid) from public, anon, authenticated;
grant execute on function public.get_widget_public_config(uuid) to service_role;

comment on function public.get_widget_public_config(uuid) is
  'Service-role-only public widget presentation config; called by the widget-config Edge Function.';
