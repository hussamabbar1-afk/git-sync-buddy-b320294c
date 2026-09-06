# ZunftEcho – First-pilot response readiness

Date: 6 September 2026  
Scope: the voluntary `/registrieren` request path and the owner's written response workflow.

## Outcome

The production path is ready to receive and triage the first pilot request without a sales call.
The public request remains non-binding and does not create a contract, payment, invoice, or pilot
start.

## Production rehearsal

A uniquely labelled synthetic request was submitted through the live `pilot-request` Edge
Function using the production origin and publishable key.

- API response: `200`, `{ "ok": true }`.
- Source and all structured qualification fields were preserved.
- Initial database status: `new`.
- Notification: `notified_at` set and `notification_error` empty.
- Test cleanup: the exact synthetic row was deleted immediately.
- Cleanup verification: zero rows remained for either readiness-test source.

The rehearsal used no real prospect or customer data. It produced internal QA notifications only;
no customer acknowledgement, follow-up, payment, or contract action was triggered.

## Notification improvement

Supabase Edge Function `pilot-request` version 8 adds two internal aids to the notification sent to
ZunftEcho:

1. A prominent next step: reply directly to the email within one business day, without a call, and
   confirm the problem, responsibility, and start window in writing.
2. A signal-strength score from zero to five based only on self-reported form fields: inquiry
   volume, a concrete challenge, start window, and the optional audit request.

The score is only a queue-prioritisation aid. It does not infer revenue, team workload, location,
decision authority, or contractual readiness, and it never accepts a pilot automatically.

## Sender identity correction

The owner confirmed that the first readiness notification displayed the legacy sender name
`HandwerkAI`, although the message body and logo were correctly branded as ZunftEcho. The cause
was the production secret `BREVO_SENDER_NAME`, which still carried the pre-rebrand value.

- The shared Supabase secret was updated to `ZunftEcho` on 6 September 2026.
- A post-change synthetic request was accepted and its notification recorded as sent without an
  error; the exact test row was then deleted.
- The `pilot-request` function was additionally hardened to send platform pilot notifications with
  the fixed display name `ZunftEcho`, so a stale shared secret cannot reintroduce this issue.
- The current production function is `pilot-request` version 10. Retrieval of the deployed source
  confirmed the fixed sender name and no `BREVO_SENDER_NAME` lookup in this function.
- Other current mail paths use either the corrected shared setting or the current tenant company
  name. No unsent outbound message containing the legacy name exists. One already-sent invitation
  from 28 August remains as immutable historical evidence only.

## Verification

- Saved tests: 20/20 passed.
- ESLint: passed with zero errors and zero warnings.
- TypeScript: passed with the temporary current compiler invocation.
- Production build: passed.
- Deployed function retrieval confirmed the score and written-response instructions are present.
- Post-deployment production request and notification: passed.
- Synthetic database rows after cleanup: zero.

## Operator action when the first real request arrives

1. Reply directly to the ZunftEcho notification; `Reply-To` already targets the requester.
2. Use the score only to order the inbox, then personally verify fit.
3. Keep the exchange async-first and ask at most three focused questions.
4. Do not call unless the project owner explicitly changes the no-call rule.
5. Do not start a contract, invoice, Stripe checkout, or paid pilot before the Gewerbe and legal
   activation gates are complete.
