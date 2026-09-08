# Operational verification snapshot — 8 September 2026

This is a read-only operational checkpoint after the isolated recovery rehearsal. It does not deploy code, change Supabase configuration, modify production data, enable billing, or send email.

## Results

| Check | Result |
| --- | --- |
| Live Supabase project | `ACTIVE_HEALTHY`, PostgreSQL 17, `eu-central-1` |
| Public production smoke | Passed: home, demo, registration, pricing, trust, login, legal pages, campaign source preservation, brand checks, and published acquisition page |
| Edge-function test suite | 57/57 passed |
| ESLint | Passed |
| Production build | Passed |
| Git integrity | `git fsck --full --no-dangling` passed |
| Workflow errors in the last 24 hours | 0 |
| Failed Cron runs in the last 24 hours | 0 |
| Storage objects | 0 |

The source build emitted non-blocking Vite chunk-size guidance for some large optional application bundles. The previous measured production result remains the relevant performance baseline (about 1.5 seconds LCP on simulated 4G and about 4.1 seconds on severe 3G). No source changed in this checkpoint, so no performance regression is implied and no speculative code-splitting change was made.

## Supabase advisors

The advisor snapshot has 40 security notices and 37 informational unused-index notices:

- Two `RLS enabled, no policy` notices are the intended service-only tables `public.pilot_requests` and `public.workflow_errors`.
- Six anonymous and 31 authenticated `SECURITY DEFINER` notices correspond to intentionally callable, guarded RPCs. They remain an audit surface, not a blanket grant to relax RLS.
- One `auth_leaked_password_protection` notice remains. This capability is not available on the current Free plan; no plan or billing change was made.
- The 37 unused-index notices are informational only. They should not be removed before real Pilot usage produces a representative workload.

## Remaining gates

1. A real-device iPhone/Safari acceptance pass still requires the owner to exercise the documented checklist on a physical device.
2. A full Supabase-compatible recovery rehearsal still requires an isolated compatible runtime or an explicitly authorised temporary project. It must cover Auth HTTP sign-in, Supabase-managed grants, Vault recovery, disabled Cron/network jobs, and Edge/provider settings. Do not create a paid project or change the production plan implicitly.
3. The DPAPI copy improves local key custody but a separately stored owner-controlled copy is still needed to survive loss of this computer.
4. Monitor organic acquisition, indexing, and first Pilot conversion data through the already configured routines; do not manufacture activity or turn on billing before legal readiness.
