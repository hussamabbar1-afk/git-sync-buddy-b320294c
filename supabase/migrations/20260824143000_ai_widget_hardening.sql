-- Complete the administrative and runtime hardening for the AI employee and
-- public website widget. Public widget RPCs remain callable only by the
-- service role through the existing Edge Functions / n8n workflow.

create or replace function private.touch_ai_configuration_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_ai_configuration_updated_at() from public, anon, authenticated;

drop trigger if exists trg_touch_ai_agents on public.ai_agents;
create trigger trg_touch_ai_agents
before update on public.ai_agents
for each row execute function private.touch_ai_configuration_updated_at();

drop trigger if exists trg_touch_widget_security_settings on public.widget_security_settings;
create trigger trg_touch_widget_security_settings
before update on public.widget_security_settings
for each row execute function private.touch_ai_configuration_updated_at();

create or replace function private.validate_widget_security_agent()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.ai_agents a
    where a.id = new.ai_agent_id
      and a.company_id = new.company_id
  ) then
    raise exception 'Widget security settings must belong to the AI agent company';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_widget_security_agent() from public, anon, authenticated;

drop trigger if exists trg_validate_widget_security_agent on public.widget_security_settings;
create trigger trg_validate_widget_security_agent
before insert or update of company_id, ai_agent_id on public.widget_security_settings
for each row execute function private.validate_widget_security_agent();

drop policy if exists "Admins can insert widget security settings"
on public.widget_security_settings;
create policy "Admins can insert widget security settings"
on public.widget_security_settings
for insert
to authenticated
with check (
  public.is_company_admin(company_id)
  and exists (
    select 1
    from public.ai_agents a
    where a.id = ai_agent_id
      and a.company_id = widget_security_settings.company_id
  )
);

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
      and coalesce(w.enabled, true)
      and coalesce(s.enabled, true),
    'widget_key', a.widget_key,
    'agent_name', a.name,
    'welcome_message', a.welcome_message,
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
    'max_message_length', coalesce(s.max_message_length, 4000)
  )
  from public.ai_agents a
  left join public.widget_display_settings w on w.ai_agent_id = a.id
  left join public.widget_security_settings s on s.ai_agent_id = a.id
  where a.widget_key = p_widget_key
  limit 1
$$;

