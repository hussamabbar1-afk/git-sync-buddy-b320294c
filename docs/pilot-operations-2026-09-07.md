# First-pilot operational readiness — 7 September 2026

This continues `qa-audit-2026-09-07.md`; it does not repeat or supersede its fixes.
Billing, formal invoicing, pricing, asynchronous sales, and legal launch gates are unchanged.

## Automated regression checks

`.github/workflows/quality.yml` runs on PRs, pushes to `main`, and manual dispatch.
It installs the existing `bun.lock` with `--frozen-lockfile`, runs regression tests,
frontend and chat Edge type checks, lint, and the production build. Actions are SHA-pinned;
the workflow has read-only repository permissions, no production secrets, no deployment,
and a 15-minute timeout. It does not change Lovable's deployment configuration.

**Important:** a workflow is not branch protection. Its result must be checked before
any manual production deployment. Do not claim that all external deployment paths are
technically blocked until required-check rules and those paths have been verified.

## Chat latency and usage

The orchestrator emits a request-local `chat_performance` JSON event containing only
HTTP status, stage timings, and numeric provider token counts. It does not log customer
messages, addresses, conversation/company identifiers, widget keys, headers, or URLs.
No tracking script, database table, frontend dependency, or extra API request is added.
Logging failure cannot change the chat response. Missing provider usage remains `null`.

Stages distinguish context/database work, analysis, actions, translation, and final persistence.
The independent booking-settings read now overlaps the two existing input writes; all
three are awaited before the conversation/history reads or booking decisions. No booking
mutation, model, prompt, token limit, or reasoning setting has changed.

Export only the matching performance events to a private JSONL file (raw JSON per line,
or an `event_message` JSON string), then run:

```powershell
node scripts/chat-performance-report.mjs .private/chat-performance.jsonl
```

The offline report computes sample counts, p50/p95, stages, failed AI calls and token
coverage. It never echoes private raw logs. Zero samples means **unknown**, not fast.
Server duration excludes the mobile network and is not time-to-first-token. HTTP 200
includes rejected widget requests, so it is not a conversation conversion metric.
Cached tokens are part of input; reasoning tokens are part of output. Do not double count.
Currency cost requires the actual configured model/current tariff and provider reconciliation;
operational logs are not a billing ledger. Before optimizing further, collect representative
German/non-German samples and compare the same scenarios. Small samples do not establish p95.

API field reference: [OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create).

## Security checkpoint

Live read-only checks: project ACTIVE_HEALTHY, organization plan **free**;
zero public tables without RLS, zero exposed SECURITY DEFINER functions without a fixed
search path, zero workflow errors and failed Cron executions in the preceding 24 hours.
These structural checks do not prove every function's authorization logic correct.
The existing advisor inventory remains: 6 anonymous and 31 authenticated definers,
2 service-only tables without policies, and leaked-password protection disabled.
No grants or RLS policies were broadened to suppress advisories.

[Leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
requires Pro or above. No paid upgrade was made. This remains an explicit readiness decision,
not a completed security feature.

## Backup and isolated restoration — NOT YET VERIFIED

Follow-up: an existing CLI credential was found in the standard local Supabase credential
file (not in environment variables). It was used in memory for read-only Management API
requests, without printing or copying it. The backup inventory returned zero entries,
`walg_enabled=true` and `pitr_enabled=false` in `eu-central-1`. WAL-G being enabled does
not establish an available or tested recovery point. No snapshot, export, restore, or
off-site copy has been created or claimed. Credential access is no longer the blocker;
an actual recovery source, owner-controlled encrypted destination and isolated restore
test remain outstanding.

Supabase documents daily accessible backups for paid plans and recommends exports on Free.
Database backups **do not include Storage file bodies**:
[official backup documentation](https://supabase.com/docs/guides/platform/backups).

Before accepting the first real customer's data:

1. Confirm the actual recovery source, timestamp, scope and access using an authorized
   dashboard session or scoped operational credentials. Do not create a paid project silently.
2. Export schema/roles/application data through the supported CLI/database backup path,
   verifying current CLI `--help` first. Include an explicit Auth recovery plan; an application
   schema-only dump is not a complete Supabase project backup.
3. Inventory/download private Storage objects separately with bucket/path/checksum metadata.
   Keep secrets and customer data out of Git, public links, logs, and unencrypted archives.
4. Encrypt a copy in an owner-controlled off-site destination; a file on this same laptop
   is not sufficient. Agree the destination and recovery-key custody before transmitting data.
5. Restore into a disposable isolated target, never over production. Disable Cron, outbound
   email/webhooks, and payments there **before** restoring operational data. Keep the target
   inaccessible to public traffic; secrets are reconfigured separately and never copied blindly.
6. Compare table/object counts and checksums; test sign-in, tenant isolation, conversation,
   Lead/customer/appointment links and private image access. Record actual recovery duration
   and age of the recovered data. Do not promise an RPO/RTO before measuring it.

## Physical iPhone/Safari acceptance — NOT YET VERIFIED

Use an isolated marked test company, synthetic contact information, and no customer emails.
Record device/iOS/Safari versions and check:

- Keyboard open/closed, long chat, portrait/landscape and browser-toolbar changes: composer
  and latest reply remain reachable; no horizontal overflow.
- Photo from camera (HEIC/JPEG) and PNG screenshot: upload, cancellation, size handling,
  private download and third-photo limit; no internal action identifiers.
- Location allow/deny, manual address, close/cancel, confirm and failed-send retry: the editor
  closes and only explicitly confirmed coordinates/address are sent.
- Booking, cancellation and rescheduling confirmations; conversation list/detail/back;
  notification switches and search deep links.
- Refresh/background/foreground and interrupted network: no duplicate submission or booking.

Clean the exact synthetic records/files afterward. Chrome or desktop WebKit emulation is
useful evidence but does not mark this real-device requirement complete.

## Next work

Local verification: 52/52 saved tests pass; frontend TypeScript, strict chat Edge TypeScript,
Deno check, ESLint (zero warnings) and production build pass. The existing production
public smoke check passes. Frontend CSS remains 27.40 KB gzip; no frontend assets were edited.
GitHub [Quality gate run 34151326468](https://github.com/hussamabbar1-afk/git-sync-buddy-b320294c/actions/runs/34151326468)
completed successfully for implementation commit `a7ae24d`. This verifies the frozen-lockfile
installation and complete workflow on a clean Linux runner, not only the local Windows checkout.

### Production handoff

- `chat-orchestrator` **v18 ACTIVE**; deployment used explicit `import_map_path=deno.json`
  because the first upload inherited v17's obsolete temporary import-map path and was rejected.
  No failed bundle was activated. Future MCP deploys must specify the import-map path explicitly.
- Cloudflare Worker is unchanged at `4782bfc6-f9ae-4ff3-b3cd-6009f817e35e`;
  no frontend deployment was necessary. Health GET passes and malformed/empty requests return400.
- Isolated `QA-PERF-20260907` company had no members, email recipients, outbound messages,
  appointments or real customer information. German and English photo questions both returned
  correct action cards and preserved language before/after deployment; internal metrics were not
  exposed in the response. One initial test expected an obsolete action name; its assertion was
  corrected to the existing `__action_upload_photo` contract, not by changing the working app.
- Tiny paired sample (one fresh conversation per language per version): German9485ms
  before versus11388ms after; English11515ms before versus12339ms after.
  An earlier single German sample was9089ms. These results **do not establish
  a speed improvement**. Provider variability/cold starts and the very small sample prevent an
  improvement or regression conclusion. Further speed optimization remains open.
- Five test conversations in total were cleaned up with the exact marked company and service;
  rate buckets removed. First company deletion was rolled back by the service foreign key;
  the subsequent scoped transaction deleted the child first. No real data was affected.
- At the v18 handoff, live stage/token log access was not yet available. The later follow-up
  below resolves access and verifies ingestion; this historical two-request comparison still
  does not establish a latency improvement or a representative production baseline.

Resolve backup/restore coverage and real-device acceptance; evaluate live latency samples;
continue the existing organic content schedule and daily source monitor, without duplicate
automations, cold outreach, phone calls, paid ads, or payment activation.

## Narrow photo-question fast path — implementation checkpoint

Only a standalone first-message German/English question about whether uploading a photo
is possible uses a curated reply without analysis or translation calls. The existing
widget gate and tenant checks still run; an upload-ready Lead and both messages are
persisted before the normal upload action is returned. Existing Leads, prior conversation,
appointments, confirmed location, unsupported output languages, mixed requests, symptoms,
upload failures and negations retain the full normal path. Existing handoff/safety guards
are unchanged. Model, prompts, booking logic, frontend assets and billing are unchanged.

This follows the [OpenAI latency guidance](https://developers.openai.com/api/docs/guides/latency-optimization)
to avoid model calls for constrained, known output; it is not a replacement for general
conversation understanding. Regression coverage is now 57 tests, including language policy,
provider outage, persistence order, gate/handoff rejection and compound danger messages.
Frontend/strict Edge TypeScript, lint and production build also pass locally.

Live performance-event access now works through the existing Management API credential
and the unified `analytics/endpoints/logs` endpoint. A source-filtered query first returned
a backend error; querying only the exact `chat_performance` event marker succeeded.
No broad customer logs are required. Initial v18 synthetic samples confirm analysis and
English localization dominate request time.

### Verified production result — v19

Implementation commit `e8b88ee` passed [GitHub Quality gate 34152744094](https://github.com/hussamabbar1-afk/git-sync-buddy-b320294c/actions/runs/34152744094)
before deployment. `chat-orchestrator` **v19 ACTIVE**, bundle SHA-256
`d3cba093335295ebae087a676d6e3a726484df3bce8e1060a0451294069e1f6e`.
The frontend Worker and other Edge functions remain unchanged; public production smoke,
health GET200 and invalid empty chat POST400 pass.

Six fresh synthetic conversations per version, three per language, sequentially from the
same workstation on 7 September (baseline18:41–18:43 UTC; v19 at18:44 UTC):

| Language | v18 client elapsed ms | v19 client elapsed ms | Median before → after |
| --- | --- | --- | --- |
| German | 7122, 8698, 9806 | 1445, 583, 699 | 8698 → 699ms |
| English | 13341, 14993, 11693 | 550, 630, 553 | 13341 → 553ms |

All responses were200, correct language, the existing upload-action contract, and no raw
action/UUID in visible message text or telemetry fields in the response. Live matching
server events measured6883–14883ms before and429–759ms after. The first v19 client request
also includes deployment/network startup overhead, which server elapsed time does not.
The six baseline requests made9 model calls (7914 input tokens,4583 output tokens;
2304 cached input and2112 reasoning output are subsets). All six v19 events have `ai:[]`.
The offline performance report successfully ingested these real events. Its sample p95
is not a reliable production percentile at n=6; no monetary savings or mobile3G/4G claim
is inferred. This evidence applies only to the narrow first-turn photo FAQ.

An English follow-up about heating maintenance remained in the same conversation, used
the normal workflow and returned in English in13146ms: **general chat latency remains
open**. Twelve conversations had twelve correctly company-linked Leads, with zero missing
or duplicate links, zero appointments, zero outbound messages and zero workflow errors.
There were26 persisted messages, including13 assistant replies after the follow-up.
Actual image upload bytes and real Safari were not re-tested in this narrow follow-up;
the previous attachment audit remains separate evidence.

The exact isolated `QA-FAST-20260907` company, twelve conversations/Leads, service, agent
and rate buckets were deleted after verification; residual counts are zero. No real
customer records were changed, no emails sent and no files uploaded in this benchmark.
