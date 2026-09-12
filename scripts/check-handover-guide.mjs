import assert from "node:assert/strict";

// Read-only HTTP checks. This does not submit forms or create test conversations.
const base = process.argv[2] ?? "http://127.0.0.1:8790";
const versionId = process.argv[3];
const route = "/shk-chatbot-menschliche-uebergabe";
const source = "seo-shk-uebergabe";
const canonical = `https://zunftecho.de${route}`;
const page = await get(route);
const article = page.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];
assert.ok(article, "Article body exists");
assert.equal((page.match(/<h1\b/g) ?? []).length, 1, "One H1");
assert.ok(page.includes(`rel="canonical" href="${canonical}"`), "Canonical URL");
for (let index = 1; index <= 6; index++) {
  assert.ok(article.includes(`Test ${index}:`), `Acceptance case ${index}`);
}
assert.equal((article.match(/Bestanden, wenn:/g) ?? []).length, 6);
assert.equal((article.match(/Nicht bestanden:/g) ?? []).length, 6);
assert.ok(!article.includes("**"), "No raw Markdown formatting artifacts");
assert.ok(article.includes("keine Produktionsdaten"), "Demo does not write production data");
assert.ok(article.includes("schreibt keine"), "Demo is not a delivery proof");
assert.ok(article.includes("nicht auf eine Chatantwort"), "Emergency does not wait for handover");
assert.ok(
  article.includes(
    'href="https://www.dvgw.de/themen/gas/verbraucherinformationen/was-tun-bei-gasgeruch"',
  ),
);
assert.ok(article.includes(`href="/demo?source=${source}"`));
assert.ok(article.includes(`href="/website-anfragen-handwerk-checkliste?source=${source}"`));

const structured = [
  ...page.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
]
  .map((match) => JSON.parse(match[1]))
  .flatMap((value) => value["@graph"] ?? [value]);
const articleSchema = structured.find((item) => item["@type"] === "Article");
assert.equal(articleSchema?.mainEntityOfPage, canonical);
assert.equal(articleSchema?.datePublished, "2026-09-13");
assert.equal(articleSchema?.dateModified, "2026-09-13");
const faqSchema = structured.find((item) => item["@type"] === "FAQPage");
assert.equal(faqSchema?.mainEntity.length, 4);
const visibleText = decode(article.replace(/<[^>]+>/g, " "));
for (const item of faqSchema.mainEntity) {
  assert.ok(visibleText.includes(decode(item.name)), "FAQ question is visible");
  assert.ok(
    visibleText.includes(decode(item.acceptedAnswer.text)),
    "FAQ answer matches visible text",
  );
}

assert.ok(
  (await get("/wissen")).includes(`href="${route}?source=wissen-hub"`),
  "Knowledge hub links to guide with its existing source",
);
assert.ok(
  (await get("/sitemap.xml"))
    .replace(/\r\n/g, "\n")
    .includes(`<loc>${canonical}</loc>\n    <lastmod>2026-09-13</lastmod>`),
  "Sitemap has the actual release date",
);
for (const existing of [
  "/shk-anfragen-automatisieren",
  "/chatbot-fuer-handwerksbetriebe",
  "/website-anfragen-handwerk-checkliste",
]) {
  const html = await get(existing);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `Existing article ${existing}`);
  assert.ok(html.includes("Häufige Fragen"), "Existing FAQ remains");
  assert.ok(
    !html.includes("was-tun-bei-gasgeruch"),
    "Reference links do not leak to previous articles",
  );
}
console.log(
  "PASS handover guide: six cases, references, canonical, four matching FAQs, source links, hub, sitemap and three existing articles.",
);

async function get(path) {
  const response = await fetch(new URL(path, base), {
    headers: {
      "user-agent": "ZunftEcho-Handover-Smoke/1.0",
      ...(versionId
        ? {
            "Cloudflare-Workers-Version-Overrides": `hussamabbar1-afk-git-sync-buddy-b320294c="${versionId}"`,
          }
        : {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.status, 200, `${path} HTTP 200`);
  return response.text();
}

function decode(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
