import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  // Keep Cloudflare builds reproducible and avoid a local date being ahead of UTC.
  compatibilityDate: "2026-08-26",
});
