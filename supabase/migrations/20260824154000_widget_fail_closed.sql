-- A missing origin allowlist is not a permissive default. Public delivery,
-- installations and chat requests stay blocked until an administrator has
-- explicitly registered at least one customer website origin.

create or replace function public.consume_widget_request(
  p_widget_key uuid,
  p_client_hash text,
  p_origin text default null,
  p_message_length integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions, pg_temp
as $$
declare
  v_agent_id uuid;
  v_enabled boolean;
  v_allowed_origins text[];
  v_hourly_limit integer;
  v_max_length integer;
  v_bucket timestamptz := date_trunc('hour', now());
  v_count integer;
  v_client_hash text := encode(
    extensions.digest(coalesce(nullif(btrim(p_client_hash), ''), 'anonymous'), 'sha256'),
    'hex'
  );
  v_origin_input text := lower(btrim(coalesce(p_origin, '')));
  v_origin text;
  v_origin_allowed boolean;
begin
  v_origin := case
    when v_origin_input ~ '^https?://' then coalesce(
      substring(v_origin_input from '^(https?://[^/]+)'),
      regexp_replace(v_origin_input, '/+$', '')
    )
    else regexp_replace(v_origin_input, '/+$', '')
  end;

  select a.id,
         coalesce(s.enabled, false),
         coalesce(s.allowed_origins, '{}'::text[]),
         coalesce(s.hourly_request_limit, 120),
         coalesce(s.max_message_length, 4000)
  into v_agent_id, v_enabled, v_allowed_origins, v_hourly_limit, v_max_length
  from public.ai_agents a
  left join public.widget_security_settings s on s.ai_agent_id = a.id
  where a.widget_key = p_widget_key and a.is_active = true
  limit 1;

  if v_agent_id is null then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_widget');
  end if;
  if not v_enabled then
    return jsonb_build_object('allowed', false, 'reason', 'widget_disabled');
  end if;
  if cardinality(v_allowed_origins) = 0 then
    return jsonb_build_object('allowed', false, 'reason', 'origin_not_configured');
  end if;
  if p_message_length < 0 or p_message_length > v_max_length then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'message_too_long',
      'max_message_length', v_max_length
    );
  end if;

  select exists (
    select 1
    from unnest(v_allowed_origins) x(origin)
    where (
      case
        when lower(btrim(x.origin)) ~ '^https?://' then coalesce(
          substring(lower(btrim(x.origin)) from '^(https?://[^/]+)'),
          regexp_replace(lower(btrim(x.origin)), '/+$', '')
        )
        else regexp_replace(lower(btrim(x.origin)), '/+$', '')
      end
    ) = v_origin
  ) into v_origin_allowed;

  if not v_origin_allowed then
    return jsonb_build_object('allowed', false, 'reason', 'origin_not_allowed');
  end if;

  insert into private.chat_rate_buckets(
    widget_key, client_hash, bucket_start, request_count, updated_at
  )
  values (p_widget_key, v_client_hash, v_bucket, 1, now())
  on conflict (widget_key, client_hash, bucket_start)
  do update set
    request_count = private.chat_rate_buckets.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  if v_count > v_hourly_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'limit', v_hourly_limit,
      'retry_after_seconds', greatest(
        1,
        extract(epoch from (v_bucket + interval '1 hour' - now()))::integer
      )
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'remaining', greatest(0, v_hourly_limit - v_count),
    'limit', v_hourly_limit,
    'max_message_length', v_max_length
  );
