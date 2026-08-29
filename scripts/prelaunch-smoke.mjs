#!/usr/bin/env node

const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...valueParts] = argument.replace(/^--/, "").split("=");
    return [key, valueParts.join("=") || "true"];
  }),
);

const baseUrl = (args.get("base") ?? "https://zunftecho.de").replace(/\/$/, "");
const marketingState = args.get("marketing") ?? "held";

if (!new Set(["held", "live"]).has(marketingState)) {
  console.error("--marketing must be either held or live");
  process.exit(2);
}

const source = "smoke-go-no-go";
const failures = [];
const responses = new Map();

async function request(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "user-agent": "ZunftEcho-Prelaunch-Smoke/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.text();
  responses.set(path, { response, body });
  return { response, body };
}

function record(label, passed, detail) {
  const symbol = passed ? "PASS" : "FAIL";
  console.log(`${symbol.padEnd(4)}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures.push(label);
}

const publicRoutes = [
  "/",
  `/demo?source=${source}`,
  `/registrieren?source=${source}`,
  "/preise",
  "/login",
  "/impressum",
  "/datenschutz",
  "/agb",
];

console.log(`ZunftEcho prelaunch smoke check: ${baseUrl}`);
console.log(`Marketing state: ${marketingState}\n`);

for (const path of publicRoutes) {
  try {
    const { response } = await request(path);
    record(`${path} is reachable`, response.status === 200, `HTTP ${response.status}`);
  } catch (error) {
    record(`${path} is reachable`, false, error instanceof Error ? error.message : String(error));
  }
}

const demo = responses.get(`/demo?source=${source}`)?.body ?? "";
const exactRegistrationLink = `/registrieren?source=${source}`;
const prefixedRegistrationLink = `/registrieren?source=demo-${source}`;
const exactLinkCount = demo.split(exactRegistrationLink).length - 1;

record(
  "demo preserves the campaign source on both registration CTAs",
  exactLinkCount >= 2,
  `${exactLinkCount} matching links`,
);
record(
  "demo does not rewrite the campaign source",
  !demo.includes(prefixedRegistrationLink),
  prefixedRegistrationLink,
);

const publicCopy = [...responses.values()].map(({ body }) => body).join("\n");
record("public pages contain the ZunftEcho brand", publicCopy.includes("ZunftEcho"));
record("public pages contain no legacy HandwerkAI name", !publicCopy.includes("HandwerkAI"));

try {
  const { response, body } = await request("/anfrage-check");
  if (marketingState === "held") {
    record(
      "acquisition campaign remains unpublished",
      response.status === 404,
      `HTTP ${response.status}`,
    );
  } else {
    record(
      "acquisition campaign is published",
      response.status === 200 && body.includes("Website-Anfrage-Check"),
      `HTTP ${response.status}`,
    );
  }
} catch (error) {
  record(
    marketingState === "held"
      ? "acquisition campaign remains unpublished"
      : "acquisition campaign is published",
    false,
    error instanceof Error ? error.message : String(error),
  );
}

console.log();
if (failures.length > 0) {
  console.error(`Go/No-Go smoke check failed: ${failures.length} check(s).`);
  process.exit(1);
}

console.log("Go/No-Go smoke check passed.");
