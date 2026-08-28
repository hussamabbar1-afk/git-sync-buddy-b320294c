-- Keep foreign-key maintenance and joins predictable as production data grows.
create index if not exists customer_portal_tokens_company_id_idx
  on private.customer_portal_tokens (company_id);

create index if not exists customer_portal_tokens_created_by_idx
  on private.customer_portal_tokens (created_by);

create index if not exists platform_notification_settings_outbound_company_id_idx
  on private.platform_notification_settings (outbound_company_id);

create index if not exists booking_availability_rules_service_id_idx
  on public.booking_availability_rules (service_id);
