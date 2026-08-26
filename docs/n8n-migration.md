# n8n migration runbook

## Scope

The four production workflows were exported on 2026-08-26 and stored under the git-ignored
`.private/n8n-export/2026-08-26/` directory:

- Main chat orchestration (`uNXmqzTO9kAuVvXU`)
- Appointment cancellation (`KM4fjUvJcmKASulm`)
- Appointment rescheduling (`Uh0o28YPDYee4q7J`)
- Appointment booking (`qnD9wguR4xUSUhAT`)

## Replacement

`supabase/functions/chat-orchestrator/` replaces the n8n webhook and modules with one public Edge
Function protected by `consume_widget_request`. Business mutations remain deterministic and use the
existing service-role-only atomic RPCs:

- `create_appointment_if_available`
- `reschedule_appointment_if_available`
- `cancel_appointment_atomic`
- `add_to_waitlist_backend`
- `finalize_assistant_delivery`

The OpenAI Responses API is used only for structured language understanding, general customer
replies, and non-German localization. It is not allowed to create appointment IDs, mutate rows, or
override slot checks.

## Cutover gates

- [x] Export and inventory every active n8n workflow
- [x] Implement and type-check the Edge Function
- [x] Unit-test date/time, service resolution, appointment targeting, and emergency detection
- [x] Deploy an isolated `chat-orchestrator` endpoint
- [x] Verify health and fail-closed widget security
- [ ] Store `OPENAI_API_KEY` in Supabase Edge Function secrets
- [ ] Run German and multilingual end-to-end chat tests
- [ ] Run booking, cancellation, rescheduling, waitlist, and emergency scenarios
- [ ] Deploy the frontend endpoint switch
- [ ] Observe production logs and compare database results
- [ ] Archive n8n only after the rollback window

## Rollback

Until final verification, n8n remains published. A frontend rollback only requires restoring the old
chat endpoint; no database rollback is needed because both implementations use the same schema.
