# GEO — actual answer-engine baseline, 16 September 2026

Measured 17:15–17:28 Europe/Berlin in Perplexity Search, anonymous Chrome session,
German queries, UI model label `Best` (underlying model not disclosed). Six separate
conversations, one response each, no ZunftEcho name or URL in prompts. Cookie choice:
necessary only. Optional login offers dismissed; no account created, paid search, or
quota circumvention. This is a one-engine qualitative baseline, NOT a universal AI
visibility score. ChatGPT/Gemini/Google AI Overviews remain unmeasured.

**Observed: ZunftEcho mentioned 0/6; cited 0/6.** Source panels also contained no
ZunftEcho. Retrieved sources are not all necessarily inline citations. Prices,
legal assurances, recommendations and customer-outcome claims in AI answers were
not adopted as verified facts. In particular, G2 incorrectly suggests ordinary
website forms lack round-the-clock availability.

## Reproducible prompts and results

| Test | Exact prompt | Response and observed output |
| --- | --- | --- |
| G1 | Welche KI-Lösungen eignen sich für einen kleinen SHK-Betrieb in Deutschland mit 1–10 Mitarbeitenden? Nenne konkrete Anbieter, sinnvolle Einsatzbereiche und Quellen. | [Response](https://www.perplexity.ai/search/3f603e78-a877-4fdd-b25e-585405b3c351). Mostly use-case lists rather than a concrete vendor shortlist; ChatGPT mentioned. SHK guides, vendor explainers and tool lists surfaced. |
| G2 | Welche Lösungen gibt es für die digitale Anfrageaufnahme in kleinen SHK-Betrieben in Deutschland? Vergleiche Website-Formular, Website-Chatbot und Telefonassistent anhand konkreter Anbieter und Quellen. | [Response](https://www.perplexity.ai/search/0a041ba5-e772-4d4f-b36f-5d1e41055463). Website form / chatbot / telephone categories. Fachagent is the direct website-chat competitor; VITAS, CallOne, Voicio and smao appear in telephone discussion. Cloudwebdevs and Fachagent explicitly linked inline. |
| G3 | Wie können kleine Handwerksbetriebe Website-Anfragen vollständig erfassen und an das Büro übergeben? Welche konkreten Tools eignen sich dafür? Bitte mit Quellen. | [Response](https://www.perplexity.ai/search/3ca9e369-0b4b-4fec-ad1f-6d87b953ac28). Workflow, fields and comparison table; Jotform, Microsoft Forms/Power Automate, Google Forms/Sheets/Make, HubSpot, AuftragsPilot. Product documentation and templates, not just editorial comparisons. |
| G4 | Welche KI-Chatbots eignen sich für kleine Handwerksbetriebe in Deutschland, um Website-Anfragen strukturiert aufzunehmen? Nenne Anbieter, Grenzen und Quellen. | [Response](https://www.perplexity.ai/search/74808c3c-bc74-41bb-82ff-0bf012b7e38f). Comparison table: Lime Connect/Userlike, Tidio/Lyro, moinAI, HubSpot, Botpress, Siteware. Features, limitations, costs and human handoff. Vendor help pages and vertical landing pages surfaced. |
| G5 | Wie kann ein kleiner Handwerksbetrieb in Deutschland Kundenanfragen automatisieren, ohne Preise oder Termine ungeprüft zuzusagen? Nenne konkrete Software und belegbare Quellen. | [Response](https://www.perplexity.ai/search/4d390e5c-b115-4882-9f4c-aa4f362edf92). HERO, ToolTime, Odoo, Make, n8n, Power Automate, Microsoft Bookings, Cal.com, Calendly. Human release workflow and request-versus-confirmation states. n8n here is a competitor-answer observation, NOT part of ZunftEcho production. |
| G6 | Welche Software für Termin- und Anfrageaufnahme eignet sich für SHK-Betriebe mit 1–10 Mitarbeitenden in Deutschland? Unterscheide unverbindliche Terminwünsche von verbindlichen Buchungen und nenne Anbieter mit Quellen. | [Response](https://www.perplexity.ai/search/f94c2a31-d3f0-498c-aabe-4941dd154d93). Tables separate booking tools (eTermin, cituro, meetergo, Terminland, Zeeg) from handwork software (HERO, Plancraft, ToolTime, Meisterwerk, TAIFUN, openHandwerk). Vendor comparisons and specialist buying guides surfaced. |

## Source map (representative observed URLs)

- G1: [KI Bau Handwerk](https://ki-bau-handwerk.de/ki-fuer-shk/),
  [ProvenAI](https://provenai.de/ki-im-shk-handwerk/),
  [Streit](https://www.streit-software.de/wissen/ki-handwerk),
  [Softwarelotsen](https://www.softwarelotsen.de/ki-loesungen/deutschland/).
- G2: [Fachagent SHK](https://fachagent.com/branchen/handwerk/shk),
  [Cloudwebdevs](https://www.cloudwebdevs.de/news/shk-betrieb-kunden-digital-erreichen/),
  [VITAS](https://www.telefonassistent.de/),
  [OMR call-assistant category](https://omr.com/de/reviews/category/ai-call-assistant).
- G3: [Jotform CRM](https://www.jotform.com/de/features/crm-forms/),
  [Jotform notifications](https://www.jotform.com/de/help/954-e-mail-benachrichtigungen-einrichten/),
  [Microsoft Forms workflow](https://support.microsoft.com/en-us/forms/create-an-automated-workflow-for-microsoft-forms),
  [Make template](https://www.make.com/en/templates/5897-add-webhook-data-to-a-google-sheet-and-send-email-notifications).
- G4: [Tidio setup](https://help.tidio.com/hc/en-us/articles/15607494952604-Lyro-a-quick-setup),
  [moinAI](https://www.moin.ai/en/product/chatbot),
  [Siteware Handwerker](https://siteware.io/handwerker/),
  [HubSpot customer agent](https://www.hubspot.com/products/artificial-intelligence/ai-customer-service-agent).
- G5: [HERO workflow](https://hero-software.de/features/auftragsabwicklung),
  [ToolTime](https://www.tooltime.app/),
  [Handwerk Magazin](https://www.handwerk-magazin.de/tooltime-alles-buerokratische-unkompliziert-abwickeln-183637/).
- G6: [Systemhaus](https://systemhaus.com/terminplanung-software),
  [STARK](https://www.stark.marketing/online-terminbuchungs-tools/),
  [Meetergo](https://meetergo.com/blog/terminplanungssoftware),
  [Betriebssoftware Kompass SHK](https://betriebssoftware-kompass.de/gewerke/shk).

## Concrete intervention, not generic content production

1. Existing `/kontaktformular-oder-chatbot`: add answer-first category definition,
   explicit ZunftEcho scope (website, not telephone/ERP), provider-interest disclosure,
   four-category decision comparison, a verified manufacturer source for form-to-CRM
   capability, and two buyer FAQs. No invented integrations, prices or superiority claims.
2. Existing `/shk-anfragen-automatisieren`: add a clearly fictional worked maintenance
   request with missing fields, office handoff and unconfirmed appointment status;
   link existing comparison/checklist. It is an original teaching example, NOT case-study
   proof or measured customer evidence.
3. Preserve all CTA URLs, source identifiers, product/backend behavior and active
   Shorts/direct-mail experiments. DateModified becomes 2026-09-16. No extra page count,
   hidden AI instructions, fabricated reviews, llms.txt promise or repeated indexing request.
4. Third-party inclusion opportunities must pass audience/editorial/fee/rights gates.
   Existing Haustec conversation stays WAITING; don't repeat it. An AI citation of a
   site is not a quality endorsement or permission for a promotional email.

Status: **PUBLISHED AND VERIFIED**, 16 September2026 ~17:50 Europe/Berlin.
TypeScript, targeted ESLint, build and diff checks passed. Version-preview smoke and
production smoke both passed all16 checks; desktop visual QA and390px mobile QA
passed (no horizontal overflow on either route). Production GETs confirmed HTTP200,
new copy, dateModified, canonical URLs and unchanged source identifiers on both pages.
Cloudflare version `c709743f-ca4e-46de-93de-c579ff1ca35b` at100%, keep-vars;
previous version `ab165970-ad5b-4eb2-ba1a-3c24e39fb313` retained for rollback.
No new indexing request, tracking change, product/backend change or impact claim.
After verified publication, repeat the SAME six prompts only after changed crawl/index
evidence or a meaningful evaluation interval. Do not query repeatedly until a favorable
answer appears. Track mentions, inline citations, source-panel inclusion, landing traffic,
qualified conversations and pilots separately; no impact claim yet.
