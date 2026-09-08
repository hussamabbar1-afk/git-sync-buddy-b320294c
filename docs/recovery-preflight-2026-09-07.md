# Recovery preflight — 7 September 2026

Status: **inventory completed; backup/export/restore NOT completed**.
Historical preflight status: the subsequent USB export and archive verification are
documented in `usb-backup-2026-09-08.md`; full isolated restoration is still outstanding.
Production code, permissions, credentials, billing and service plans were not changed.
Started from clean `ac9c335`, matching fetched `origin/main`.

## Live read-only findings

| Item | Observed |
| --- | --- |
| Backup inventory, 18:50 UTC | 0 available entries; PITR off; WAL-G enabled |
| PostgreSQL | 17.6 |
| Database allocated size | 47,189,139 bytes (not an estimated compressed dump size) |
| Application tables in public/private | 70 |
| Auth users | 9; no identities, passwords or sessions exported |
| Storage | 1 bucket, 0 objects at inspection time |
| Vault | 2 secret records; no values or root key retrieved |
| Cron | 19 active jobs; commands not exported |
| Publications | 2 |

Installed extensions: btree_gist1.7, pg_cron1.6.4, pg_net0.20.4,
pg_stat_statements1.11, pg_trgm1.6, pgcrypto1.3, plpgsql1.0,
supabase_vault0.3.1, uuid-ossp1.1. These are observations, not instructions to
force extension versions; current hosted Supabase chooses supported defaults.

`scripts/recovery-inventory.sql` repeats the aggregate inventory in a read-only
transaction. It does not create an archive or prove that any data is recoverable.
Counts are a point-in-time planning baseline, not a consistent backup snapshot.

## Local prerequisites

- Docker Desktop CLI exists, but its Linux engine pipe was unavailable. No existing
  container was stopped, reset or removed; Docker was not started during this preflight.
- Native `pg_dump`, `psql` and a global Supabase CLI were not found on PATH.
- Supabase CLI2.117.0 was run via pinned `npx` for `--help`, `db --help`,
  `db dump --help` and `encryption --help`; no application dependency changed.
- The existing Management API credential can read backup inventory. A working native
  database dump connection has **not** been established; API access alone does not prove it.
- No root key retrieval, database-password reset, paid project, plan upgrade or export
  was performed. CLI debug/dry-run output can contain credentials: do not capture it in logs.

## Recovery design and next execution gate

The owner must identify an existing owner-controlled backup destination and separate
recovery-key custody before sensitive data is exported. Do not choose an unrelated cloud
account, store the only key alongside the archive, or treat Git/the same laptop as off-site
backup. An encrypted external drive kept separately can be a destination; a cloud location
requires an explicitly selected account and appropriate privacy/access review.

After that decision:

1. Establish a restricted encrypted staging location and a tested encryption/decryption
   method. Confirm free disk space and file permissions without exposing keys.
2. Establish the supported dump connection without changing production passwords merely
   for convenience. Use compatible Postgres tooling and a deliberate snapshot strategy;
   multiple independent dumps must not be assumed transactionally consistent.
3. Cover roles, schema, data, migrations, Auth/Storage customizations and service settings.
   Compare actual dump coverage with the inventory, not only file existence. Current
   Storage is empty, but re-inventory at export time and copy any object bytes separately.
4. Resolve Vault recovery explicitly: preserve recoverability under the supported encryption
   procedure or securely re-provision secrets. Do not claim encrypted Vault rows alone suffice.
   Keep operational secrets unavailable to the test runtime until outbound access is blocked.
5. Build an isolated compatible restore target, bound only to loopback and inaccessible to
   public traffic. Disable job execution and outbound network **before importing**; keep
   production SMTP/API/payment credentials out of the running target. A plain PostgreSQL
   restore alone cannot validate Supabase Auth, Storage or tenant isolation end to end.
6. Verify dump hashes, restore failure handling, tables/counts, constraints/RLS, sign-in,
   conversation/Lead/customer/appointment relationships and any private images. Compare
   Vault decryption without printing plaintext. Record actual duration and snapshot age.
7. Verify decryption from the selected separate copy, record retention/deletion policy,
   and only then mark backup readiness complete. Do not announce an RPO/RTO beforehand.

The [official CLI recovery guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
documents separate migration history, Auth/Storage customizations and encryption handling.
[Supabase backup documentation](https://supabase.com/docs/guides/platform/backups)
states that database backups do not contain Storage file bodies. The Supabase skill's
current-documentation and verification requirements informed this preflight; no restore
was attempted on production.
