import { supabase } from "@/integrations/supabase/client";

export type CustomerInput = {
  display_name: string;
  phone?: string;
  email?: string;
  address?: string;
  postal_code?: string;
  preferred_language?: string;
};

export type CreatedCustomer = {
  id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  postal_code: string | null;
};

export type CreateCustomerResult =
  | { ok: true; customer: CreatedCustomer }
  | { ok: false; error: string };

/**
 * Legt einen echten Kundenstammsatz in `public.customers` an.
 * Kundennummer wird serverseitig fortlaufend vergeben.
 */
export async function createCustomer(
  companyId: string,
  input: CustomerInput,
): Promise<CreateCustomerResult> {
  const name = input.display_name.trim();
  if (!name) {
    return { ok: false, error: "Bitte einen Kundennamen angeben." };
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      company_id: companyId,
      customer_number: "",
      display_name: name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      postal_code: input.postal_code?.trim() || null,
      preferred_language: input.preferred_language?.trim() || null,
      source: "manual",
    })
    .select("id, display_name, phone, email, address, postal_code")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: "Der Kunde konnte nicht angelegt werden. Bitte Eingaben prüfen und erneut versuchen.",
    };
  }

  return { ok: true, customer: data as CreatedCustomer };
}
