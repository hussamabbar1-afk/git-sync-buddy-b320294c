import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const entry = new URL("../supabase/functions/chat-attachment/index.ts", import.meta.url);
const source = (await readFile(entry, "utf8"))
  .replace(
    'import { withSupabase } from "npm:@supabase/server@^1";',
    "const withSupabase = (_options, handler) => handler;",
  )
  .replace('"./image-validation.ts"', JSON.stringify(new URL("./image-validation.ts", entry).href));
const { default: endpoint } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`
);
const company = "11111111-1111-4111-8111-111111111111";
const lead = "22222222-2222-4222-8222-222222222222";

async function upload(insertError = null) {
  const recorded = { paths: [], removed: [] };
  const db = {
    from(table) {
      let inserted = false;
      const chain = {
        select() {
          return chain;
        },
        eq() {
          return chain;
        },
        order() {
          return chain;
        },
        limit() {
          return chain;
        },
        maybeSingle: async () => ({
          data:
            table === "ai_agents"
              ? { company_id: company }
              : table === "conversations"
                ? { id: company, company_id: company }
                : { id: lead },
        }),
        insert(row) {
          inserted = true;
          recorded.row = row;
          return chain;
        },
        single: async () => ({
          data: inserted && !insertError ? { id: lead } : null,
          error: insertError,
        }),
        then(resolve) {
          resolve({ count: recorded.row && !insertError ? 1 : 0 });
        },
      };
      return chain;
    },
    storage: {
      from: () => ({
        upload: async (path) => {
          recorded.paths.push(path);
          return { error: null };
        },
        remove: async (paths) => {
          recorded.removed.push(...paths);
          return { error: null };
        },
      }),
    },
  };
  const form = new FormData();
  form.set("widget_key", company);
  form.set("conversation_id", company);
  form.set(
    "file",
    new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "qa.png", { type: "image/png" }),
  );
  const result = await endpoint.fetch(
    new Request("https://test.invalid", {
      method: "POST",
      headers: { origin: "https://zunftecho.de" },
      body: form,
    }),
    { supabaseAdmin: db },
  );
  return { result, body: await result.json(), recorded };
}

Deno.test("chat photo uses the database's singular lead storage prefix", async () => {
  const { result, body, recorded } = await upload();
  assert.equal(result.status, 200);
  assert.equal(body.remaining, 2);
  assert.ok(recorded.paths[0].startsWith(`${company}/lead/${lead}/chat-`));
  assert.equal(recorded.row.storage_path, recorded.paths[0]);
});

Deno.test(
  "concurrent photo limit returns a safe conflict and removes the rejected object",
  async () => {
    const { result, body, recorded } = await upload({ message: "chat_image_limit_reached" });
    assert.equal(result.status, 409);
    assert.equal(body.code, "image_limit_reached");
    assert.deepEqual(recorded.removed, recorded.paths);
  },
);

Deno.test(
  "failed photo metadata insert removes its uploaded object without exposing database errors",
  async () => {
    const { result, body, recorded } = await upload({ message: "internal constraint detail" });
    assert.equal(result.status, 500);
    assert.equal(body.code, "upload_failed");
    assert.deepEqual(recorded.removed, recorded.paths);
  },
);
