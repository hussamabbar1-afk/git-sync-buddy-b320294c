create table public.pilot_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(company) between 2 and 120),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text check (phone is null or char_length(phone) <= 50),
  website text check (website is null or char_length(website) <= 300),
  message text check (message is null or char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  source text not null default 'website',
  fingerprint_hash text not null check (char_length(fingerprint_hash) = 64),
  notified_at timestamptz,
  notification_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pilot_requests is
  'Public website pilot enquiries. Writes are restricted to the pilot-request Edge Function.';

create index pilot_requests_status_created_at_idx
  on public.pilot_requests (status, created_at desc);

create index pilot_requests_fingerprint_created_at_idx
  on public.pilot_requests (fingerprint_hash, created_at desc);

alter table public.pilot_requests enable row level security;

revoke all on table public.pilot_requests from public, anon, authenticated;
grant all on table public.pilot_requests to service_role;

