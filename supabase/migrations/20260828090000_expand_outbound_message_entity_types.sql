-- Keep the outbound queue strict while allowing every first-party workflow
-- that currently writes to it. The previous list rejected team invitations,
-- pilot follow-ups and platform health alerts before they could be queued.

alter table public.outbound_messages
  drop constraint if exists outbound_messages_entity_type_check;

alter table public.outbound_messages
  add constraint outbound_messages_entity_type_check
  check (
    entity_type is null
    or entity_type in (
      'customer',
      'lead',
      'conversation',
      'appointment',
      'quote',
      'job',
      'invoice',
      'contract',
      'waitlist',
      'feedback',
      'system',
      'company_invite',
      'pilot_request',
      'system_health',
      'subscription',
      'payment'
    )
  );
