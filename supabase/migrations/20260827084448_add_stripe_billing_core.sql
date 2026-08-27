-- Stripe test-mode billing state. Writes are service-only through the webhook;
-- authenticated company users receive read-only, tenant-scoped access.

create table if not exists public.billing_accounts (
  company_id uuid primary key references public.companies(id) on delete cascade,
  stripe_customer_id text not null unique,
  test_mode boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_subscriptions (
  company_id uuid primary key references public.companies(id) on delete cascade,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('pilot', 'monthly')),
  status text not null check (
    status in ('incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused', 'cancelled', 'expired')
  ),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur' check (currency = lower(currency) and length(currency) = 3),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  test_mode boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_subscription_id text,
  invoice_number text,
  status text not null,
  currency text not null default 'eur',
  amount_due_cents integer not null default 0,
  amount_paid_cents integer not null default 0,
  tax_cents integer not null default 0,
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  test_mode boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscription_invoices_company_created_idx
  on public.subscription_invoices (company_id, created_at desc);

create table if not exists private.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  object_id text,
  livemode boolean not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

revoke all on table private.stripe_webhook_events from public, anon, authenticated;

alter table public.billing_accounts enable row level security;
alter table public.company_subscriptions enable row level security;
alter table public.subscription_invoices enable row level security;

drop policy if exists "Company users can view billing account" on public.billing_accounts;
create policy "Company users can view billing account"
on public.billing_accounts for select to authenticated
using (
  company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid()))
);

drop policy if exists "Company users can view subscription" on public.company_subscriptions;
create policy "Company users can view subscription"
on public.company_subscriptions for select to authenticated
using (
  company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid()))
);

drop policy if exists "Company users can view subscription invoices" on public.subscription_invoices;
create policy "Company users can view subscription invoices"
on public.subscription_invoices for select to authenticated
using (
  company_id = (select p.company_id from public.profiles p where p.id = (select auth.uid()))
);

revoke all on table public.billing_accounts from public, anon, authenticated;
revoke all on table public.company_subscriptions from public, anon, authenticated;
revoke all on table public.subscription_invoices from public, anon, authenticated;
grant select on table public.billing_accounts to authenticated;
grant select on table public.company_subscriptions to authenticated;
grant select on table public.subscription_invoices to authenticated;
