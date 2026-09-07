import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

for (const name of ["chat-transcript", "reverse-geocode", "staff-chat-reply"]) {
  const entry = new URL(`../supabase/functions/${name}/index.ts`, import.meta.url);
  const source = (await readFile(entry, "utf8"))
    .replace(
      'import { withSupabase } from "npm:@supabase/server@^1";',
      "const withSupabase = (_options, handler) => handler;",
    )
    .replace('"./address.ts"', JSON.stringify(new URL("./address.ts", entry).href));
  const { default: endpoint } = await import(
    `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`
  );
  Deno.test(`${name}: invalid JSON shapes return 400 before accessing the database`, async () => {
    for (const body of ["null", "[]", "42", '"hello"', "{bad"]) {
      const response = await endpoint.fetch(
        new Request("https://test.invalid", {
          method: "POST",
          headers: { origin: "https://zunftecho.de", "content-type": "application/json" },
          body,
        }),
        {},
      );
      assert.equal(response.status, 400, body);
    }
  });
}
