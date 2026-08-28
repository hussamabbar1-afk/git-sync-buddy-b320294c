-- Keep appointment identifiers inside the backend conversation state. Customer
-- messages and quick replies use human-readable date/time/service descriptions.
alter table public.leads
  add column if not exists cancellation_target_appointment_id uuid
  references public.appointments(id) on delete set null;

create index if not exists leads_cancellation_target_appointment_idx
  on public.leads (cancellation_target_appointment_id)
  where cancellation_target_appointment_id is not null;

-- All published widgets must open the current ZunftEcho production frontend.
update public.widget_display_settings
set public_widget_base_url = 'https://zunftecho.de',
    updated_at = now()
where public_widget_base_url is null
   or btrim(public_widget_base_url) = ''
   or public_widget_base_url ilike '%lovable.app%';

-- Permit a deliberately served local preview for the demo tenant. Raw file://
-- pages remain blocked because browsers expose their origin only as "null".
-- Serving the file on this exact loopback port preserves origin isolation.
update public.widget_security_settings as settings
set allowed_origins = array(
      select distinct origin
      from unnest(
        coalesce(settings.allowed_origins, '{}'::text[])
        || array['http://localhost:5500', 'http://127.0.0.1:5500']::text[]
      ) as allowed(origin)
      where btrim(origin) <> ''
    ),
    updated_at = now()
from public.ai_agents as agent
join public.companies as company on company.id = agent.company_id
where settings.ai_agent_id = agent.id
  and company.name = 'ZunftEcho Demo SHK Berlin';
