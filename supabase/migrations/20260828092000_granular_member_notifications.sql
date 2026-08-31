-- Per-member event/channel preferences with quiet hours. Critical handoffs and
-- angry-customer escalations bypass quiet hours; SMS is modelled for a later
-- provider connection but is never queued until that channel exists.

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  event_channels jsonb not null default jsonb_build_object(
    'new_lead', jsonb_build_object('in_app', true, 'email', false, 'sms', false),
    'handoff', jsonb_build_object('in_app', true, 'email', true, 'sms', false),
    'handoff_overdue', jsonb_build_object('in_app', true, 'email', true, 'sms', false),
    'angry_customer', jsonb_build_object('in_app', true, 'email', true, 'sms', false),
    'appointment_upcoming', jsonb_build_object('in_app', true, 'email', false, 'sms', false),
    'payment_failed', jsonb_build_object('in_app', true, 'email', true, 'sms', false),
    'pilot_expiring', jsonb_build_object('in_app', true, 'email', true, 'sms', false)
  ),
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time not null default '20:00',
  quiet_hours_end time not null default '07:00',
  timezone text not null default 'Europe/Berlin',
  sms_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_event_channels_object check (jsonb_typeof(event_channels) = 'object'),
  constraint notification_sms_number_length check (
    sms_number is null or char_length(sms_number) between 6 and 40
  )
);

create index if not exists user_notification_preferences_company_idx
  on public.user_notification_preferences (company_id);

alter table public.user_notification_preferences enable row level security;

drop policy if exists "Users can view own notification preferences" on public.user_notification_preferences;
create policy "Users can view own notification preferences"
on public.user_notification_preferences for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can create own notification preferences" on public.user_notification_preferences;
create policy "Users can create own notification preferences"
on public.user_notification_preferences for insert to authenticated
with check (
  user_id = (select auth.uid())
  and company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid()))
);

drop policy if exists "Users can update own notification preferences" on public.user_notification_preferences;
create policy "Users can update own notification preferences"
on public.user_notification_preferences for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid()))
);

grant select, insert, update on public.user_notification_preferences to authenticated;

insert into public.user_notification_preferences (user_id, company_id, event_channels, timezone)
select
  p.id,
  p.company_id,
  jsonb_build_object(
    'new_lead', jsonb_build_object('in_app', true, 'email', p.role in ('owner', 'admin'), 'sms', false),
    'handoff', jsonb_build_object('in_app', true, 'email', p.role in ('owner', 'admin'), 'sms', false),
    'handoff_overdue', jsonb_build_object('in_app', true, 'email', p.role in ('owner', 'admin'), 'sms', false),
    'angry_customer', jsonb_build_object('in_app', true, 'email', p.role in ('owner', 'admin'), 'sms', false),
    'appointment_upcoming', jsonb_build_object('in_app', true, 'email', false, 'sms', false),
    'payment_failed', jsonb_build_object('in_app', true, 'email', p.role in ('owner', 'admin'), 'sms', false),
    'pilot_expiring', jsonb_build_object('in_app', true, 'email', p.role in ('owner', 'admin'), 'sms', false)
  ),
  coalesce(nullif(p.preferences ->> 'timezone', ''), c.timezone, 'Europe/Berlin')
from public.profiles p
join public.companies c on c.id = p.company_id
where p.company_id is not null
on conflict (user_id) do nothing;

create or replace function private.seed_user_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $function$
begin
  if new.company_id is null then return new; end if;
  insert into public.user_notification_preferences (
    user_id, company_id, event_channels, timezone
  )
  select
    new.id,
    new.company_id,
    jsonb_build_object(
      'new_lead', jsonb_build_object('in_app', true, 'email', new.role in ('owner', 'admin'), 'sms', false),
      'handoff', jsonb_build_object('in_app', true, 'email', new.role in ('owner', 'admin'), 'sms', false),
      'handoff_overdue', jsonb_build_object('in_app', true, 'email', new.role in ('owner', 'admin'), 'sms', false),
      'angry_customer', jsonb_build_object('in_app', true, 'email', new.role in ('owner', 'admin'), 'sms', false),
      'appointment_upcoming', jsonb_build_object('in_app', true, 'email', false, 'sms', false),
      'payment_failed', jsonb_build_object('in_app', true, 'email', new.role in ('owner', 'admin'), 'sms', false),
      'pilot_expiring', jsonb_build_object('in_app', true, 'email', new.role in ('owner', 'admin'), 'sms', false)
    ),
    coalesce(nullif(new.preferences ->> 'timezone', ''), c.timezone, 'Europe/Berlin')
  from public.companies c where c.id = new.company_id
  on conflict (user_id) do update
  set company_id = excluded.company_id,
      updated_at = now();
  return new;
