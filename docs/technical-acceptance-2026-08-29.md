# ZunftEcho technical acceptance — 2026-08-29

## Outcome

The production application is operational on `https://zunftecho.de`. The public
site, authenticated workspace, mobile navigation, widget loader, Supabase
automation, outbound e-mail queue, appointment safety rules, and test-billing
guardrails passed the acceptance checks below.

Real billing remains deliberately inactive until Stripe test credentials are
connected and the later legal/tax activation is approved. This is an external
configuration dependency, not an application defect.

## Release checked

- Cloudflare Worker version: `da2cb711-8e5f-4fe7-9611-ccf759c88805`
- Supabase project: `srufegisweghdswdsdxb` (`eu-central-1`, healthy)
- Public identity: ZunftEcho
- Public marketing surfaces no longer expose a personal support address.
- The legal operator name remains only where German legal pages require it.

## Automated checks

- Production build: passed.
- TypeScript (`tsc --noEmit`): passed.
- ESLint: passed with zero errors; ten non-blocking Fast Refresh warnings remain
  in shared UI component modules.
- Domain and route smoke test: passed for all public and authenticated routes.
- Pure logic and document smoke tests: 11/11 passed.
  - Date/time normalization.
  - Service allow-list resolution.
  - Appointment target validation.
  - No appointment UUID in quick replies or summaries.
  - Atomic reschedule success contracts.
  - Danger/fallback handling and sentiment escalation.
  - Stripe signature validation and tax totals.
  - German invoice PDF generation.

## Browser acceptance

- Landing page, pricing, pilot request, login/reset, Impressum, Datenschutz and
  AGB render without blank screens or application errors.
- The mobile dashboard opens immediately in the saved dark theme.
- Full mobile navigation and bottom navigation expose every operational area.
- The account avatar opens a menu first; logout remains a deliberate second
  action.
- Leaving an invalid invitation and opening customer login does not trap the
  browser in the invitation flow.
- The standalone HTML widget test loads from localhost, shows the branded
  launcher, opens full-screen on mobile and exposes services, quick replies,
  location, address and optional photo controls.
- No `Chat ist nicht verfügbar` state appeared during the widget test.
- No production lead was created during acceptance.

## Data and automation acceptance

- 25 Supabase Edge Functions are active.
- 19/19 queued outbound messages are in `sent`; none are failed.
- The sent entity mix includes conversations, leads, an appointment and a team
  invitation, so the expanded `entity_type` constraint is exercised.
- All four ZunftEcho automation jobs are active; no Cron failure occurred in the
  last 24 hours.
- No workflow error occurred in the last 24 hours. One older booking test error
  remains in the audit trail and predates the current booking hardening.
- No active appointment-slot collision and no orphan appointment row exists.
- All five notification-preference rows contain event/channel configuration and
  a timezone.
- The widget installation was observed during acceptance.
- No current company, application source, Edge Function or database function
  contains the legacy HandwerkAI identity. One already-sent historical invite
  keeps its original immutable message body.

## Security review

- RLS is enabled for all public application tables.
- Public token and booking RPC warnings remain intentional: these functions are
  the narrowly scoped anonymous interface required by the widget and customer
  portal. They validate widget keys or expiring tokens internally.
- `pilot_requests` and `workflow_errors` intentionally have no client policies;
  they are service-only/fail-closed tables.
- Performance advisor notices are primarily unused-index observations on a
  small pre-launch dataset; removing those indexes before real workload data
  would be premature.

## Deliberate external dependencies

- Stripe test keys are not connected. Both checkout buttons fail closed with a
  clear message and cannot start live payments.
- SMS, voice, sevDesk and Lexware Office integrations are present as optional
  adapters but remain disconnected until accounts/credentials are chosen.
- Formal invoice activation remains disabled until Gewerbe and tax data are
  available.

## Release decision

Technical acceptance: **passed for continued demo and pilot preparation**.

The next engineering package is a public, zero-cost interactive sales demo that
connects the prospect's chat scenario to the resulting lead, alert and
appointment views without writing to production data.

