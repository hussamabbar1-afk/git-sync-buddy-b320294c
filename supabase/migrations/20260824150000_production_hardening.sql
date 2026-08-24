-- Keep auth.uid() in an init plan for bulk inserts instead of recalculating it
-- for every candidate row. The tenant and parent-job checks remain unchanged.

drop policy if exists "Users can create their company's job items" on public.job_items;
create policy "Users can create their company's job items"
on public.job_items
for insert
to authenticated
with check (
  company_id = (
    select p.company_id
    from public.profiles p
    where p.id = (select auth.uid())
  )
  and exists (
    select 1
    from public.jobs j
    where j.id = job_items.job_id
      and j.company_id = (
        select p.company_id
        from public.profiles p
        where p.id = (select auth.uid())
      )
  )
);
