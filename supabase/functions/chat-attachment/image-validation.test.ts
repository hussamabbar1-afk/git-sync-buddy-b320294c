import { matchesImageSignature, safeImageName } from "./image-validation.ts";

Deno.test("accepts only matching image signatures", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  if (!matchesImageSignature(jpeg, "image/jpeg")) throw new Error("jpeg rejected");
  if (matchesImageSignature(jpeg, "image/png")) throw new Error("spoofed png accepted");
  if (matchesImageSignature(new TextEncoder().encode("not an image"), "image/webp")) {
    throw new Error("text accepted as webp");
  }
});

Deno.test("sanitizes uploaded image names", () => {
  const name = safeImageName("../bad\\name\u0000.jpg", "jpg");
  if (name !== "..-bad-name-.jpg") throw new Error(name);
});
