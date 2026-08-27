-- Record who changed operational AI settings without storing full prompt text.

create or replace function private.audit_ai_agent_settings()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
declare
  v_changes jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    perform private.write_activity(
      new.company_id,
      'ai_agent',
      new.id,
      'ai_agent_created',
      'KI-Mitarbeiter erstellt',
      jsonb_build_object(
        'name', new.name,
        'language', new.language,
        'is_active', new.is_active
      )
    );
    return new;
  end if;

  if old.name is distinct from new.name then
    v_changes := v_changes || jsonb_build_object(
      'name', jsonb_build_object('before', old.name, 'after', new.name)
    );
  end if;
  if old.is_active is distinct from new.is_active then
    v_changes := v_changes || jsonb_build_object(
      'is_active', jsonb_build_object('before', old.is_active, 'after', new.is_active)
    );
  end if;
  if old.language is distinct from new.language then
    v_changes := v_changes || jsonb_build_object(
      'language', jsonb_build_object('before', old.language, 'after', new.language)
    );
  end if;
  if old.response_style is distinct from new.response_style then
    v_changes := v_changes || jsonb_build_object(
      'response_style',
      jsonb_build_object('before', old.response_style, 'after', new.response_style)
    );
  end if;
  if old.human_handoff_enabled is distinct from new.human_handoff_enabled then
    v_changes := v_changes || jsonb_build_object(
      'human_handoff_enabled',
      jsonb_build_object('before', old.human_handoff_enabled, 'after', new.human_handoff_enabled)
    );
  end if;
  if old.supported_languages is distinct from new.supported_languages then
    v_changes := v_changes || jsonb_build_object(
      'supported_languages',
      jsonb_build_object('before', old.supported_languages, 'after', new.supported_languages)
    );
  end if;
  if old.auto_detect_language is distinct from new.auto_detect_language then
    v_changes := v_changes || jsonb_build_object(
      'auto_detect_language',
      jsonb_build_object('before', old.auto_detect_language, 'after', new.auto_detect_language)
    );
  end if;
  if old.staff_summary_language is distinct from new.staff_summary_language then
    v_changes := v_changes || jsonb_build_object(
      'staff_summary_language',
      jsonb_build_object('before', old.staff_summary_language, 'after', new.staff_summary_language)
    );
  end if;
  if old.translate_staff_summary is distinct from new.translate_staff_summary then
    v_changes := v_changes || jsonb_build_object(
      'translate_staff_summary',
      jsonb_build_object(
        'before', old.translate_staff_summary,
        'after', new.translate_staff_summary
      )
    );
  end if;
  if old.description is distinct from new.description then
    v_changes := v_changes || jsonb_build_object(
      'description', jsonb_build_object('changed', true)
    );
  end if;
  if old.welcome_message is distinct from new.welcome_message then
    v_changes := v_changes || jsonb_build_object(
      'welcome_message', jsonb_build_object('changed', true)
    );
  end if;
  if old.fallback_message is distinct from new.fallback_message then
    v_changes := v_changes || jsonb_build_object(
      'fallback_message', jsonb_build_object('changed', true)
    );
  end if;

  if v_changes <> '{}'::jsonb then
    perform private.write_activity(
      new.company_id,
      'ai_agent',
      new.id,
      'ai_agent_settings_updated',
      'KI-Einstellungen geändert',
      jsonb_build_object(
        'changed_fields', (
          select jsonb_agg(field order by field)
          from jsonb_object_keys(v_changes) as fields(field)
        ),
        'changes', v_changes
      )
    );
  end if;

  return new;
end;
$function$;

revoke all on function private.audit_ai_agent_settings()
  from public, anon, authenticated;

drop trigger if exists trg_audit_ai_agent_settings on public.ai_agents;
create trigger trg_audit_ai_agent_settings
after insert or update on public.ai_agents
for each row execute function private.audit_ai_agent_settings();

create or replace function private.audit_company_ai_settings()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $function$
begin
  if old.handoff_sla_minutes is distinct from new.handoff_sla_minutes then
    perform private.write_activity(
      new.id,
      'company',
      new.id,
      'ai_handoff_sla_updated',
      'Übergabe-SLA geändert',
      jsonb_build_object(
        'before_minutes', old.handoff_sla_minutes,
        'after_minutes', new.handoff_sla_minutes
      )
    );
  end if;
  return new;
end;
$function$;

revoke all on function private.audit_company_ai_settings()
  from public, anon, authenticated;

drop trigger if exists trg_audit_company_ai_settings on public.companies;
create trigger trg_audit_company_ai_settings
after update of handoff_sla_minutes on public.companies
for each row execute function private.audit_company_ai_settings();
