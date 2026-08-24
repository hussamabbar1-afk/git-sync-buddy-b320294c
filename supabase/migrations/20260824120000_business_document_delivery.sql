-- Reliable, tenant-safe quote and invoice delivery.
-- The Edge Function calls these RPCs with the service role after validating
-- the signed-in user through RLS. No function is executable by browser roles.

create unique index if not exists outbound_messages_one_active_document_email_idx
  on public.outbound_messages (company_id, entity_type, entity_id)
  where channel = 'email'
    and purpose = 'operational'
    and status in ('queued', 'sending')
    and entity_type in ('quote', 'invoice');

create or replace function public.claim_business_document_delivery(
  p_user_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_subject text,
  p_body text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_company_id uuid;
  v_document_company_id uuid;
  v_customer_id uuid;
  v_recipient text;
  v_document_status text;
  v_total_cents bigint;
  v_message public.outbound_messages%rowtype;
begin
  if p_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_entity_type not in ('quote', 'invoice') then
    raise exception using errcode = '22023', message = 'Unsupported document type';
  end if;

  select p.company_id
    into v_user_company_id
    from public.profiles p
   where p.id = p_user_id;

  if v_user_company_id is null then
    raise exception using errcode = '42501', message = 'Company membership required';
  end if;

  -- Lock the source document only for this short database transaction. The
  -- provider HTTP request happens later, after this function returns.
  if p_entity_type = 'quote' then
    select q.company_id, q.customer_id, q.email, q.status, q.total_cents
      into v_document_company_id, v_customer_id, v_recipient, v_document_status, v_total_cents
      from public.quotes q
     where q.id = p_entity_id
     for update;
  else
    select i.company_id, i.customer_id, i.email, i.status, i.total_cents
      into v_document_company_id, v_customer_id, v_recipient, v_document_status, v_total_cents
      from public.invoices i
     where i.id = p_entity_id
     for update;
  end if;

  if v_document_company_id is null or v_document_company_id <> v_user_company_id then
    raise exception using errcode = 'P0002', message = 'Document not found';
  end if;

  if v_document_status <> 'draft' then
    raise exception using errcode = 'P0001', message = 'Only draft documents can be sent';
  end if;

  v_recipient := lower(btrim(coalesce(v_recipient, '')));
  if v_recipient = '' or position('@' in v_recipient) = 0 then
    raise exception using errcode = '22023', message = 'A valid recipient email is required';
  end if;

  if coalesce(v_total_cents, 0) <= 0 then
    raise exception using errcode = '22023', message = 'The document total must be greater than zero';
  end if;

  if nullif(btrim(coalesce(p_subject, '')), '') is null
     or nullif(btrim(coalesce(p_body, '')), '') is null then
    raise exception using errcode = '22023', message = 'Subject and body are required';
  end if;

  -- A concurrent invocation sees the active delivery and must not contact the
  -- provider. The partial unique index is the final race-condition safeguard.
  select om.*
    into v_message
    from public.outbound_messages om
   where om.company_id = v_document_company_id
     and om.entity_type = p_entity_type
     and om.entity_id = p_entity_id
     and om.channel = 'email'
     and om.purpose = 'operational'
     and om.status in ('queued', 'sending')
   order by om.created_at desc
   limit 1;

  if found then
    return jsonb_build_object(
      'message_id', v_message.id,
      'recipient', v_message.recipient,
      'claimed', false,
      'status', v_message.status
    );
  end if;

  -- Reuse the latest failed record so retries retain the same Brevo
  -- idempotency key (the outbound message UUID).
  select om.*
    into v_message
    from public.outbound_messages om
   where om.company_id = v_document_company_id
     and om.entity_type = p_entity_type
     and om.entity_id = p_entity_id
     and om.channel = 'email'
     and om.purpose = 'operational'
     and om.status = 'failed'
   order by om.failed_at desc nulls last, om.created_at desc
   limit 1
   for update;

  if found then
    update public.outbound_messages
       set recipient = v_recipient,
           customer_id = v_customer_id,
           subject = btrim(p_subject),
           body = btrim(p_body),
           status = 'sending',
           provider = 'brevo',
           failed_at = null,
           failure_code = null,
           failure_message = null,
           metadata = coalesce(v_message.metadata, '{}'::jsonb)
             || coalesce(p_metadata, '{}'::jsonb)
     where id = v_message.id
     returning * into v_message;
  else
    insert into public.outbound_messages (
      company_id,
      created_by,
      customer_id,
      channel,
      purpose,
      recipient,
      subject,
      body,
      status,
      provider,
      entity_type,
      entity_id,
      attempt_count,
      sending_at,
      metadata
    ) values (
      v_document_company_id,
      p_user_id,
      v_customer_id,
      'email',
      'operational',
      v_recipient,
      btrim(p_subject),
      btrim(p_body),
      'sending',
      'brevo',
      p_entity_type,
      p_entity_id,
      1,
      now(),
      coalesce(p_metadata, '{}'::jsonb)
    )
    returning * into v_message;
  end if;

  return jsonb_build_object(
    'message_id', v_message.id,
    'recipient', v_message.recipient,
    'claimed', true,
    'status', v_message.status
  );
end;
$function$;

create or replace function public.complete_business_document_delivery(
  p_message_id uuid,
  p_provider_message_id text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_message public.outbound_messages%rowtype;
  v_sent_at timestamptz;
begin
  select om.*
    into v_message
    from public.outbound_messages om
   where om.id = p_message_id
   for update;

  if not found or v_message.entity_type not in ('quote', 'invoice') then
    raise exception using errcode = 'P0002', message = 'Delivery not found';
  end if;

  if v_message.status = 'sent' then
    return jsonb_build_object(
      'message_id', v_message.id,
      'status', 'sent',
      'sent_at', v_message.sent_at
    );
  end if;

  if v_message.status <> 'sending' then
    raise exception using errcode = 'P0001', message = 'Delivery is not in progress';
  end if;

  if nullif(btrim(coalesce(p_provider_message_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'Provider message ID is required';
  end if;

  v_sent_at := now();

  if v_message.entity_type = 'quote' then
    update public.quotes
       set status = 'sent', sent_at = coalesce(sent_at, v_sent_at)
     where id = v_message.entity_id
       and company_id = v_message.company_id
       and status = 'draft';
  else
    update public.invoices
       set status = 'sent', sent_at = coalesce(sent_at, v_sent_at)
     where id = v_message.entity_id
       and company_id = v_message.company_id
       and status = 'draft';
  end if;

  if not found then
    raise exception using errcode = 'P0001', message = 'Document is no longer sendable';
  end if;

  update public.outbound_messages
     set status = 'sent',
         provider = 'brevo',
         provider_message_id = btrim(p_provider_message_id),
         sent_at = v_sent_at
   where id = v_message.id;

  return jsonb_build_object(
    'message_id', v_message.id,
    'status', 'sent',
    'sent_at', v_sent_at
  );
end;
$function$;

create or replace function public.fail_business_document_delivery(
  p_message_id uuid,
  p_failure_code text,
  p_failure_message text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.outbound_messages
     set status = 'failed',
         provider = 'brevo',
         failed_at = now(),
         failure_code = left(coalesce(nullif(btrim(p_failure_code), ''), 'provider_error'), 100),
         failure_message = left(coalesce(nullif(btrim(p_failure_message), ''), 'Email delivery failed'), 500)
   where id = p_message_id
     and entity_type in ('quote', 'invoice')
     and status = 'sending';

  return found;
end;
$function$;

revoke all on function public.claim_business_document_delivery(uuid, text, uuid, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.complete_business_document_delivery(uuid, text)
  from public, anon, authenticated;
revoke all on function public.fail_business_document_delivery(uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.claim_business_document_delivery(uuid, text, uuid, text, text, jsonb)
  to service_role;
grant execute on function public.complete_business_document_delivery(uuid, text)
  to service_role;
grant execute on function public.fail_business_document_delivery(uuid, text, text)
  to service_role;
