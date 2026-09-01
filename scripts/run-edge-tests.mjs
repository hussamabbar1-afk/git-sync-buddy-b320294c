import { pathToFileURL } from "node:url";

const testFiles = [
  "supabase/functions/reverse-geocode/address.test.ts",
  "supabase/functions/chat-attachment/image-validation.test.ts",
  "supabase/functions/chat-orchestrator/orchestrator.test.ts",
  "supabase/functions/stripe-webhook/stripe-webhook.test.ts",
  "supabase/functions/send-business-document/pdf.smoke.test.ts",
];

const tests = [];

globalThis.Deno = {
  test(name, fn) {
    tests.push({ name, fn });
  },
};

for (const file of testFiles) {
  await import(pathToFileURL(`${process.cwd()}/${file}`).href);
}

let failed = 0;

for (const test of tests) {
  try {
    await test.fn();
    console.log(`PASS  ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${test.name}`);
    console.error(error);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} tests passed.`);

if (failed > 0) process.exitCode = 1;
