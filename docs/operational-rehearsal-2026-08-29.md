# ZunftEcho operational rehearsal — 2026-08-29

## Outcome

The production onboarding and customer-handling path was rehearsed successfully
with the configured demo company. Company setup, the public chat orchestrator,
emergency escalation, outbound e-mail, appointment booking and atomic conflict
prevention behaved as intended. All generated test data was removed afterwards.

## Environment

- Production site: `https://zunftecho.de`
- Supabase project: `srufegisweghdswdsdxb`
- Demo company: `ZunftEcho Demo SHK Berlin`
- Test marker: `PROBETEST`
- Test page: `https://zunftecho.de/__codex_rehearsal__`
- Campaign marker: `codex / prelaunch-20260829`

## Onboarding review

The five setup steps were reviewed on production in both desktop and 390 px
mobile layouts:

- company profile;
- services;
- service areas;
- opening hours;
- AI employee configuration.

The saved dark theme was present from the first mobile paint. The setup remained
usable on the small viewport and the browser viewport was reset after the test.

The demo company was also cleaned up before the rehearsal:

- the public description now uses the ZunftEcho identity;
- placeholder quote terms and footer text were removed;
- the personal bank-account-holder placeholder was removed;
- operational e-mail notifications were enabled;
- billing remains deliberately disabled.

## Live workflow tests

### Emergency and human handoff

A public widget request reporting a gas smell returned HTTP 200, gave immediate
safety guidance and created an urgent lead with a pending human handoff. The
conversation was classified as requiring a human, and the external alert entered
the outbound e-mail pipeline successfully.

### Appointment booking

The chat offered an actually available slot for `Heizungswartung` on 31 August
2026 at 10:00. After confirmation, exactly one confirmed appointment was created
for 10:00–11:00. The customer-facing replies and summary did not expose an
appointment UUID.

### Double-booking prevention

A second independent conversation attempted to reserve the same slot. The
request returned HTTP 200 with a clear unavailable-slot response and a waitlist
option. No second appointment was created, confirming the atomic booking guard.

### Outbound processing and health

Four rehearsal messages were accepted and moved to `sent`. Edge Function logs
show HTTP 200 for the tested chat and outbound-message functions. No workflow
error was recorded during or after the rehearsal.

One Stripe checkout request returned HTTP 503 as designed because billing is
intentionally fail-closed until Stripe and the legal/tax data are activated. It
is not treated as an operational failure.

## Cleanup verification

The exact rehearsal records were deleted after validation. A follow-up database
query confirmed zero remaining rehearsal conversations, messages, leads,
appointments, customers, notifications, outbound messages and activity-log
entries. The tested 10:00 slot is free again, and the workflow-error count for
the final 30-minute verification window is zero.

## Decision

Operational rehearsal: **passed**.

## Public pilot-request rehearsal

The production `/registrieren` form was submitted from the public ZunftEcho
origin with an explicit `PROBETEST` marker. The user-facing success state
rendered, the request was stored with source `codex:prelaunch-20260829`, and
`notified_at` was populated with no notification error. The exact request was
then deleted and a follow-up query confirmed that no rehearsal request or recent
notification error remained.

The self-service setup and first-customer operating path can now be treated as
prepared. The response process has also been rehearsed and documented. The next
planned work is print preparation followed by the final go/no-go check before
legal and payment activation.
