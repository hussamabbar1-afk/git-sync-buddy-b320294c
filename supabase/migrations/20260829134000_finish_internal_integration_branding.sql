-- Keep future Vault metadata aligned with the public ZunftEcho identity. Existing
-- integrations reference secrets by UUID, so changing this label is backward compatible.
create or replace function public.set_integration_credentials(
  p_integration_id uuid,
  p_credentials jsonb
)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'private', 'vault', 'pg_temp'
as $function$
declare
  v_company uuid;
  v_provider text;
  v_role text;
  v_secret_id uuid;
  v_old_secret uuid;
begin
  select ei.company_id, ei.provider
    into v_company, v_provider
  from public.external_integrations ei
  where ei.id = p_integration_id;

  if v_company is null then
    raise exception 'Integration not found';
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = auth.uid()
    and p.company_id = v_company;

  if v_role not in ('owner', 'admin') then
    raise exception 'Not authorized';
  end if;

  if p_credentials is null or p_credentials = '{}'::jsonb then
    raise exception 'Credentials required';
  end if;

  select secret_id
    into v_old_secret
  from private.integration_secret_refs
  where integration_id = p_integration_id;

  if v_old_secret is null then
    v_secret_id := vault.create_secret(
      p_credentials::text,
      'zunftecho:' || p_integration_id::text,
      'Credentials for ' || v_provider,
      null
    );

    insert into private.integration_secret_refs (integration_id, secret_id)
    values (p_integration_id, v_secret_id);
  else
    perform vault.update_secret(
      v_old_secret,
      p_credentials::text,
      'zunftecho:' || p_integration_id::text,
      'Credentials for ' || v_provider,
      null
    );

    v_secret_id := v_old_secret;

    update private.integration_secret_refs
    set updated_at = now()
    where integration_id = p_integration_id;
  end if;

  update public.external_integrations
  set
    credentials_configured = true,
    status = case when status = 'disconnected' then 'configured' else status end,
    updated_at = now(),
    last_error_message = null
  where id = p_integration_id;

  return true;
end;
$function$;

