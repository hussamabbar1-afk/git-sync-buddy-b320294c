-- Platform follow-ups and repeated-error alerts, both delivered through the
-- existing retryable outbound email worker.

alter table public.pilot_requests
  add column if not exists first_followup_sent_at timestamptz,
  add column if not exists second_followup_sent_at timestamptz,
  add column if not exists do_not_contact_at timestamptz;

create table if not exists private.platform_notification_settings (
  singleton boolean primary key default true check (singleton),
  outbound_company_id uuid not null references public.companies(id) on delete restrict,
  alert_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_alert_email_format check (
    alert_email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  )
);

revoke all on table private.platform_notification_settings
  from public, anon, authenticated;

insert into private.platform_notification_settings (
  singleton, outbound_company_id, alert_email
)
select true, p.company_id, lower(u.email)
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = 'hussamabbar4@gmail.com'
  and p.company_id is not null
order by u.created_at
limit 1
on conflict (singleton) do update
set outbound_company_id = excluded.outbound_company_id,
    alert_email = excluded.alert_email,
    updated_at = now();

create or replace function private.generate_pilot_reengagement_emails()
returns integer
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_settings private.platform_notification_settings%rowtype;
  v_request record;
  v_count integer := 0;
  v_stage integer;
begin
  select * into v_settings
  from private.platform_notification_settings
  where singleton;

  if not found then
    return 0;
  end if;

  for v_request in
    select pr.*
    from public.pilot_requests pr
    where pr.status = 'new'
      and pr.do_not_contact_at is null
      and pr.created_at >= now() - interval '30 days'
      and (
        (pr.first_followup_sent_at is null and pr.created_at <= now() - interval '2 days')
        or
        (pr.first_followup_sent_at is not null and pr.second_followup_sent_at is null
          and pr.created_at <= now() - interval '7 days')
      )
    order by pr.created_at
  loop
    v_stage := case when v_request.first_followup_sent_at is null then 1 else 2 end;

    perform private.enqueue_operational_email(
      v_settings.outbound_company_id,
      v_request.email,
      case
        when v_stage = 1 then 'Ihre ZunftEcho-Pilotanfrage – nächster Schritt'
        else 'Kurze Erinnerung zu Ihrer ZunftEcho-Anfrage'
      end,
      concat_ws(E'\n',
        'Guten Tag ' || v_request.contact_name || ',',
        '',
        case
          when v_stage = 1 then
            'vielen Dank für Ihre Anfrage zum ZunftEcho-Pilot für ' || v_request.company || '. Wir würden gern kurz klären, welche Website-Anfragen heute am meisten Zeit kosten.'
          else
            'wir wollten kurz nachfragen, ob ein persönlich eingerichteter ZunftEcho-Pilot für ' || v_request.company || ' weiterhin interessant ist.'
        end,
        '',
        'Antworten Sie einfach auf diese E-Mail. Wenn Sie keine weitere Nachricht wünschen, genügt das Wort STOPP.',
        '',
        'Freundliche Grüße',
        'Mohamad Hosam Alabar',
        'ZunftEcho'
      ),
      'pilot_request',
      v_request.id,
      'pilot_followup:' || v_request.id::text || ':' || v_stage::text,
      now(),
      null,
      jsonb_build_object('kind', 'pilot_reengagement', 'stage', v_stage)
    );

    if v_stage = 1 then
      update public.pilot_requests
      set first_followup_sent_at = now(), updated_at = now()
      where id = v_request.id;
    else
      update public.pilot_requests
      set second_followup_sent_at = now(), updated_at = now()
      where id = v_request.id;
    end if;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;

revoke all on function private.generate_pilot_reengagement_emails()
  from public, anon, authenticated;

create or replace function private.generate_repeated_error_alerts()
returns integer
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_settings private.platform_notification_settings%rowtype;
  v_error record;
  v_count integer := 0;
  v_hour text := to_char(date_trunc('hour', now()) at time zone 'UTC', 'YYYYMMDDHH24');
begin
  select * into v_settings
  from private.platform_notification_settings
  where singleton;

  if not found then
    return 0;
  end if;

  for v_error in
    select
      coalesce(nullif(btrim(we.source), ''), 'unknown') as source,
      coalesce(nullif(btrim(we.error_code), ''), 'unknown') as error_code,
      count(*)::int as error_count,
      max(we.created_at) as last_seen_at
    from public.workflow_errors we
    where we.created_at >= now() - interval '15 minutes'
    group by 1, 2
    having count(*) >= 3
    order by count(*) desc
  loop
    perform private.enqueue_operational_email(
      v_settings.outbound_company_id,
      v_settings.alert_email,
      'ZunftEcho-Systemalarm: wiederholter Fehler',
      concat_ws(E'\n',
        'Innerhalb der letzten 15 Minuten wurde ein Fehler mehrfach protokolliert.',
        '',
        'Quelle: ' || v_error.source,
        'Fehlercode: ' || v_error.error_code,
        'Anzahl: ' || v_error.error_count::text,
        'Zuletzt erkannt: ' || to_char(v_error.last_seen_at at time zone 'Europe/Berlin', 'DD.MM.YYYY HH24:MI') || ' Uhr',
        '',
        'Bitte Supabase-Funktions- und Datenbanklogs prüfen.'
      ),
      'system_health',
      gen_random_uuid(),
      'system_health:' || v_error.source || ':' || v_error.error_code || ':' || v_hour,
      now(),
      null,
      jsonb_build_object(
        'kind', 'repeated_workflow_error',
        'source', v_error.source,
        'error_code', v_error.error_code,
        'count', v_error.error_count,
        'last_seen_at', v_error.last_seen_at
      )
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;

revoke all on function private.generate_repeated_error_alerts()
  from public, anon, authenticated;

do $block$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'zunftecho-pilot-reengagement';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule(
    'zunftecho-pilot-reengagement',
    '15 8 * * *',
    'select private.generate_pilot_reengagement_emails();'
  );

  select jobid into v_job_id from cron.job where jobname = 'zunftecho-repeated-error-alerts';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule(
    'zunftecho-repeated-error-alerts',
    '*/5 * * * *',
    'select private.generate_repeated_error_alerts();'
  );
end;
$block$;
