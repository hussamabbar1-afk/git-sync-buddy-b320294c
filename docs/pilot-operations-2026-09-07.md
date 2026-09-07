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

The current MCP access verifies database state but does not expose backup inventory.
No management token was available in the task environment; the dashboard required login.
No snapshot, export, restore, or off-site copy was created or claimed by this checkpoint.

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
GitHub run and Edge deployment verification are recorded at handoff below when available.

Resolve backup/restore access and real-device acceptance; evaluate live latency samples;
continue the existing organic content schedule and daily source monitor, without duplicate
automations, cold outreach, phone calls, paid ads, or payment activation.
