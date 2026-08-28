-- Optional dynamic booking, explicit location consent fields and token-scoped
-- customer appointment controls. Existing opening-hours booking remains the
-- fallback whenever dynamic booking is disabled.

alter table public.companies
  add column if not exists dynamic_booking_enabled boolean not null default false,
  add column if not exists booking_window_days smallint not null default 62,
  add column if not exists logo_path text;

alter table public.companies
  drop constraint if exists companies_booking_window_days_check;
alter table public.companies
  add constraint companies_booking_window_days_check
  check (booking_window_days between 7 and 62);

alter table public.leads
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists location_source text,
  add column if not exists location_confirmed_at timestamptz;

alter table public.leads
  drop constraint if exists leads_location_coordinates_check;
alter table public.leads
  add constraint leads_location_coordinates_check check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  );

alter table public.leads
  drop constraint if exists leads_location_source_check;
alter table public.leads
  add constraint leads_location_source_check check (
    location_source is null or location_source in ('manual', 'browser_geolocation')
  );

create table if not exists public.booking_availability_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null,
  slot_step_minutes smallint not null default 30 check (slot_step_minutes between 15 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_availability_rule_valid_range check (end_time > start_time)
);

create unique index if not exists booking_rules_global_unique_idx
  on public.booking_availability_rules (company_id, day_of_week, start_time, end_time)
  where service_id is null;

create unique index if not exists booking_rules_service_unique_idx
  on public.booking_availability_rules (company_id, service_id, day_of_week, start_time, end_time)
  where service_id is not null;

create index if not exists booking_rules_lookup_idx
  on public.booking_availability_rules (company_id, day_of_week, service_id)
  where is_active;

alter table public.booking_availability_rules enable row level security;

drop policy if exists "Company users can view booking rules" on public.booking_availability_rules;
create policy "Company users can view booking rules"
on public.booking_availability_rules for select to authenticated
using (
  company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid()))
);

drop policy if exists "Company admins can create booking rules" on public.booking_availability_rules;
create policy "Company admins can create booking rules"
on public.booking_availability_rules for insert to authenticated
with check (
  company_id = (
    select p.company_id from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('owner', 'admin')
  )
  and (
    service_id is null or exists (
      select 1 from public.services s
      where s.id = booking_availability_rules.service_id
        and s.company_id = booking_availability_rules.company_id
    )
  )
);

drop policy if exists "Company admins can update booking rules" on public.booking_availability_rules;
create policy "Company admins can update booking rules"
on public.booking_availability_rules for update to authenticated
using (
  company_id = (
    select p.company_id from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('owner', 'admin')
  )
)
with check (
  company_id = (
    select p.company_id from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('owner', 'admin')
  )
);

drop policy if exists "Company admins can delete booking rules" on public.booking_availability_rules;
create policy "Company admins can delete booking rules"
on public.booking_availability_rules for delete to authenticated
using (
  company_id = (
    select p.company_id from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('owner', 'admin')
  )
);

grant select, insert, update, delete on public.booking_availability_rules to authenticated;

-- Preserve the proven opening-hours/conflict implementation as the base. The
-- wrapper adds the optional configured-slot layer without changing fallback.
do $block$
begin
  if to_regprocedure(
    'public.check_booking_slot_base(uuid,text,date,time without time zone,uuid)'
  ) is null then
    execute 'alter function public.check_booking_slot(uuid, text, date, time without time zone, uuid) rename to check_booking_slot_base';
  end if;
end;
$block$;

revoke all on function public.check_booking_slot_base(
  uuid, text, date, time without time zone, uuid
) from public, anon, authenticated;

