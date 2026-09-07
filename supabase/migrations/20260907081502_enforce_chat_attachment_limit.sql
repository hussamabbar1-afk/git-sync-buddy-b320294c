-- Version matches the migration recorded by the production migration API.
-- Serialize website photo inserts for one lead. An HTTP count-before-insert alone
-- can exceed the three-photo limit when requests arrive concurrently.
create or replace function private.enforce_chat_attachment_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.entity_type = 'lead'
     and new.description = 'Optionales Kundenfoto aus dem Website-Chat' then
    perform 1 from public.leads
      where id = new.entity_id and company_id = new.company_id
      for update;
    if (select count(*) from public.attachments
        where entity_type = 'lead' and entity_id = new.entity_id
          and company_id = new.company_id and id <> new.id) >= 3 then
      raise exception 'chat_image_limit_reached' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_chat_attachment_limit() from public, anon, authenticated;
create trigger trg_chat_attachment_limit
before insert on public.attachments
for each row execute function private.enforce_chat_attachment_limit();
