alter table public.pilot_requests
  add column if not exists team_size_range text,
  add column if not exists monthly_inquiry_range text,
  add column if not exists primary_challenge text,
  add column if not exists preferred_start_window text,
  add column if not exists audit_requested boolean not null default false;

alter table public.pilot_requests
  drop constraint if exists pilot_requests_team_size_range_check,
  add constraint pilot_requests_team_size_range_check
    check (team_size_range is null or team_size_range in ('solo', '2-5', '6-10', '11-plus')),
  drop constraint if exists pilot_requests_monthly_inquiry_range_check,
  add constraint pilot_requests_monthly_inquiry_range_check
    check (monthly_inquiry_range is null or monthly_inquiry_range in ('0-5', '6-15', '16-30', '31-plus', 'unknown')),
  drop constraint if exists pilot_requests_primary_challenge_check,
  add constraint pilot_requests_primary_challenge_check
    check (primary_challenge is null or primary_challenge in ('incomplete-details', 'slow-response', 'appointment-coordination', 'callback-load', 'other')),
  drop constraint if exists pilot_requests_preferred_start_window_check,
  add constraint pilot_requests_preferred_start_window_check
    check (preferred_start_window is null or preferred_start_window in ('after-clearance', 'september', 'october', 'later'));

comment on column public.pilot_requests.team_size_range is
  'Optional self-reported company size range used only for founding-pilot qualification.';
comment on column public.pilot_requests.monthly_inquiry_range is
  'Optional self-reported monthly website inquiry range.';
comment on column public.pilot_requests.primary_challenge is
  'Optional self-reported operational challenge selected on the pilot form.';
comment on column public.pilot_requests.preferred_start_window is
  'Optional preferred pilot start window; it is not a booking or contractual commitment.';
comment on column public.pilot_requests.audit_requested is
  'Whether the requester explicitly asked for the free manual website inquiry audit.';
