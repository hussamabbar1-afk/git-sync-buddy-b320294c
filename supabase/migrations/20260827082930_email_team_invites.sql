-- Send team invitations through the existing retryable email queue.

create or replace function public.create_company_invite(
  p_email text,
  p_role text default 'member',
  p_expires_days integer default 7
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'extensions', 'pg_temp'
as $function$
declare
  v_company uuid;
  v_company_name text;
  v_role text;
  v_email text;
  v_token text;
  v_hash text;
  v_id uuid;
  v_exp timestamptz;
  v_inviter text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select p.company_id, co.name, coalesce(nullif(btrim(p.full_name), ''), 'Ein Administrator')
    into v_company, v_company_name, v_inviter
  from public.profiles p
  join public.companies co on co.id = p.company_id
  where p.id = auth.uid()
    and p.role in ('owner', 'admin');

  if v_company is null then
    raise exception 'Administrator permission required';
  end if;

  v_email := lower(btrim(coalesce(p_email, '')));
  if v_email = '' or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Invalid email';
  end if;

  v_role := case when p_role = 'admin' then 'admin' else 'member' end;
  v_exp := now() + make_interval(days => greatest(1, least(coalesce(p_expires_days, 7), 30)));

  delete from public.company_invites
  where company_id = v_company
    and lower(email) = v_email
    and accepted_at is null;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into public.company_invites (
    company_id, email, role, token_hash, invited_by, expires_at
  ) values (
    v_company, v_email, v_role, v_hash, auth.uid(), v_exp
  )
  returning id into v_id;

  perform private.enqueue_operational_email(
    v_company,
    v_email,
    'Einladung zum ZunftEcho-Team von ' || v_company_name,
    concat_ws(E'\n',
      v_inviter || ' hat Sie zum ZunftEcho-Arbeitsbereich von ' || v_company_name || ' eingeladen.',
      '',
      'Rolle: ' || case when v_role = 'admin' then 'Administrator' else 'Mitarbeiter' end,
      'Einladung annehmen: https://zunftecho.de/einladung?token=' || v_token,
      '',
      'Die Einladung ist bis ' || to_char(v_exp at time zone 'Europe/Berlin', 'DD.MM.YYYY HH24:MI') || ' Uhr gültig.'
    ),
    'company_invite',
    v_id,
    'team_invite:' || v_id::text,
    now(),
    null,
    jsonb_build_object('kind', 'team_invite', 'role', v_role, 'expires_at', v_exp)
  );

  return jsonb_build_object(
    'invite_id', v_id,
    'token', v_token,
    'email', v_email,
    'role', v_role,
    'expires_at', v_exp,
    'invite_url', 'https://zunftecho.de/einladung?token=' || v_token,
    'email_queued', true
  );
end;
$function$;

revoke all on function public.create_company_invite(text, text, integer)
  from public, anon;
grant execute on function public.create_company_invite(text, text, integer)
  to authenticated;