end;
$$;

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
      and coalesce(s.enabled, false)
      and cardinality(coalesce(s.allowed_origins, '{}'::text[])) > 0,
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
  if v_origin_input !~ '^https?://' then return false; end if;
  v_origin := substring(v_origin_input from '^(https?://[^/]+)');
  if v_origin is null or char_length(v_origin) > 500 then return false; end if;

  select a.id,
         a.company_id,
         coalesce(s.enabled, false),
         coalesce(s.allowed_origins, '{}'::text[])
  into v_agent, v_company, v_security_enabled, v_allowed_origins
  from public.ai_agents a
  left join public.widget_security_settings s on s.ai_agent_id = a.id
  where a.widget_key = p_widget_key and a.is_active
  limit 1;

  if v_agent is null or not v_security_enabled or cardinality(v_allowed_origins) = 0 then
    return false;
  end if;
  if not exists (
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
  if not exists (
    select 1 from public.widget_installations wi
    where wi.ai_agent_id = v_agent and wi.origin = v_origin
  ) and (
    select count(*) from public.widget_installations wi where wi.ai_agent_id = v_agent
  ) >= 500 then
    return false;
  end if;

  insert into public.widget_installations(
    company_id, ai_agent_id, origin, platform, last_user_agent
  )
  values (v_company, v_agent, v_origin, v_platform, left(p_user_agent, 500))
  on conflict (ai_agent_id, origin) do update set
    last_seen_at = now(),
    loads_count = public.widget_installations.loads_count + 1,
    platform = excluded.platform,
    last_user_agent = excluded.last_user_agent;

  return true;
end;
$$;

create or replace function public.get_widget_embed_info(p_ai_agent_id uuid default null)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
with me as (
  select p.company_id from public.profiles p where p.id = (select auth.uid())
), agent as (
  select a.id, a.widget_key, a.name, a.is_active
  from public.ai_agents a join me on me.company_id = a.company_id
  where p_ai_agent_id is null or a.id = p_ai_agent_id
  order by a.is_active desc, a.created_at asc limit 1
), cfg as (
  select w.public_widget_base_url,
         w.position,
         w.primary_color,
         w.launcher_label,
         w.enabled,
         coalesce(s.enabled, false) as security_enabled,
         cardinality(coalesce(s.allowed_origins, '{}'::text[])) as allowed_origin_count
  from public.widget_display_settings w
  join agent a on a.id = w.ai_agent_id
  left join public.widget_security_settings s on s.ai_agent_id = a.id
)
select case when (select id from agent) is null then jsonb_build_object('configured', false)
else jsonb_build_object(
  'configured', true,
  'agent_id', (select id from agent),
  'agent_name', (select name from agent),
  'widget_key', (select widget_key from agent),
  'active', (select is_active from agent),
  'loader_url', 'https://srufegisweghdswdsdxb.supabase.co/functions/v1/widget-loader?key=' || (select widget_key::text from agent),
  'script_tag', '<script async src="https://srufegisweghdswdsdxb.supabase.co/functions/v1/widget-loader?key=' || (select widget_key::text from agent) || '"></script>',
  'public_widget_base_url', (select public_widget_base_url from cfg),
  'ready_to_embed', coalesce((
    select enabled
       and security_enabled
       and allowed_origin_count > 0
       and public_widget_base_url is not null
       and public_widget_base_url <> ''
    from cfg
  ), false),
  'position', (select position from cfg),
  'primary_color', (select primary_color from cfg),
  'launcher_label', (select launcher_label from cfg),
  'platform_hints', jsonb_build_object(
    'wordpress', 'HTML/Custom HTML block: paste the script tag once, preferably before </body>.',
    'wix', 'Settings > Custom Code: add the script before body end on all pages.',
    'jimdo', 'Use a Widget/HTML element or custom code area and paste the script.',
    'generic', 'Paste the script once before </body> or through your tag manager.'
  )
) end;
$$;

create or replace function public.get_widget_distribution_status()
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
with me as (
  select company_id from public.profiles where id = (select auth.uid())
), agents as (
  select a.id,
         a.name,
         a.widget_key,
         a.is_active,
         w.enabled,
         w.public_widget_base_url,
         w.position,
         w.primary_color,
         w.launcher_label,
         coalesce(s.enabled, false) as security_enabled,
         cardinality(coalesce(s.allowed_origins, '{}'::text[])) as allowed_origin_count
  from public.ai_agents a
  join me on me.company_id = a.company_id
  left join public.widget_display_settings w on w.ai_agent_id = a.id
  left join public.widget_security_settings s on s.ai_agent_id = a.id
), installs as (
  select wi.ai_agent_id,
         count(*)::int domains,
         max(wi.last_seen_at) last_seen_at,
         coalesce(jsonb_agg(jsonb_build_object(
           'origin', wi.origin,
           'platform', wi.platform,
           'last_seen_at', wi.last_seen_at,
           'loads_count', wi.loads_count
         ) order by wi.last_seen_at desc), '[]'::jsonb) installations
  from public.widget_installations wi
  join me on me.company_id = wi.company_id
  group by wi.ai_agent_id
)
select coalesce(jsonb_agg(jsonb_build_object(
  'agent_id', a.id,
  'agent_name', a.name,
  'widget_key', a.widget_key,
  'active', a.is_active
     and coalesce(a.enabled, false)
     and a.security_enabled
     and a.allowed_origin_count > 0,
  'published', a.public_widget_base_url is not null,
  'public_widget_base_url', a.public_widget_base_url,
  'position', coalesce(a.position, 'bottom_right'),
  'primary_color', coalesce(a.primary_color, '#111827'),
  'launcher_label', coalesce(a.launcher_label, 'Chat'),
  'embed_code', '<script async src="https://srufegisweghdswdsdxb.supabase.co/functions/v1/widget-loader?key=' || a.widget_key::text || '"></script>',
  'installed_domains', coalesce(i.domains, 0),
  'last_seen_at', i.last_seen_at,
  'installations', coalesce(i.installations, '[]'::jsonb)
) order by a.name), '[]'::jsonb)
from agents a left join installs i on i.ai_agent_id = a.id;
$$;

comment on function public.consume_widget_request(uuid, text, text, integer) is
  'Service-only fail-closed origin, message-length and rate-limit guard for public widget chat requests.';
