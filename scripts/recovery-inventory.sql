-- Read-only recovery planning metadata. No customer rows, object paths,
-- secret values, root keys, Cron commands, or connection strings are selected.
begin read only;
select
  current_timestamp as checked_at,
  current_setting('server_version') as postgres_version,
  pg_database_size(current_database()) as database_bytes,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from storage.buckets) as storage_buckets,
  (select count(*) from storage.objects) as storage_objects,
  (select coalesce(sum(case when metadata->>'size' ~ '^[0-9]+$'
    then (metadata->>'size')::bigint else 0 end), 0)
    from storage.objects) as recorded_object_bytes,
  (select count(*) from storage.objects
    where metadata->>'size' is null
      or not (metadata->>'size' ~ '^[0-9]+$')) as objects_without_valid_size,
  (select count(*) from cron.job where active) as active_cron_jobs,
  (select count(*) from vault.secrets) as vault_secret_count,
  (select count(*) from information_schema.tables
    where table_schema in ('public', 'private')
      and table_type = 'BASE TABLE') as application_tables,
  (select count(*) from pg_publication) as publications,
  (select jsonb_agg(jsonb_build_object('name', extname, 'version', extversion)
    order by extname) from pg_extension) as extensions;
rollback;
