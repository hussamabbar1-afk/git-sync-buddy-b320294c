-- Token-scoped end-customer portal for request and appointment status.

create table if not exists private.customer_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_accessed_at timestamptz,
  revoked_at timestamptz,
  constraint customer_portal_token_hash_length check (length(token_hash) = 64),
  constraint customer_portal_expiry_after_creation check (expires_at > created_at)
);

create index if not exists customer_portal_tokens_customer_active_idx
  on private.customer_portal_tokens (customer_id, expires_at desc)
  where revoked_at is null;

revoke all on table private.customer_portal_tokens from public, anon, authenticated;

create or replace function public.create_customer_portal_link(
  p_customer_id uuid,
  p_expires_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'extensions', 'pg_temp'
as $function$
declare
  v_company_id uuid;
  v_token text;
  v_hash text;
  v_expires_at timestamptz;
begin
  select p.company_id into v_company_id
  from public.profiles p
  where p.id = auth.uid();

  if v_company_id is null or not exists (
    select 1 from public.customers c
    where c.id = p_customer_id and c.company_id = v_company_id
  ) then
    raise exception 'Customer not found';
  end if;

  update private.customer_portal_tokens
  set revoked_at = now()
  where customer_id = p_customer_id
    and company_id = v_company_id
    and revoked_at is null;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');
  v_expires_at := now() + make_interval(
    days => greatest(1, least(coalesce(p_expires_days, 30), 180))
  );

  insert into private.customer_portal_tokens (
    company_id, customer_id, token_hash, created_by, expires_at
  ) values (
    v_company_id, p_customer_id, v_hash, auth.uid(), v_expires_at
  );

  perform private.write_activity(
    v_company_id,
    'customer',
    p_customer_id,
    'customer_portal_link_created',
    'Kundenportal-Link erstellt',
    jsonb_build_object('expires_at', v_expires_at)
  );

  return jsonb_build_object(
    'url', 'https://zunftecho.de/kundenportal?token=' || v_token,
    'expires_at', v_expires_at
  );
end;
$function$;

revoke all on function public.create_customer_portal_link(uuid, integer)
  from public, anon;
grant execute on function public.create_customer_portal_link(uuid, integer)
  to authenticated;

create or replace function public.resolve_customer_portal(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'extensions', 'pg_temp'
as $function$
declare
  v_hash text;
  v_access private.customer_portal_tokens%rowtype;
  v_result jsonb;
begin
  if p_token is null or p_token !~ '^[a-fA-F0-9]{64}$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_token');
  end if;

  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  select * into v_access
  from private.customer_portal_tokens t
  where t.token_hash = v_hash
    and t.revoked_at is null
    and t.expires_at > now()
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_expired');
  end if;

  update private.customer_portal_tokens
  set last_accessed_at = now()
  where id = v_access.id;

  select jsonb_build_object(
    'ok', true,
    'expires_at', v_access.expires_at,
    'company', jsonb_build_object(
      'name', co.name,
      'phone', co.phone,
      'email', co.email
    ),
    'customer', jsonb_build_object(
      'display_name', c.display_name,
      'customer_number', c.customer_number
    ),
    'requests', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'title', coalesce(nullif(btrim(l.issue_type), ''), 'Anfrage'),
          'description', l.issue_description,
          'status', l.status,
          'created_at', l.created_at,
          'updated_at', l.updated_at
        ) order by l.updated_at desc
      )
      from (
        select * from public.leads
        where company_id = v_access.company_id
          and customer_id = v_access.customer_id
        order by updated_at desc
        limit 20
      ) l
    ), '[]'::jsonb),
    'appointments', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'service', a.service_type,
          'date', a.appointment_date,
          'start_time', a.start_time,
          'end_time', a.end_time,
          'status', a.status,
          'address', a.address,
          'postal_code', a.postal_code
        ) order by a.appointment_date desc nulls last, a.start_time desc nulls last
      )
      from (
        select * from public.appointments
        where company_id = v_access.company_id
          and customer_id = v_access.customer_id
        order by appointment_date desc nulls last, start_time desc nulls last
        limit 20
      ) a
    ), '[]'::jsonb)
  ) into v_result
  from public.customers c
  join public.companies co on co.id = c.company_id
  where c.id = v_access.customer_id
    and c.company_id = v_access.company_id;

  return coalesce(v_result, jsonb_build_object('ok', false, 'reason', 'customer_not_found'));
end;
$function$;

revoke all on function public.resolve_customer_portal(text)
  from public, authenticated;
grant execute on function public.resolve_customer_portal(text)
  to anon;
