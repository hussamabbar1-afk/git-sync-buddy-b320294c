-- Extend the existing five-minute SLA monitor with an external email alert.
-- The queue is still opt-in per company and deduplicated per handoff request.

create or replace function private.generate_overdue_handoff_notifications()
returns integer
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_inserted integer := 0;
  v_due record;
begin
  with due as (
    select
      c.id as conversation_id,
      c.company_id,
      c.handoff_requested_at,
      c.handoff_reason,
      co.handoff_sla_minutes,
      p.id as user_id,
      p.preferences,
      'handoff_overdue:' || c.id::text || ':' ||
        extract(epoch from c.handoff_requested_at)::bigint::text as dedupe_key
    from public.conversations c
    join public.companies co on co.id = c.company_id
    join public.profiles p on p.company_id = c.company_id
    where c.status = 'needs_human'
      and c.handoff_requested_at is not null
      and c.handoff_requested_at <= now() - make_interval(mins => co.handoff_sla_minutes)
      and private.notification_enabled_for_user(p.preferences, 'handoff_overdue')
  ), inserted as (
    insert into public.notifications (
      user_id, company_id, type, title, body,
      entity_type, entity_id, metadata, dedupe_key
    )
    select
      d.user_id,
      d.company_id,
      'handoff_overdue',
      'Übergabe wartet zu lange',
      coalesce(
        nullif(btrim(d.handoff_reason), ''),
        'Eine Kundenanfrage wartet auf einen Mitarbeiter.'
      ),
      'conversation',
      d.conversation_id,
      jsonb_build_object(
        'handoff_requested_at', d.handoff_requested_at,
        'handoff_sla_minutes', d.handoff_sla_minutes
      ),
      d.dedupe_key
    from due d
    on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing
    returning 1
  )
  select count(*)::int into v_inserted from inserted;

  for v_due in
    select
      c.id as conversation_id,
      c.company_id,
      c.customer_id,
      c.handoff_requested_at,
      c.handoff_reason,
      c.visitor_name,
      c.visitor_phone,
      co.email,
      co.handoff_sla_minutes
    from public.conversations c
    join public.companies co on co.id = c.company_id
    where c.status = 'needs_human'
      and c.handoff_requested_at is not null
      and c.handoff_requested_at <= now() - make_interval(mins => co.handoff_sla_minutes)
      and co.operational_email_notifications_enabled
  loop
    perform private.enqueue_operational_email(
      v_due.company_id,
      v_due.email,
      'SLA überschritten: Kundenanfrage jetzt bearbeiten',
      concat_ws(E'\n',
        'Eine menschliche Übergabe wartet länger als das festgelegte SLA.',
        '',
        'Grund: ' || coalesce(nullif(btrim(v_due.handoff_reason), ''), 'Nicht angegeben'),
        'SLA: ' || v_due.handoff_sla_minutes::text || ' Minuten',
        case
          when nullif(btrim(coalesce(v_due.visitor_name, '')), '') is not null
            then 'Kontakt: ' || btrim(v_due.visitor_name)
        end,
        case
          when nullif(btrim(coalesce(v_due.visitor_phone, '')), '') is not null
            then 'Telefon: ' || btrim(v_due.visitor_phone)
        end,
        '',
        'Jetzt bearbeiten: https://zunftecho.de/konversationen'
      ),
      'conversation',
      v_due.conversation_id,
      'internal:handoff_sla:' || v_due.conversation_id::text || ':' ||
        extract(epoch from v_due.handoff_requested_at)::bigint::text,
      now(),
      v_due.customer_id,
      jsonb_build_object(
        'kind', 'handoff_overdue',
        'handoff_requested_at', v_due.handoff_requested_at,
        'handoff_sla_minutes', v_due.handoff_sla_minutes
      )
    );
  end loop;

  return v_inserted;
end;
$function$;

revoke all on function private.generate_overdue_handoff_notifications()
  from public, anon, authenticated;