create or replace function public.record_widget_installation(
  p_widget_key uuid,
  p_origin text,
  p_platform text default 'unknown',
  p_user_agent text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_agent uuid;
  v_company uuid;
  v_security_enabled boolean;
  v_allowed_origins text[];
  v_origin_input text := lower(btrim(coalesce(p_origin, '')));
  v_origin text;
  v_platform text := lower(coalesce(p_platform, 'unknown'));
begin
  if v_origin_input !~ '^https?://' then
    return false;
  end if;

  v_origin := substring(v_origin_input from '^(https?://[^/]+)');
  if v_origin is null or char_length(v_origin) > 500 then
    return false;
  end if;

  select a.id,
         a.company_id,
         coalesce(s.enabled, true),
         coalesce(s.allowed_origins, '{}'::text[])
  into v_agent, v_company, v_security_enabled, v_allowed_origins
  from public.ai_agents a
  left join public.widget_security_settings s on s.ai_agent_id = a.id
  where a.widget_key = p_widget_key
    and a.is_active
  limit 1;

  if v_agent is null or not v_security_enabled then
    return false;
  end if;

  if cardinality(v_allowed_origins) > 0 and not exists (
    select 1
    from unnest(v_allowed_origins) item(origin)
    where (
      case
        when lower(btrim(item.origin)) ~ '^https?://' then
          substring(lower(btrim(item.origin)) from '^(https?://[^/]+)')
        else regexp_replace(lower(btrim(item.origin)), '/+$', '')
      end
    ) = v_origin
  ) then
    return false;
  end if;

  if v_platform not in ('wordpress', 'wix', 'jimdo', 'webflow', 'shopify', 'custom', 'unknown') then
    v_platform := 'unknown';
  end if;

  -- Bound per-agent cardinality so a copied public key cannot grow this table
  -- without limit. Existing installations continue to receive load counters.
  if not exists (
    select 1 from public.widget_installations wi
    where wi.ai_agent_id = v_agent and wi.origin = v_origin
  ) and (
    select count(*) from public.widget_installations wi where wi.ai_agent_id = v_agent
  ) >= 500 then
    return false;
  end if;

  insert into public.widget_installations(
    company_id,
    ai_agent_id,
    origin,
    platform,
    last_user_agent
  )
  values (
    v_company,
    v_agent,
    v_origin,
    v_platform,
    left(p_user_agent, 500)
  )
  on conflict (ai_agent_id, origin) do update set
    last_seen_at = now(),
    loads_count = public.widget_installations.loads_count + 1,
    platform = excluded.platform,
    last_user_agent = excluded.last_user_agent;

  return true;
end;
$$;

create or replace function public.get_chatbot_context(p_widget_key uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'agent', jsonb_build_object(
      'id', a.id,
      'name', a.name,
      'description', a.description,
      'is_active', a.is_active,
      'language', a.language,
      'supported_languages', a.supported_languages,
      'auto_detect_language', a.auto_detect_language,
      'staff_summary_language', a.staff_summary_language,
      'translate_staff_summary', a.translate_staff_summary,
      'response_style', a.response_style,
      'welcome_message', a.welcome_message,
      'fallback_message', a.fallback_message,
      'human_handoff_enabled', a.human_handoff_enabled
    ),
    'company', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'industry', c.industry,
      'phone', c.phone,
      'email', c.email,
      'address', c.address,
      'description', c.description,
      'appointment_duration_minutes', c.appointment_duration_minutes,
      'minimum_booking_notice_minutes', c.minimum_booking_notice_minutes,
      'handoff_sla_minutes', c.handoff_sla_minutes,
      'timezone', c.timezone
    ),
    'operational_status', jsonb_build_object(
      'timezone', c.timezone,
      'local_timestamp', timezone(c.timezone, now()),
      'local_day_of_week', extract(dow from timezone(c.timezone, now()))::integer,
      'closed_for_business_closure', exists (
        select 1
        from public.business_closures bc
        where bc.company_id = c.id
          and timezone(c.timezone, now())::date between bc.start_date and bc.end_date
      ),
      'is_currently_open',
        not exists (
          select 1
          from public.business_closures bc
          where bc.company_id = c.id
            and timezone(c.timezone, now())::date between bc.start_date and bc.end_date
        )
        and exists (
          select 1
          from public.opening_hours oh
          where oh.company_id = c.id
            and oh.is_open
            and oh.open_time is not null
            and oh.close_time is not null
            and (
              (
                oh.open_time < oh.close_time
                and oh.day_of_week = extract(dow from timezone(c.timezone, now()))::integer
                and timezone(c.timezone, now())::time >= oh.open_time
                and timezone(c.timezone, now())::time < oh.close_time
              )
              or (
                oh.open_time >= oh.close_time
                and (
                  (
                    oh.day_of_week = extract(dow from timezone(c.timezone, now()))::integer
                    and timezone(c.timezone, now())::time >= oh.open_time
                  )
                  or (
                    oh.day_of_week = ((extract(dow from timezone(c.timezone, now()))::integer + 6) % 7)
                    and timezone(c.timezone, now())::time < oh.close_time
                  )
                )
              )
            )
        )
    ),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', s.name,
        'description', s.description,
        'booking_enabled', s.booking_enabled,
        'duration_minutes', s.duration_minutes,
        'effective_duration_minutes', coalesce(s.duration_minutes, c.appointment_duration_minutes),
        'price_from_cents', s.price_from_cents,
        'price_note', s.price_note
      ) order by s.created_at)
      from public.services s
      where s.company_id = c.id and s.is_active = true
    ), '[]'::jsonb),
    'service_areas', coalesce((
      select jsonb_agg(jsonb_build_object('name', sa.name, 'postal_codes', sa.postal_codes) order by sa.created_at)
      from public.service_areas sa
      where sa.company_id = c.id and sa.is_active = true
    ), '[]'::jsonb),
    'opening_hours', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day_of_week', oh.day_of_week,
        'is_open', oh.is_open,
        'open_time', oh.open_time,
        'close_time', oh.close_time
      ) order by oh.day_of_week)
      from public.opening_hours oh
      where oh.company_id = c.id
    ), '[]'::jsonb),
    'business_closures', coalesce((
      select jsonb_agg(jsonb_build_object(
        'start_date', bc.start_date,
        'end_date', bc.end_date,
        'reason', bc.reason
      ) order by bc.start_date)
      from public.business_closures bc
      where bc.company_id = c.id
        and bc.end_date >= current_date
        and bc.start_date <= current_date + 730
    ), '[]'::jsonb)
  )
  into result
  from public.ai_agents a
  join public.companies c on c.id = a.company_id
  where a.widget_key = p_widget_key
    and a.is_active = true;

  if result is null then
    raise exception 'Invalid or inactive widget';
  end if;
  return result;
end;
$$;

comment on function public.get_chatbot_context(uuid) is
  'Service-only chatbot context including company data, opening hours, closures, current operational status, language settings and handoff SLA.';
