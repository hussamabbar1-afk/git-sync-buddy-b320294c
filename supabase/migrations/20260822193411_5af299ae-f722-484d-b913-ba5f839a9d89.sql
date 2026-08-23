GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_items TO authenticated;
GRANT ALL ON public.job_items TO service_role;

DROP POLICY IF EXISTS "Users can create their company's job items" ON public.job_items;
CREATE POLICY "Users can create their company's job items"
ON public.job_items FOR INSERT TO authenticated
WITH CHECK (
  company_id = (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_items.job_id
      AND j.company_id = (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
  )
);