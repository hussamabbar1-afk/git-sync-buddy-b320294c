ALTER TABLE public.job_items
  ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) NOT NULL DEFAULT 19.00;

CREATE OR REPLACE FUNCTION public.create_invoice_from_job(p_job_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
declare v_company uuid; v_job public.jobs%rowtype; v_invoice uuid; v_tax numeric(5,2); v_items int; v_fallback bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select company_id into v_company from public.profiles where id=auth.uid();
 select * into v_job from public.jobs where id=p_job_id and company_id=v_company;
 if not found then raise exception 'Job not found'; end if;
 select id into v_invoice from public.invoices where company_id=v_company and job_id=v_job.id limit 1;
 if v_invoice is not null then return v_invoice; end if;
 select default_tax_rate into v_tax from public.companies where id=v_company;
 insert into public.invoices(company_id,job_id,quote_id,lead_id,customer_name,phone,email,address,postal_code,notes)
 values(v_company,v_job.id,v_job.quote_id,v_job.lead_id,v_job.customer_name,v_job.phone,v_job.email,v_job.address,v_job.postal_code,v_job.notes)
 returning id into v_invoice;

 select count(*) into v_items from public.job_items where job_id=v_job.id;

 if v_items > 0 then
   insert into public.invoice_items(invoice_id,company_id,position,description,quantity,unit,unit_price_cents,tax_rate)
   select v_invoice,v_company,ji.position,ji.description,ji.quantity,ji.unit,ji.unit_price_cents,coalesce(ji.tax_rate,v_tax,19.00)
   from public.job_items ji where ji.job_id=v_job.id order by ji.position,ji.id;
 else
   v_fallback := coalesce(v_job.final_value_cents, v_job.estimated_value_cents, 0);
   insert into public.invoice_items(invoice_id,company_id,position,description,quantity,unit,unit_price_cents,tax_rate)
   values(v_invoice,v_company,1,coalesce(nullif(btrim(v_job.title),''),'Auftrag '||coalesce(v_job.job_number,'')),1,'Stk.',v_fallback,coalesce(v_tax,19.00));
 end if;

 return v_invoice;
end $function$;