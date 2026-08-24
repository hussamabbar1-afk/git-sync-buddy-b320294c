import { supabase } from "@/integrations/supabase/client";

export type BusinessDocumentEmailType = "quote" | "invoice";

type DeliveryResponse = {
  ok?: boolean;
  status?: string;
  code?: string;
  message?: string;
  message_id?: string;
  sent_at?: string | null;
};

async function responseMessage(error: unknown): Promise<string | null> {
  const context = (error as { context?: unknown } | null)?.context;
  if (!(context instanceof Response)) return null;

  try {
    const payload = (await context.clone().json()) as DeliveryResponse;
    return typeof payload.message === "string" && payload.message.trim()
      ? payload.message.trim()
      : null;
  } catch {
    return null;
  }
}

export async function sendBusinessDocumentEmail(
  type: BusinessDocumentEmailType,
  id: string,
): Promise<DeliveryResponse> {
  const { data, error } = await supabase.functions.invoke<DeliveryResponse>(
    "send-business-document",
    { body: { type, id } },
  );

  if (error) {
    const message = await responseMessage(error);
    throw new Error(message ?? "Die E-Mail konnte nicht gesendet werden. Bitte erneut versuchen.");
  }

  if (!data?.ok) {
    throw new Error(
      data?.message ?? "Die E-Mail konnte nicht gesendet werden. Bitte erneut versuchen.",
    );
  }

  return data;
}
