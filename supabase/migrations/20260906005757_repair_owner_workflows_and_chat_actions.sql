-- Restore object privileges that were missing even though matching company-scoped
-- RLS policies already existed. RLS remains the row-level authorization layer.
grant delete, insert on table public.ai_agents to authenticated;
grant update on table public.appointments, public.attachments, public.calendar_feed_settings,
  public.conversations, public.jobs, public.leads, public.notifications, public.profiles,
  public.tasks to authenticated;
grant insert, update on table public.business_closures, public.expenses,
  public.external_integrations, public.job_assignments, public.job_checklist_items,
  public.lead_notes, public.opening_hours, public.quote_items, public.quotes,
  public.service_areas, public.service_checklist_items, public.services,
  public.voice_settings to authenticated;
grant insert on table public.customer_assets, public.invoice_items, public.invoices,
  public.service_contracts, public.widget_display_settings,
  public.widget_security_settings to authenticated;

create or replace function public.submit_chat_feedback(
  p_widget_key uuid,
  p_conversation_id uuid,
  p_message_id uuid,
  p_rating integer,
  p_comment text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_company uuid;
  v_role text;
  v_question text;
  v_id uuid;
  v_jwt_role text := coalesce(auth.role(), '');
begin
  if p_rating not in (-1, 1) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_rating');
  end if;

  select a.company_id into v_company
  from public.ai_agents a
  where a.widget_key = p_widget_key and a.is_active
  limit 1;

  if v_company is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_widget');
  end if;

  if v_jwt_role <> 'service_role' and not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.company_id = v_company
  ) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and c.company_id = v_company
  ) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_conversation');
  end if;

  select m.role into v_role
  from public.messages m
  where m.id = p_message_id and m.conversation_id = p_conversation_id;

  if v_role is distinct from 'assistant' then
    return jsonb_build_object('ok', false, 'reason', 'assistant_message_required');
  end if;

  insert into public.message_feedback(company_id, conversation_id, message_id, rating, comment)
  values (v_company, p_conversation_id, p_message_id, p_rating,
    left(nullif(btrim(p_comment), ''), 1000))
  on conflict(message_id) do update
    set rating = excluded.rating, comment = excluded.comment, created_at = now()
  returning id into v_id;

  if p_rating = -1 then
    select m.content into v_question
    from public.messages m
    where m.conversation_id = p_conversation_id
      and m.role = 'user'
      and m.created_at < (select created_at from public.messages where id = p_message_id)
    order by m.created_at desc
    limit 1;
    if length(btrim(coalesce(v_question, ''))) >= 4 then
      perform public.record_knowledge_gap(
        p_widget_key,
        left(v_question, 1000),
        p_conversation_id
      );
    end if;
  end if;

  return jsonb_build_object('ok', true, 'feedback_id', v_id, 'rating', p_rating);
end;
$function$;

revoke all on function public.submit_chat_feedback(uuid, uuid, uuid, integer, text) from public;
revoke all on function public.submit_chat_feedback(uuid, uuid, uuid, integer, text) from anon;
grant execute on function public.submit_chat_feedback(uuid, uuid, uuid, integer, text)
  to authenticated, service_role;

create or replace function private.normalize_lead_text()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $function$
begin
  new.name := private.clean_extracted_text(new.name);
  new.phone := private.clean_extracted_text(new.phone);
  new.email := private.clean_extracted_text(new.email);
  new.postal_code := private.clean_extracted_text(new.postal_code);
  new.address := private.clean_extracted_text(new.address);
  new.issue_type := private.clean_extracted_text(new.issue_type);
  new.issue_description := private.clean_extracted_text(new.issue_description);
  new.preferred_contact_method := private.clean_extracted_text(new.preferred_contact_method);
  new.preferred_appointment := private.clean_extracted_text(new.preferred_appointment);
  new.appointment_reason := private.clean_extracted_text(new.appointment_reason);
  new.pending_service_type := private.clean_extracted_text(new.pending_service_type);
  new.human_handoff_reason := private.clean_extracted_text(new.human_handoff_reason);
  new.lost_reason := private.clean_extracted_text(new.lost_reason);
  new.urgency := coalesce(private.clean_extracted_text(new.urgency), 'normal');

  new.issue_type := case lower(coalesce(new.issue_type, ''))
    when 'appointment' then 'Terminbuchung'
    when 'booking' then 'Terminbuchung'
    when 'appointment booking' then 'Terminbuchung'
    when 'cancellation' then 'Terminabsage'
    when 'cancel appointment' then 'Terminabsage'
    when 'appointment cancellation' then 'Terminabsage'
    when 'reschedule' then 'Terminverschiebung'
    when 'rescheduling' then 'Terminverschiebung'
    when 'appointment rescheduling' then 'Terminverschiebung'
    else new.issue_type
  end;
  return new;
end;
$function$;

update public.leads
set issue_type = case lower(issue_type)
  when 'appointment' then 'Terminbuchung'
  when 'booking' then 'Terminbuchung'
  when 'appointment booking' then 'Terminbuchung'
  when 'cancellation' then 'Terminabsage'
  when 'cancel appointment' then 'Terminabsage'
  when 'appointment cancellation' then 'Terminabsage'
  when 'reschedule' then 'Terminverschiebung'
  when 'rescheduling' then 'Terminverschiebung'
  when 'appointment rescheduling' then 'Terminverschiebung'
  else issue_type
end
where lower(issue_type) in (
  'appointment', 'booking', 'appointment booking', 'cancellation',
  'cancel appointment', 'appointment cancellation', 'reschedule',
  'rescheduling', 'appointment rescheduling'
);
