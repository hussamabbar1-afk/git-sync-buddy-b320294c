# Encrypted USB export — 8 September 2026

**Export and archive verification completed. Full isolated restoration remains untested.**

User selected their connected USB drive. Windows identified one removable NTFS volume,
`E:`, SanDisk USB, approximately61GB free. Only a new ZunftEcho folder was created;
existing user files were neither edited nor executed. No formatting or production restore.

## Delivered

Folder: `E:/ZunftEcho-Backup-2026-09-08-02/`.
Five encrypted files total9,359,872 bytes:

- `database.dump.age`: native PostgreSQL custom-format schema/data archive.
- `roles.sql.age`: roles, deliberately without login password hashes.
- `vault-root-key.txt.age`: encrypted root-key export for Vault recovery.
- `source.tar.age`: tracked source at `5a25483`.
- `history.bundle.age`: complete local Git history, verified with `git bundle verify`.

The folder also contains a recovery README, machine-readable SHA-256 manifest and a
copy of the age Windows executable. It is a database/source backup, not a full machine,
external media/document archive or provider-account configuration backup. Platform/Edge
environment secret values and external provider settings still require separate provisioning.

## Method and validation

Docker could not start: WSL is not installed. No WSL installation or reboot was attempted.
The native Windows PostgreSQL17.11 binaries were downloaded from the EDB package linked
by the [official PostgreSQL Windows page](https://www.postgresql.org/download/windows/).
Supabase CLI2.117.0 established a temporary login; its dry-run connection details were
captured in process memory, never printed or saved. Native pg_dump uses `--role=postgres`,
matching the official CLI-generated command. No grants, passwords or schema were changed.

The first attempt omitted that role, failed on Auth schema permissions, and left a200-byte
incomplete encrypted artifact. The exact failed file and its empty new folder were removed;
no recoverable data was in it. The second attempt succeeded. PostgreSQL generated a single
custom archive for schema/data; supplementary roles, key and Git exports are separate.

age1.3.2 was fetched from the [official release](https://github.com/FiloSottile/age/releases/tag/v1.3.2).
The Windows archive SHA-256 matched the release API digest:
`f48d8f8f9ebe903ab5027ed067652f2cc1db94bc206976430133b905dcd8e8c7`.
Database and secret output streamed directly into encryption, with no plaintext database
or Vault-key export on disk. Ciphertext is on the USB; the decryption identity remains in
the local Git-ignored `.private/recovery-2026-09-08/identity.txt`.
Windows ACL was checked: only the current owner and SYSTEM have access. age's Unix-mode
world-readable warning was checked against the actual Windows ACL, not ignored blindly.

All five files were decrypted from the USB into an in-memory hash sink and matched the
original byte-stream hashes. All ciphertext SHA-256 values matched. `pg_restore --file=-`
fully decoded the custom archive without a database connection, discarding SQL after
counting COPY blocks. The archive contains114 table-data blocks, including all70 application
tables,9 Auth users,2 Vault secrets, and0 Storage objects. Root-key material is present.
The encrypted Git history was independently hash-verified after decryption.

This is stronger than checking file existence, but is **not** a successful running restore
or an Auth/RLS/application acceptance test. The snapshot contains operational data/jobs;
never execute it on a publicly reachable or outbound-enabled test instance.

## Required owner action and remaining gates

Keep a separate secure copy of `identity.txt` (e.g. an owner-controlled password manager
or a different protected device). Do not place it on this USB or send its contents in chat.
Until then, key recovery depends on this computer. Losing it makes the USB unreadable.
Safely eject and store the USB separately; no automatic recurring USB backup was created.

Next: provision an isolated compatible Supabase runtime, block outbound access and job
execution before import, restore and verify Auth, tenant separation, relationships and Vault
decryption without revealing values. Re-provision missing provider settings separately.
No production RPO/RTO or full recovery guarantee is claimed. Billing remains disabled;
chat-orchestrator v19 and the existing Worker are unchanged.
