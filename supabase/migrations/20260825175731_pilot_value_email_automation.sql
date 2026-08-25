-- Pilot value features: opt-in operational email delivery and measurable after-hours value.
-- All customer-facing sends remain disabled until a company explicitly enables them.

alter table public.companies
  add column if not exists operational_email_notifications_enabled boolean not null default false,
  add column if not exists customer_appointment_emails_enabled boolean not null default false;

comment on column public.companies.operational_email_notifications_enabled is
  'Send internal email alerts for newly captured leads and human handoffs.';
comment on column public.companies.customer_appointment_emails_enabled is
  'Send confirmations and reminders for confirmed appointments with a customer email address.';

alter table public.outbound_messages
  add column if not exists dedupe_key text;

create unique index if not exists outbound_messages_company_dedupe_key_idx
  on public.outbound_messages (company_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists outbound_messages_due_email_idx
  on public.outbound_messages (scheduled_at, created_at)
  where channel = 'email' and status = 'queued';

create or replace function private.enqueue_operational_email(
  p_company_id uuid,
  p_recipient text,
  p_subject text,
  p_body text,
  p_entity_type text,
  p_entity_id uuid,
  p_dedupe_key text,
  p_scheduled_at timestamptz default now(),
  p_customer_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $function$
declare
  v_id uuid;
  v_recipient text := lower(btrim(coalesce(p_recipient, '')));
begin
  if p_company_id is null
     or v_recipient = ''
     or v_recipient !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or nullif(btrim(coalesce(p_subject, '')), '') is null
     or nullif(btrim(coalesce(p_body, '')), '') is null
     or nullif(btrim(coalesce(p_dedupe_key, '')), '') is null then
    return null;
  end if;

  insert into public.outbound_messages (
    company_id,
    customer_id,
    channel,
    purpose,
    locale,
    recipient,
    subject,
    body,
    status,
    provider,
    scheduled_at,
    queued_at,
    entity_type,
    entity_id,
    dedupe_key,
    metadata
  ) values (
    p_company_id,
    p_customer_id,
    'email',
    'operational',
    'de-DE',
    v_recipient,
    btrim(p_subject),
    btrim(p_body),
    'queued',
    'brevo',
    coalesce(p_scheduled_at, now()),
    now(),
    p_entity_type,
    p_entity_id,
    btrim(p_dedupe_key),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (company_id, dedupe_key) where dedupe_key is not null do nothing
  returning id into v_id;

  if v_id is null then
    select om.id
      into v_id
      from public.outbound_messages om
     where om.company_id = p_company_id
       and om.dedupe_key = btrim(p_dedupe_key)
     limit 1;
  end if;

  return v_id;
end;
$function$;

revoke all on function private.enqueue_operational_email(
  uuid, text, text, text, text, uuid, text, timestamptz, uuid, jsonb
) from public, anon, authenticated;

create or replace function private.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_company public.companies%rowtype;
  v_lead_label text;
begin
  v_lead_label := case
    when new.name is not null and new.issue_type is not null then new.name || ' – ' || new.issue_type
    when new.name is not null then new.name
    when new.issue_type is not null then new.issue_type
    else 'Ein neuer Interessent wurde erfasst.'
  end;

  perform private.enqueue_company_notification(
    new.company_id,
    'new_lead',
    'Neuer Lead',
    v_lead_label,
    'lead',
    new.id,
    jsonb_build_object('status', new.status, 'priority', new.priority, 'source', new.source)
  );

  select * into v_company from public.companies where id = new.company_id;
  if v_company.operational_email_notifications_enabled then
    perform private.enqueue_operational_email(
      new.company_id,
      v_company.email,
      'Neuer ZunftEcho-Lead: ' || coalesce(nullif(btrim(new.name), ''), 'Interessent'),
      concat_ws(E'\n',
        'ZunftEcho hat eine neue Anfrage erfasst.',
        '',
        'Kontakt: ' || coalesce(nullif(btrim(new.name), ''), 'Nicht angegeben'),
        'Anliegen: ' || coalesce(nullif(btrim(new.issue_type), ''), 'Nicht angegeben'),
        'Priorität: ' || coalesce(nullif(btrim(new.priority), ''), 'normal'),
        case when nullif(btrim(coalesce(new.phone, '')), '') is not null then 'Telefon: ' || btrim(new.phone) end,
        case when nullif(btrim(coalesce(new.email, '')), '') is not null then 'E-Mail: ' || btrim(new.email) end,
        '',
        'Lead öffnen: https://zunftecho.de/leads'
      ),
      'lead',
      new.id,
      'internal:new_lead:' || new.id::text,
      now(),
      new.customer_id,
      jsonb_build_object('kind', 'new_lead', 'priority', new.priority, 'source', new.source)
    );
  end if;

  return new;
end;
$function$;

create or replace function private.notify_handoff()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_company public.companies%rowtype;
begin
  if new.status = 'needs_human' and old.status is distinct from new.status then
    perform private.enqueue_company_notification(
      new.company_id,
      'handoff',
      'Mitarbeiter benötigt',
      coalesce(new.handoff_reason, 'Eine Unterhaltung benötigt menschliche Bearbeitung.'),
      'conversation',
      new.id,
      jsonb_build_object('requested_at', new.handoff_requested_at)
    );

    select * into v_company from public.companies where id = new.company_id;
    if v_company.operational_email_notifications_enabled then
      perform private.enqueue_operational_email(
        new.company_id,
        v_company.email,
        'Dringend: ZunftEcho benötigt einen Mitarbeiter',
        concat_ws(E'\n',
          'Eine Kundenanfrage wurde an einen Mitarbeiter übergeben.',
          '',
          'Grund: ' || coalesce(nullif(btrim(new.handoff_reason), ''), 'Nicht angegeben'),
          case when nullif(btrim(coalesce(new.visitor_name, '')), '') is not null then 'Kontakt: ' || btrim(new.visitor_name) end,
          case when nullif(btrim(coalesce(new.visitor_phone, '')), '') is not null then 'Telefon: ' || btrim(new.visitor_phone) end,
          '',
          'Gespräch öffnen: https://zunftecho.de/konversationen'
        ),
        'conversation',
        new.id,
        'internal:handoff:' || new.id::text || ':' || coalesce(new.handoff_requested_at, now())::text,
        now(),
        new.customer_id,
        jsonb_build_object('kind', 'handoff', 'requested_at', new.handoff_requested_at)
      );
    end if;
  end if;
  return new;
end;
$function$;

create or replace function private.queue_appointment_confirmation_email()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_company public.companies%rowtype;
  v_changed boolean;
  v_dedupe_key text;
begin
  v_changed := tg_op = 'INSERT'
    or old.status is distinct from new.status
    or old.appointment_date is distinct from new.appointment_date
    or old.start_time is distinct from new.start_time
    or old.email is distinct from new.email;

  if not v_changed
     or new.status <> 'confirmed'
     or new.appointment_date is null
     or new.start_time is null
     or nullif(btrim(coalesce(new.email, '')), '') is null then
    return new;
  end if;

  select * into v_company from public.companies where id = new.company_id;
  if not coalesce(v_company.customer_appointment_emails_enabled, false) then
    return new;
  end if;

  v_dedupe_key := concat_ws(':',
    'customer:appointment_confirmation',
    new.id::text,
    new.appointment_date::text,
    new.start_time::text,
    md5(lower(btrim(new.email)))
  );

  perform private.enqueue_operational_email(
    new.company_id,
    new.email,
    'Terminbestätigung von ' || coalesce(nullif(btrim(v_company.name), ''), 'Ihrem Handwerksbetrieb'),
    concat_ws(E'\n',
      'Guten Tag' || case when nullif(btrim(coalesce(new.customer_name, '')), '') is not null then ' ' || btrim(new.customer_name) else '' end || ',',
      '',
      'Ihr Termin bei ' || coalesce(nullif(btrim(v_company.name), ''), 'uns') || ' ist bestätigt.',
      'Datum: ' || to_char(new.appointment_date, 'DD.MM.YYYY'),
      'Uhrzeit: ' || to_char(new.start_time, 'HH24:MI') || case when new.end_time is not null then '–' || to_char(new.end_time, 'HH24:MI') else '' end,
      case when nullif(btrim(coalesce(new.service_type, '')), '') is not null then 'Leistung: ' || btrim(new.service_type) end,
      case when nullif(btrim(coalesce(new.address, '')), '') is not null then 'Ort: ' || btrim(new.address) end,
      '',
      case when nullif(btrim(coalesce(v_company.phone, '')), '') is not null then 'Rückfragen: ' || btrim(v_company.phone) end,
      'Freundliche Grüße',
      coalesce(nullif(btrim(v_company.name), ''), 'Ihr Handwerksbetrieb')
    ),
    'appointment',
    new.id,
    v_dedupe_key,
    now(),
    new.customer_id,
    jsonb_build_object('kind', 'appointment_confirmation')
  );

  return new;
end;
$function$;

drop trigger if exists appointments_queue_confirmation_email on public.appointments;
create trigger appointments_queue_confirmation_email
after insert or update of status, appointment_date, start_time, end_time, email, address, service_type
on public.appointments
for each row execute function private.queue_appointment_confirmation_email();

create or replace function private.generate_customer_appointment_email_reminders()
returns integer
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_inserted integer := 0;
begin
  with due as (
    select
      a.*,
      c.name as company_name,
      c.phone as company_phone,
      c.appointment_reminder_minutes,
      c.timezone,
      ((a.appointment_date + a.start_time) at time zone coalesce(nullif(c.timezone, ''), 'Europe/Berlin')) as starts_at,
      concat_ws(':',
        'customer:appointment_reminder',
        a.id::text,
        a.appointment_date::text,
        a.start_time::text,
        c.appointment_reminder_minutes::text,
        md5(lower(btrim(a.email)))
      ) as reminder_dedupe_key
    from public.appointments a
    join public.companies c on c.id = a.company_id
    where a.status = 'confirmed'
      and a.appointment_date is not null
      and a.start_time is not null
      and a.email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      and c.customer_appointment_emails_enabled
      and c.appointment_reminder_minutes > 0
  ), inserted as (
    insert into public.outbound_messages (
      company_id, customer_id, channel, purpose, locale, recipient,
      subject, body, status, provider, scheduled_at, queued_at,
      entity_type, entity_id, dedupe_key, metadata
    )
    select
      d.company_id,
      d.customer_id,
      'email',
      'operational',
      'de-DE',
      lower(btrim(d.email)),
      'Terminerinnerung von ' || coalesce(nullif(btrim(d.company_name), ''), 'Ihrem Handwerksbetrieb'),
      concat_ws(E'\n',
        'Guten Tag' || case when nullif(btrim(coalesce(d.customer_name, '')), '') is not null then ' ' || btrim(d.customer_name) else '' end || ',',
        '',
        'dies ist eine Erinnerung an Ihren bevorstehenden Termin.',
        'Datum: ' || to_char(d.appointment_date, 'DD.MM.YYYY'),
        'Uhrzeit: ' || to_char(d.start_time, 'HH24:MI'),
        case when nullif(btrim(coalesce(d.service_type, '')), '') is not null then 'Leistung: ' || btrim(d.service_type) end,
        case when nullif(btrim(coalesce(d.address, '')), '') is not null then 'Ort: ' || btrim(d.address) end,
        '',
        case when nullif(btrim(coalesce(d.company_phone, '')), '') is not null then 'Rückfragen: ' || btrim(d.company_phone) end,
        'Freundliche Grüße',
        coalesce(nullif(btrim(d.company_name), ''), 'Ihr Handwerksbetrieb')
      ),
      'queued',
      'brevo',
      now(),
      now(),
      'appointment',
      d.id,
      d.reminder_dedupe_key,
      jsonb_build_object('kind', 'appointment_reminder', 'reminder_minutes', d.appointment_reminder_minutes)
    from due d
    where d.starts_at > now()
      and d.starts_at <= now() + make_interval(mins => d.appointment_reminder_minutes)
    on conflict (company_id, dedupe_key) where dedupe_key is not null do nothing
    returning 1
  )
  select count(*)::int into v_inserted from inserted;

  return v_inserted;
end;
$function$;

do $do$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'queue-customer-appointment-email-reminders';
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
  perform cron.schedule(
    'queue-customer-appointment-email-reminders',
    '*/15 * * * *',
    'select private.generate_customer_appointment_email_reminders();'
  );
end;
$do$;

create or replace function public.claim_outbound_email_batch(p_limit integer default 20)
returns setof public.outbound_messages
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $function$
begin
  update public.outbound_messages
     set status = case when attempt_count >= 3 then 'failed' else 'queued' end,
         scheduled_at = case when attempt_count >= 3 then scheduled_at else now() end,
         failed_at = case when attempt_count >= 3 then now() else null end,
         failure_code = case when attempt_count >= 3 then 'worker_timeout' else null end,
         failure_message = case when attempt_count >= 3 then 'Delivery timed out after three attempts' else null end,
         sending_at = null,
         updated_at = now()
   where channel = 'email'
     and status = 'sending'
     and sending_at < now() - interval '10 minutes';

  return query
  with selected as (
    select id
      from public.outbound_messages
     where channel = 'email'
       and status = 'queued'
       and attempt_count < 3
       and coalesce(scheduled_at, now()) <= now()
     order by coalesce(scheduled_at, created_at), created_at
     limit greatest(1, least(coalesce(p_limit, 20), 25))
     for update skip locked
  ), claimed as (
    update public.outbound_messages m
       set status = 'sending',
           sending_at = now(),
           attempt_count = m.attempt_count + 1,
           updated_at = now()
      from selected s
     where m.id = s.id
     returning m.*
  )
  select * from claimed;
end;
$function$;

create or replace function public.finish_outbound_email_delivery(
  p_message_id uuid,
  p_provider_message_id text
)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $function$
begin
  update public.outbound_messages
     set status = 'sent',
         provider = 'brevo',
         provider_message_id = nullif(btrim(p_provider_message_id), ''),
         sent_at = now(),
         failed_at = null,
         failure_code = null,
         failure_message = null,
         updated_at = now()
   where id = p_message_id
     and channel = 'email'
     and status = 'sending';
  return found;
end;
$function$;

create or replace function public.retry_outbound_email_delivery(
  p_message_id uuid,
  p_failure_code text,
  p_failure_message text
)
returns text
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $function$
declare
  v_attempt_count integer;
  v_status text;
begin
  select attempt_count into v_attempt_count
    from public.outbound_messages
   where id = p_message_id and channel = 'email' and status = 'sending'
   for update;

  if not found then return 'ignored'; end if;
  v_status := case when v_attempt_count >= 3 then 'failed' else 'queued' end;

  update public.outbound_messages
     set status = v_status,
         scheduled_at = case when v_status = 'queued' then now() + interval '5 minutes' else scheduled_at end,
         sending_at = null,
         failed_at = case when v_status = 'failed' then now() else null end,
         failure_code = left(coalesce(nullif(btrim(p_failure_code), ''), 'provider_error'), 100),
         failure_message = left(coalesce(nullif(btrim(p_failure_message), ''), 'Email delivery failed'), 500),
         updated_at = now()
   where id = p_message_id;

  return v_status;
end;
$function$;

revoke all on function public.claim_outbound_email_batch(integer) from public, anon, authenticated;
revoke all on function public.finish_outbound_email_delivery(uuid, text) from public, anon, authenticated;
revoke all on function public.retry_outbound_email_delivery(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_outbound_email_batch(integer) to service_role;
grant execute on function public.finish_outbound_email_delivery(uuid, text) to service_role;
grant execute on function public.retry_outbound_email_delivery(uuid, text, text) to service_role;

create or replace function public.get_pilot_value_metrics(p_days integer default 30)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_company_id uuid;
  v_days integer := greatest(1, least(coalesce(p_days, 30), 365));
  v_conversations integer := 0;
  v_after_hours integer := 0;
  v_leads integer := 0;
  v_appointments integer := 0;
  v_handoffs integer := 0;
begin
  select p.company_id into v_company_id
    from public.profiles p
   where p.id = auth.uid();

  if v_company_id is null then
    return jsonb_build_object(
      'company_id', null,
      'days', v_days,
      'conversations', 0,
      'after_hours_conversations', 0,
      'leads', 0,
      'appointments', 0,
      'handoffs', 0,
      'lead_conversion_rate_percent', 0,
      'booking_conversion_rate_percent', 0
    );
  end if;

  select count(*)::int,
         count(*) filter (
           where not exists (
             select 1
               from public.opening_hours oh
               join public.companies co on co.id = v_company_id
              where oh.company_id = v_company_id
                and oh.day_of_week = extract(isodow from (cv.created_at at time zone coalesce(nullif(co.timezone, ''), 'Europe/Berlin')))::int
                and oh.is_open
                and (cv.created_at at time zone coalesce(nullif(co.timezone, ''), 'Europe/Berlin'))::time >= oh.open_time
                and (cv.created_at at time zone coalesce(nullif(co.timezone, ''), 'Europe/Berlin'))::time < oh.close_time
           )
         )::int
    into v_conversations, v_after_hours
    from public.conversations cv
   where cv.company_id = v_company_id
     and cv.created_at >= now() - make_interval(days => v_days);

  select count(*)::int into v_leads
    from public.leads l
   where l.company_id = v_company_id
     and l.created_at >= now() - make_interval(days => v_days);

  select count(*)::int into v_appointments
    from public.appointments a
   where a.company_id = v_company_id
     and a.status = 'confirmed'
     and a.created_at >= now() - make_interval(days => v_days);

  select count(*)::int into v_handoffs
    from public.conversations cv
   where cv.company_id = v_company_id
     and cv.handoff_requested_at >= now() - make_interval(days => v_days);

  return jsonb_build_object(
    'company_id', v_company_id,
    'days', v_days,
    'conversations', v_conversations,
    'after_hours_conversations', v_after_hours,
    'leads', v_leads,
    'appointments', v_appointments,
    'handoffs', v_handoffs,
    'lead_conversion_rate_percent', case when v_conversations = 0 then 0 else round(v_leads::numeric * 100 / v_conversations, 1) end,
    'booking_conversion_rate_percent', case when v_conversations = 0 then 0 else round(v_appointments::numeric * 100 / v_conversations, 1) end
  );
end;
$function$;

revoke all on function public.get_pilot_value_metrics(integer) from public, anon;
grant execute on function public.get_pilot_value_metrics(integer) to authenticated;

do $do$
declare
  v_job_id bigint;
begin
  if not exists (select 1 from vault.secrets where name = 'zunftecho_project_url') then
    perform vault.create_secret(
      'https://srufegisweghdswdsdxb.supabase.co',
      'zunftecho_project_url',
      'Project URL for the outbound email cron worker'
    );
  end if;
  if not exists (select 1 from vault.secrets where name = 'zunftecho_publishable_key') then
    perform vault.create_secret(
      'sb_publishable_oeAQFS7Xm9SxNeGQGrRiAw_nQ3x6dKE',
      'zunftecho_publishable_key',
      'Publishable key for the outbound email cron worker'
    );
  end if;

  select jobid into v_job_id from cron.job where jobname = 'send-zunftecho-outbound-emails';
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'send-zunftecho-outbound-emails',
    '* * * * *',
    $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'zunftecho_project_url') || '/functions/v1/send-outbound-messages',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'zunftecho_publishable_key')
        ),
        body := jsonb_build_object('source', 'cron'),
        timeout_milliseconds := 15000
      );
    $cron$
  );
end;
$do$;