end;
$function$;

drop trigger if exists profiles_seed_notification_preferences on public.profiles;
create trigger profiles_seed_notification_preferences
after insert or update of company_id on public.profiles
for each row execute function private.seed_user_notification_preferences();

create or replace function private.member_notification_channel_enabled(
  p_preferences public.user_notification_preferences,
  p_event text,
  p_channel text,
  p_critical boolean default false
)
returns boolean
language plpgsql
stable
set search_path = 'public', 'pg_temp'
as $function$
declare
  v_enabled boolean;
  v_now time;
  v_quiet boolean;
begin
  v_enabled := coalesce(
    (p_preferences.event_channels #>> array[p_event, p_channel])::boolean,
    false
  );
  if not v_enabled then return false; end if;
  if p_channel = 'in_app' or p_critical or not p_preferences.quiet_hours_enabled then
    return true;
  end if;
  v_now := timezone(coalesce(nullif(p_preferences.timezone, ''), 'Europe/Berlin'), now())::time;
  v_quiet := case
    when p_preferences.quiet_hours_start < p_preferences.quiet_hours_end
      then v_now >= p_preferences.quiet_hours_start and v_now < p_preferences.quiet_hours_end
    else v_now >= p_preferences.quiet_hours_start or v_now < p_preferences.quiet_hours_end
  end;
  return not v_quiet;
end;
$function$;

revoke all on function private.member_notification_channel_enabled(
  public.user_notification_preferences, text, text, boolean
) from public, anon, authenticated;

create or replace function private.enqueue_team_event_email(
  p_company_id uuid,
  p_event text,
  p_subject text,
  p_body text,
  p_entity_type text,
  p_entity_id uuid,
  p_critical boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_member record;
  v_count integer := 0;
begin
  for v_member in
    select p.id, lower(u.email) email, np as notification_preferences
    from public.profiles p
    join auth.users u on u.id = p.id
    join public.user_notification_preferences np on np.user_id = p.id
    where p.company_id = p_company_id
      and u.email is not null
  loop
    if private.member_notification_channel_enabled(
      v_member.notification_preferences,
      p_event,
      'email',
      p_critical
    ) then
      perform private.enqueue_operational_email(
        p_company_id,
        v_member.email,
        p_subject,
        p_body,
        p_entity_type,
        p_entity_id,
        'member_event:' || p_event || ':' || v_member.id::text || ':' || p_entity_id::text,
        now(),
        null,
        coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
          'kind', p_event,
          'recipient_user_id', v_member.id,
          'critical', p_critical
        )
      );
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$function$;

revoke all on function private.enqueue_team_event_email(
  uuid, text, text, text, text, uuid, boolean, jsonb
) from public, anon, authenticated;

create or replace function private.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_label text;
begin
  v_label := case
    when new.name is not null and new.issue_type is not null then new.name || ' – ' || new.issue_type
    when new.name is not null then new.name
    when new.issue_type is not null then new.issue_type
    else 'Ein neuer Interessent wurde erfasst.'
  end;
  perform private.enqueue_company_notification(
    new.company_id, 'new_lead', 'Neuer Lead', v_label, 'lead', new.id,
    jsonb_build_object('status', new.status, 'priority', new.priority, 'source', new.source)
  );
  perform private.enqueue_team_event_email(
    new.company_id,
    'new_lead',
    'Neuer ZunftEcho-Lead: ' || coalesce(nullif(btrim(new.name), ''), 'Interessent'),
    concat_ws(E'\n',
      'ZunftEcho hat eine neue Anfrage erfasst.', '',
      'Kontakt: ' || coalesce(nullif(btrim(new.name), ''), 'Nicht angegeben'),
      'Anliegen: ' || coalesce(nullif(btrim(new.issue_type), ''), 'Nicht angegeben'),
      'Priorität: ' || coalesce(nullif(btrim(new.priority), ''), 'normal'),
      case when nullif(btrim(coalesce(new.phone, '')), '') is not null then 'Telefon: ' || btrim(new.phone) end,
      case when nullif(btrim(coalesce(new.email, '')), '') is not null then 'E-Mail: ' || btrim(new.email) end,
      '', 'Lead öffnen: https://zunftecho.de/leads?id=' || new.id::text
    ),
    'lead', new.id, new.priority = 'urgent',
    jsonb_build_object('priority', new.priority, 'source', new.source)
  );
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
  v_event text;
begin
  if new.status = 'needs_human' and old.status is distinct from new.status then
    v_event := case
      when lower(coalesce(new.handoff_reason, '')) like '%verärger%'
        or lower(coalesce(new.handoff_reason, '')) like '%angry%'
      then 'angry_customer'
      else 'handoff'
    end;
    perform private.enqueue_company_notification(
      new.company_id, v_event, 'Mitarbeiter benötigt',
      coalesce(new.handoff_reason, 'Eine Unterhaltung benötigt menschliche Bearbeitung.'),
      'conversation', new.id,
      jsonb_build_object('requested_at', new.handoff_requested_at)
    );
    perform private.enqueue_team_event_email(
      new.company_id, v_event,
      'Dringend: ZunftEcho benötigt einen Mitarbeiter',
      concat_ws(E'\n',
        'Eine Kundenanfrage wurde an einen Mitarbeiter übergeben.', '',
        'Grund: ' || coalesce(nullif(btrim(new.handoff_reason), ''), 'Nicht angegeben'),
        case when nullif(btrim(coalesce(new.visitor_name, '')), '') is not null then 'Kontakt: ' || btrim(new.visitor_name) end,
        case when nullif(btrim(coalesce(new.visitor_phone, '')), '') is not null then 'Telefon: ' || btrim(new.visitor_phone) end,
        '', 'Gespräch öffnen: https://zunftecho.de/konversationen?id=' || new.id::text
      ),
      'conversation', new.id, true,
      jsonb_build_object('requested_at', new.handoff_requested_at)
    );
  end if;
  return new;
end;
$function$;

create or replace function private.generate_granular_operational_emails()
returns integer
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_due record;
  v_count integer := 0;
begin
  for v_due in
    select cv.id, cv.company_id, cv.handoff_reason, cv.handoff_requested_at,
           co.handoff_sla_minutes
    from public.conversations cv
    join public.companies co on co.id = cv.company_id
    where cv.status = 'needs_human'
      and cv.handoff_requested_at is not null
      and cv.handoff_requested_at <= now() - make_interval(mins => co.handoff_sla_minutes)
  loop
    v_count := v_count + private.enqueue_team_event_email(
      v_due.company_id, 'handoff_overdue',
      'SLA überschritten: Kundenanfrage jetzt bearbeiten',
      concat_ws(E'\n',
        'Eine menschliche Übergabe wartet länger als das festgelegte SLA.', '',
        'Grund: ' || coalesce(nullif(btrim(v_due.handoff_reason), ''), 'Nicht angegeben'),
        'SLA: ' || v_due.handoff_sla_minutes::text || ' Minuten', '',
        'Gespräch öffnen: https://zunftecho.de/konversationen?id=' || v_due.id::text
      ),
      'conversation', v_due.id, true,
      jsonb_build_object('requested_at', v_due.handoff_requested_at)
    );
  end loop;
  return v_count;
end;
$function$;

revoke all on function private.generate_granular_operational_emails()
  from public, anon, authenticated;

do $block$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'zunftecho-granular-operational-emails';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule(
    'zunftecho-granular-operational-emails',
    '*/5 * * * *',
    'select private.generate_granular_operational_emails();'
  );
end;
$block$;

-- The former company-wide switch is superseded by member preferences. Keeping
-- it disabled prevents duplicate email delivery while preserving the column
-- for backwards-compatible clients.
update public.companies
set operational_email_notifications_enabled = false
where operational_email_notifications_enabled;
