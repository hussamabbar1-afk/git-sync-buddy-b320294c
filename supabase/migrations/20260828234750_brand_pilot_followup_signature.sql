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
        'Ihr ZunftEcho-Team'
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
