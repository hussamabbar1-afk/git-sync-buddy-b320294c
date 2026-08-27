-- Compact decision-oriented analytics for the dashboard.

create or replace function public.get_growth_analytics(p_days integer default 30)
returns jsonb
language sql
stable
security invoker
set search_path = 'public', 'pg_temp'
as $function$
with context as (
  select
    p.company_id,
    greatest(7, least(coalesce(p_days, 30), 365)) as days,
    coalesce(nullif(c.timezone, ''), 'Europe/Berlin') as timezone
  from public.profiles p
  join public.companies c on c.id = p.company_id
  where p.id = auth.uid()
), boundaries as (
  select
    company_id,
    days,
    timezone,
    now() as period_end,
    now() - make_interval(days => days) as current_start,
    now() - make_interval(days => days * 2) as previous_start
  from context
), lead_counts as (
  select
    count(*) filter (
      where l.created_at >= b.current_start and l.created_at < b.period_end
    )::int as current_count,
    count(*) filter (
      where l.created_at >= b.previous_start and l.created_at < b.current_start
    )::int as previous_count
  from boundaries b
  left join public.leads l
    on l.company_id = b.company_id
   and l.created_at >= b.previous_start
   and l.created_at < b.period_end
), conversation_counts as (
  select
    count(*) filter (
      where c.created_at >= b.current_start and c.created_at < b.period_end
    )::int as current_count,
    count(*) filter (
      where c.created_at >= b.previous_start and c.created_at < b.current_start
    )::int as previous_count
  from boundaries b
  left join public.conversations c
    on c.company_id = b.company_id
   and c.created_at >= b.previous_start
   and c.created_at < b.period_end
), appointment_counts as (
  select
    count(*) filter (
      where a.created_at >= b.current_start and a.created_at < b.period_end
    )::int as current_count,
    count(*) filter (
      where a.created_at >= b.previous_start and a.created_at < b.current_start
    )::int as previous_count
  from boundaries b
  left join public.appointments a
    on a.company_id = b.company_id
   and a.created_at >= b.previous_start
   and a.created_at < b.period_end
), sources as (
  select
    coalesce(nullif(btrim(l.utm_source), ''), nullif(btrim(l.source), ''), 'Direkt') as source,
    count(*)::int as count
  from boundaries b
  join public.leads l
    on l.company_id = b.company_id
   and l.created_at >= b.current_start
   and l.created_at < b.period_end
  group by 1
  order by count(*) desc, 1
  limit 6
), busiest_hours as (
  select
    extract(hour from timezone(b.timezone, c.created_at))::int as hour,
    count(*)::int as count
  from boundaries b
  join public.conversations c
    on c.company_id = b.company_id
   and c.created_at >= b.current_start
   and c.created_at < b.period_end
  group by 1
  order by count(*) desc, 1
  limit 4
)
select jsonb_build_object(
  'days', coalesce((select days from context), greatest(7, least(coalesce(p_days, 30), 365))),
  'leads', jsonb_build_object(
    'current', coalesce((select current_count from lead_counts), 0),
    'previous', coalesce((select previous_count from lead_counts), 0),
    'change_percent', case
      when coalesce((select previous_count from lead_counts), 0) = 0
        then case when coalesce((select current_count from lead_counts), 0) > 0 then 100 else 0 end
      else round(
        100.0 * (
          coalesce((select current_count from lead_counts), 0) -
          coalesce((select previous_count from lead_counts), 0)
        ) / (select previous_count from lead_counts)
      )::int
    end
  ),
  'conversations', jsonb_build_object(
    'current', coalesce((select current_count from conversation_counts), 0),
    'previous', coalesce((select previous_count from conversation_counts), 0),
    'change_percent', case
      when coalesce((select previous_count from conversation_counts), 0) = 0
        then case when coalesce((select current_count from conversation_counts), 0) > 0 then 100 else 0 end
      else round(
        100.0 * (
          coalesce((select current_count from conversation_counts), 0) -
          coalesce((select previous_count from conversation_counts), 0)
        ) / (select previous_count from conversation_counts)
      )::int
    end
  ),
  'appointments', jsonb_build_object(
    'current', coalesce((select current_count from appointment_counts), 0),
    'previous', coalesce((select previous_count from appointment_counts), 0),
    'change_percent', case
      when coalesce((select previous_count from appointment_counts), 0) = 0
        then case when coalesce((select current_count from appointment_counts), 0) > 0 then 100 else 0 end
      else round(
        100.0 * (
          coalesce((select current_count from appointment_counts), 0) -
          coalesce((select previous_count from appointment_counts), 0)
        ) / (select previous_count from appointment_counts)
      )::int
    end
  ),
  'sources', coalesce(
    (select jsonb_agg(jsonb_build_object('source', source, 'count', count) order by count desc, source) from sources),
    '[]'::jsonb
  ),
  'busiest_hours', coalesce(
    (select jsonb_agg(jsonb_build_object('hour', hour, 'count', count) order by count desc, hour) from busiest_hours),
    '[]'::jsonb
  )
);
$function$;

revoke all on function public.get_growth_analytics(integer) from public, anon;
grant execute on function public.get_growth_analytics(integer) to authenticated;