create or replace function public.check_booking_slot(
  p_widget_key uuid,
  p_service_name text,
  p_date date,
  p_start_time time,
  p_exclude_appointment_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $function$
declare
  v_base jsonb;
  v_company_id uuid;
  v_service_id uuid;
  v_dynamic boolean;
  v_window integer;
  v_end_time time;
  v_has_specific boolean;
  v_allowed boolean;
  v_today date;
  v_timezone text;
begin
  v_base := public.check_booking_slot_base(
    p_widget_key,
    p_service_name,
    p_date,
    p_start_time,
    p_exclude_appointment_id
  );

  if not coalesce((v_base ->> 'available')::boolean, false) then
    return v_base;
  end if;

  select c.id, c.dynamic_booking_enabled, c.booking_window_days, c.timezone, s.id
    into v_company_id, v_dynamic, v_window, v_timezone, v_service_id
  from public.ai_agents a
  join public.companies c on c.id = a.company_id
  join public.services s
    on s.company_id = c.id
   and s.is_active
   and lower(btrim(s.name)) = lower(btrim(coalesce(p_service_name, '')))
  where a.widget_key = p_widget_key and a.is_active
  limit 1;

  if not coalesce(v_dynamic, false) then
    return v_base || jsonb_build_object('booking_mode', 'opening_hours');
  end if;

  v_today := timezone(coalesce(nullif(v_timezone, ''), 'Europe/Berlin'), now())::date;
  if p_date < v_today or p_date > v_today + greatest(7, least(coalesce(v_window, 62), 62)) then
    return jsonb_build_object(
      'available', false,
      'reason', 'outside_booking_window',
      'booking_window_days', coalesce(v_window, 62),
      'booking_mode', 'configured_slots'
    );
  end if;

  v_end_time := (v_base ->> 'end_time')::time;
  select exists (
    select 1 from public.booking_availability_rules r
    where r.company_id = v_company_id
      and r.service_id = v_service_id
      and r.day_of_week = extract(isodow from p_date)::int
      and r.is_active
  ) into v_has_specific;

  select exists (
    select 1 from public.booking_availability_rules r
    where r.company_id = v_company_id
      and r.day_of_week = extract(isodow from p_date)::int
      and r.is_active
      and (
        (v_has_specific and r.service_id = v_service_id)
        or (not v_has_specific and r.service_id is null)
      )
      and p_start_time >= r.start_time
      and v_end_time <= r.end_time
  ) into v_allowed;

  if not coalesce(v_allowed, false) then
    return jsonb_build_object(
      'available', false,
      'reason', 'outside_configured_slots',
      'service', v_base ->> 'service',
      'booking_mode', 'configured_slots'
    );
  end if;

  return v_base || jsonb_build_object('booking_mode', 'configured_slots');
end;
$function$;

revoke all on function public.check_booking_slot(uuid, text, date, time, uuid)
  from public, authenticated;
grant execute on function public.check_booking_slot(uuid, text, date, time, uuid)
  to anon;

create or replace function public.get_next_available_slots(
  p_widget_key uuid,
  p_service_name text,
  p_from_date date default null,
  p_days integer default 62,
  p_limit integer default 8
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $function$
declare
  v_company_id uuid;
  v_timezone text;
  v_dynamic boolean;
  v_window integer;
  v_date date;
  v_last_date date;
  v_day jsonb;
  v_slot jsonb;
  v_slots jsonb := '[]'::jsonb;
  v_limit integer := greatest(1, least(coalesce(p_limit, 8), 20));
begin
  select c.id, c.timezone, c.dynamic_booking_enabled, c.booking_window_days
    into v_company_id, v_timezone, v_dynamic, v_window
  from public.ai_agents a
  join public.companies c on c.id = a.company_id
  where a.widget_key = p_widget_key and a.is_active
  limit 1;

  if v_company_id is null then
    return jsonb_build_object('slots', v_slots, 'reason', 'invalid_widget');
  end if;

  v_date := greatest(
    coalesce(p_from_date, timezone(coalesce(nullif(v_timezone, ''), 'Europe/Berlin'), now())::date),
    timezone(coalesce(nullif(v_timezone, ''), 'Europe/Berlin'), now())::date
  );
  v_last_date := v_date + least(
    greatest(1, coalesce(p_days, 62)),
    greatest(7, least(coalesce(v_window, 62), 62))
  );

  while v_date <= v_last_date and jsonb_array_length(v_slots) < v_limit loop
    v_day := public.get_available_slots(p_widget_key, p_service_name, v_date, 30);
    for v_slot in select value from jsonb_array_elements(coalesce(v_day -> 'slots', '[]'::jsonb))
    loop
      v_slots := v_slots || jsonb_build_array(
        v_slot || jsonb_build_object('date', v_date)
      );
      exit when jsonb_array_length(v_slots) >= v_limit;
    end loop;
    v_date := v_date + 1;
  end loop;

  return jsonb_build_object(
    'slots', v_slots,
    'reason', case when jsonb_array_length(v_slots) > 0 then 'available' else 'no_available_slots' end,
    'booking_mode', case when v_dynamic then 'configured_slots' else 'opening_hours' end
  );
end;
$function$;

revoke all on function public.get_next_available_slots(uuid, text, date, integer, integer)
  from public, authenticated;
grant execute on function public.get_next_available_slots(uuid, text, date, integer, integer)
  to anon;

create or replace function public.update_booking_settings(
  p_enabled boolean,
  p_booking_window_days integer default 62
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $function$
declare
  v_company_id uuid;
  v_seeded integer := 0;
begin
  select p.company_id into v_company_id
  from public.profiles p
  where p.id = auth.uid() and p.role in ('owner', 'admin');

  if v_company_id is null then
    raise exception 'Administrator permission required';
  end if;

  update public.companies
  set dynamic_booking_enabled = coalesce(p_enabled, false),
      booking_window_days = greatest(7, least(coalesce(p_booking_window_days, 62), 62))
  where id = v_company_id;

  if coalesce(p_enabled, false) and not exists (
    select 1 from public.booking_availability_rules r where r.company_id = v_company_id
  ) then
    insert into public.booking_availability_rules (
      company_id, service_id, day_of_week, start_time, end_time, slot_step_minutes
    )
    select v_company_id, null, oh.day_of_week, oh.open_time, oh.close_time, 30
    from public.opening_hours oh
    where oh.company_id = v_company_id
      and oh.is_open
      and oh.open_time is not null
      and oh.close_time is not null
      and oh.close_time > oh.open_time
    on conflict do nothing;
    get diagnostics v_seeded = row_count;
  end if;

  return jsonb_build_object(
    'enabled', coalesce(p_enabled, false),
    'booking_window_days', greatest(7, least(coalesce(p_booking_window_days, 62), 62)),
    'seeded_rules', v_seeded
  );
end;
$function$;

revoke all on function public.update_booking_settings(boolean, integer)
  from public, anon;
grant execute on function public.update_booking_settings(boolean, integer)
  to authenticated;

create or replace function private.resolve_portal_access(p_token text)
returns private.customer_portal_tokens
language sql
security definer
set search_path = 'private', 'extensions', 'pg_temp'
as $function$
  select t.*
  from private.customer_portal_tokens t
  where p_token ~ '^[a-fA-F0-9]{64}$'
    and t.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and t.revoked_at is null
    and t.expires_at > now()
  limit 1;
$function$;

revoke all on function private.resolve_portal_access(text)
  from public, anon, authenticated;

create or replace function public.portal_get_available_slots(
  p_token text,
  p_appointment_id uuid,
  p_date date
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_access private.customer_portal_tokens%rowtype;
  v_appointment public.appointments%rowtype;
  v_widget_key uuid;
begin
  select * into v_access from private.resolve_portal_access(p_token);
  if v_access.id is null then return jsonb_build_object('ok', false, 'reason', 'invalid_or_expired'); end if;

  select * into v_appointment
  from public.appointments a
  where a.id = p_appointment_id
    and a.company_id = v_access.company_id
    and a.customer_id = v_access.customer_id
    and a.status <> 'cancelled';
  if not found then return jsonb_build_object('ok', false, 'reason', 'appointment_not_found'); end if;

  select a.widget_key into v_widget_key
  from public.ai_agents a
  where a.company_id = v_access.company_id and a.is_active
  order by a.created_at
  limit 1;

  return jsonb_build_object(
    'ok', true,
    'result', public.get_available_slots(v_widget_key, v_appointment.service_type, p_date, 30)
  );
end;
$function$;

create or replace function public.portal_cancel_appointment(
  p_token text,
  p_appointment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_access private.customer_portal_tokens%rowtype;
  v_widget_key uuid;
begin
  select * into v_access from private.resolve_portal_access(p_token);
  if v_access.id is null then return jsonb_build_object('cancelled', false, 'reason', 'invalid_or_expired'); end if;
  if not exists (
    select 1 from public.appointments a
    where a.id = p_appointment_id
      and a.company_id = v_access.company_id
      and a.customer_id = v_access.customer_id
  ) then
    return jsonb_build_object('cancelled', false, 'reason', 'appointment_not_found');
  end if;
  select a.widget_key into v_widget_key from public.ai_agents a
  where a.company_id = v_access.company_id and a.is_active
  order by a.created_at limit 1;
  return public.cancel_appointment_atomic(v_widget_key, p_appointment_id);
end;
$function$;

create or replace function public.portal_reschedule_appointment(
  p_token text,
  p_appointment_id uuid,
  p_new_date date,
  p_new_start_time time
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_access private.customer_portal_tokens%rowtype;
  v_appointment public.appointments%rowtype;
  v_widget_key uuid;
begin
  select * into v_access from private.resolve_portal_access(p_token);
  if v_access.id is null then return jsonb_build_object('updated', false, 'reason', 'invalid_or_expired'); end if;
  select * into v_appointment from public.appointments a
  where a.id = p_appointment_id
    and a.company_id = v_access.company_id
    and a.customer_id = v_access.customer_id
    and a.status <> 'cancelled'
  for update;
  if not found then return jsonb_build_object('updated', false, 'reason', 'appointment_not_found'); end if;
  select a.widget_key into v_widget_key from public.ai_agents a
  where a.company_id = v_access.company_id and a.is_active
  order by a.created_at limit 1;
  return public.reschedule_appointment_if_available(
    v_widget_key,
    p_appointment_id,
    p_new_date,
    p_new_start_time,
    v_appointment.service_type
  );
end;
$function$;

revoke all on function public.portal_get_available_slots(text, uuid, date)
  from public, authenticated;
revoke all on function public.portal_cancel_appointment(text, uuid)
  from public, authenticated;
revoke all on function public.portal_reschedule_appointment(text, uuid, date, time)
  from public, authenticated;
grant execute on function public.portal_get_available_slots(text, uuid, date) to anon;
grant execute on function public.portal_cancel_appointment(text, uuid) to anon;
grant execute on function public.portal_reschedule_appointment(text, uuid, date, time) to anon;
