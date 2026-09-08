# Isolated recovery rehearsal — 8 September 2026

## Outcome

The encrypted USB database archive was decrypted into a temporary, access-restricted directory and restored into a disposable PostgreSQL 17.11 instance listening only on `127.0.0.1:65432`. The restored application data matched the live read-only inventory exactly. The temporary server was then stopped and the decrypted database and local cluster were removed.

No production database, deployment, provider setting, outbound message, billing setting, or secret value was changed during this rehearsal.

## Inputs and isolation

- Source: `E:/ZunftEcho-Backup-2026-09-08-02/database.dump.age` and `roles.sql.age`.
- The decrypted database archive SHA-256 matched the USB manifest: `C244FCEB2C02B49F13B5EE3E042925F8E7A515C75856629EB7FD1E16B3BD7DEA`.
- The database ran without a Windows service or autostart and accepted connections only on the loopback interface.
- `pg_cron`, `pg_net`, and `supabase_vault` were not installed, so restored jobs could not run and no outbound network activity was enabled.
- The Vault root key was not decrypted or read.

## Verification results

| Check | Result |
| --- | --- |
| Application tables | 70 live / 70 restored |
| Application rows | 1,814 live / 1,814 restored |
| Per-table row-count differences | 0 across all 70 tables |
| RLS policies | 166 live / 166 restored |
| Public tables with RLS enabled | 59 live / 59 restored |
| Constraints | 558 live / 558 restored |
| Unvalidated constraints | 0 live / 0 restored |
| Application triggers | 91 live / 91 restored |
| Auth users | 9 restored |
| Auth identities | 9 restored; 0 orphaned |
| Profiles without an Auth user | 0 |
| Core cross-module relationship mismatches | 0 |
| Orphan messages | 0 |
| `pg_amcheck` heap/index consistency | Passed |
| Stop/start persistence check | Passed; 70 tables, 1,814 rows, 9 Auth users after restart |

The relationship audit covered company consistency across conversations, leads, customers, and appointments. A local RLS acceptance test selected a restored user, assumed the `authenticated` role, and set the request subject claim. The user could see their own company and could neither read nor update a different company's companies, conversations, leads, customers, or appointments. Temporary local grants used to isolate policy behaviour were enclosed in a transaction and rolled back.

## Expected restore exceptions

The pre-data and data phases reported only objects owned by platform extensions unavailable in native PostgreSQL:

- `pg_cron`: its schema, sequences, jobs, and run history were not restored.
- `pg_net`: the extension was not restored.
- `supabase_vault`: the extension relation was not restored.

The local role import also reported expected conflicts around the pre-existing `postgres` role and grants made by Supabase-managed roles. The application schema was therefore restored with `--no-owner --no-privileges`, and RLS policy logic was tested separately. This rehearsal does not prove exact platform-managed object grants.

## What this rehearsal proves

- The encrypted USB database archive is decryptable with the current recovery identity.
- The application schema and data can be restored into PostgreSQL with exact application row coverage.
- The restored constraints, indexes, core relationships, and tenant-isolation policies pass the checks above.
- The restored database persists across a clean local server restart.

## Remaining recovery work

This was a database-level rehearsal, not a complete Supabase platform recovery. The following still require a Supabase-compatible isolated stack or an explicitly authorised temporary project:

- HTTP Auth sign-in/session flows and JWT issuance.
- Exact Supabase-managed roles and object grants.
- Vault extension restoration and decryption with the saved root key.
- Cron and network-extension restoration while keeping jobs disabled until reviewed.
- Edge Function secrets and third-party provider configuration, which are not contained in the database archive.

The recovery identity remains only in `.private/recovery-2026-09-08/identity.txt`, outside Git and protected for the Windows owner and SYSTEM. A second copy must be stored in an owner-controlled password manager or on a different protected device. It must not be placed on the same USB as the encrypted archive.

The temporary plaintext restore directory was deleted after the checks. The encrypted USB archive remains the recovery source.

## Reference

- Supabase guide: <https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore>
