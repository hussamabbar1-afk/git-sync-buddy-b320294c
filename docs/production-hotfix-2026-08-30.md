# ZunftEcho production hotfix — 2026-08-30

## Outcome

The campaign source supplied by a personalized letter is now preserved unchanged
through both registration calls to action on the public demo. The production
deployment passed the complete prelaunch smoke check.

## Scope control

The release was built from the last pre-campaign production baseline and contains
only the demo source-propagation correction. Prepared acquisition pages remain
unpublished until the Gewerbeanmeldung and deliberate campaign approval.

## Verification and rollout

- TypeScript check: passed.
- Production build: passed.
- ESLint: zero errors; ten pre-existing Fast Refresh warnings.
- Isolated local smoke check: passed.
- Cloudflare version: `743b4e53-a7d2-4293-8ab3-c2bf5bcd4fd0`.
- Startup time reported by Cloudflare: 4 ms.
- The new version was first deployed at 0 percent traffic.
- A production-domain smoke check using Cloudflare Version Overrides passed.
- The version was then promoted to 100 percent traffic.
- The same smoke check without an override passed after promotion.

## Production assertions

- `/`, `/demo`, `/registrieren`, `/preise`, `/login`, `/impressum`,
  `/datenschutz` and `/agb` return HTTP 200.
- Both demo calls to action preserve `source=smoke-go-no-go` exactly.
- No `demo-` prefix is introduced into the campaign source.
- Public pages contain the ZunftEcho brand and no legacy HandwerkAI name.
- `/anfrage-check` returns HTTP 404 while the campaign is intentionally held.

## Rollback reference

The immediately preceding production version is
`e1d70e17-aeff-4341-bbef-c088f287bacb`. It remains available in Cloudflare's
version history for an explicit rollback if a later regression is discovered.
