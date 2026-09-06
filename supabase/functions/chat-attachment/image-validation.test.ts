import { matchesImageSignature, safeImageName } from "./image-validation.ts";

Deno.test("accepts only matching image signatures", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  if (!matchesImageSignature(jpeg, "image/jpeg")) throw new Error("jpeg rejected");
  if (matchesImageSignature(jpeg, "image/png")) throw new Error("spoofed png accepted");
  if (matchesImageSignature(new TextEncoder().encode("not an image"), "image/webp")) {
    throw new Error("text accepted as webp");
  }
  const heic = new TextEncoder().encode("\u0000\u0000\u0000\u001cftypheic\u0000\u0000\u0000\u0000");
  if (!matchesImageSignature(heic, "image/heic")) throw new Error("heic rejected");
  if (
    matchesImageSignature(
      new TextEncoder().encode("\u0000\u0000\u0000\u001cftypmp42"),
      "image/heic",
    )
  ) {
    throw new Error("non-image ISO media accepted as heic");
  }
});

Deno.test("sanitizes uploaded image names", () => {
  const name = safeImageName("../bad\\name\u0000.jpg", "jpg");
  if (name !== "..-bad-name-.jpg") throw new Error(name);
});
