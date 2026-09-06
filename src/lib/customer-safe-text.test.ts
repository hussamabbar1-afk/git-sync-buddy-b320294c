import { customerSafeText, isUploadPhotoAction } from "./customer-safe-text.ts";

declare const Deno: { test(name: string, fn: () => void | Promise<void>): void };

Deno.test("hides internal chat actions and identifiers from customers", () => {
  if (!isUploadPhotoAction("upload_photo", "Upload a Photo")) {
    throw new Error("legacy photo action was not recognized");
  }
  if (customerSafeText("__action_upload_photo") !== "") {
    throw new Error("reserved action leaked into chat");
  }
  const safe = customerSafeText(
    "Bitte bestätigen.\nappointment_id: 11111111-1111-4111-8111-111111111111\n[object Object]",
  );
  if (safe !== "Bitte bestätigen.") throw new Error(`technical text leaked: ${safe}`);
});
