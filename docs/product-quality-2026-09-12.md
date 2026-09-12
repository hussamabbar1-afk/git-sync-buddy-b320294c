# Chat product-quality checkpoint — 12 September 2026

This checkpoint implements the narrow task recorded in
`zunftecho-product-quality-addendum-2026-09-12.md`. It does not reopen the product roadmap or change
the existing booking, safety, billing, tenant-isolation or growth decisions.

## Mobile widget

The public `/widget` route and the authenticated settings Testchat both render the shared
`ChatWidget` component. At a 320×568 viewport the three permanent secondary controls occupied three
rows and materially reduced the visible conversation area.

The shared component now keeps the conversation and composer dominant:

- below the `sm` breakpoint, one labelled `+` control opens a three-item action group for location,
  manual address and photo upload;
- the action group closes when an action is selected, while the existing address editor and upload
  flow remain unchanged;
- at tablet and desktop widths the existing full text toolbar remains visible;
- the footer accounts for `safe-area-inset-bottom`, and the disclosure exposes `aria-expanded`,
  `aria-controls`, a group label and minimum 44px touch targets.

Browser inspection covered 320×568, 390×844, 430×932, 768×1024 and 1280×800. The small-phone
composer and action menu were visible without overlap; the tablet/desktop layout had no horizontal
overflow (`body.scrollWidth === innerWidth`). Manual-address disclosure/close and responsive toolbar
switching were exercised. Actual iPhone Safari, a physical Android keyboard, browser permission
acceptance and a real photo upload remain real-device acceptance items; Chromium viewport emulation
is not evidence for those device-specific behaviours. The shared implementation means the fix also
applies to Testchat, but authenticated post-deployment visual acceptance remains required.

## Production chat path and measured bottleneck

The active path is frontend `sendChatMessage` → Supabase `chat-orchestrator` → widget gate and
company/conversation resolution → parallel context/input persistence → history, lead, knowledge and
terminology reads → deterministic safety/photo guards or one structured OpenAI Responses call →
deterministic action processing → optional localization call → persistence → one buffered JSON
response. n8n is not involved.

Recent production telemetry before the change contained three successful general requests:

- total server time: median 13,803ms (11,162–16,933ms);
- analysis call: median 13,030ms, approximately 94% of total time;
- gate/context/input/history/action/reply-persistence combined remained below about one second;
- analysis usage averaged 2,523 input and 746 output tokens; reasoning output was 320 tokens in each
  sample.

Four isolated v19 client baselines were 7,597ms, 6,418ms, 10,421ms and 14,409ms for general German,
German booking, a German detail-rich request and general English respectively. These are small
synthetic samples, not production percentiles.

## Isolated canary

`chat-orchestrator-canary` v1 was deployed against a synthetic company only. It keeps
`gpt-5-mini`, the strict JSON schema, all deterministic booking/safety code and the same database
path, while applying the following bounded changes:

- reasoning effort `low` → `minimal`;
- response verbosity `low`;
- analysis output ceiling 2,500 → 1,400 tokens;
- explicit instruction that contact/address/problem/urgency alone is not an appointment request;
- normal informational reply limited to usually two short sentences.

The same four scenarios returned in 7,717ms, 5,569ms, 6,433ms and 8,064ms. Their median changed from
9,009ms to 7,075ms (about 21% lower); the three German scenarios' median changed from 7,597ms to
6,433ms (about 15% lower). This comparison is directional because the sample is small and was not a
simultaneous A/B test.

Seven additional canary cases covered acute gas danger, explicit human handoff, unsupported service,
cancellation without an appointment, prompt injection, the existing photo fast path and a
detail-rich English request. All returned customer-safe text, preserved language and extraction,
did not invent appointments or identifiers, and kept deterministic danger/photo behaviour. The
detail-rich cases correctly extracted synthetic name, email, postal code, issue and urgency without
creating an appointment request.

The first production gate then exposed a stochastic failure that the initial canary sample had not:
one detail-rich English first message was presented as an unavailable appointment although the user
had not requested one. v20 was therefore rejected immediately and the previous v19 behaviour was
redeployed as v21 before any frontend rollout. Only synthetic QA traffic reached v20.

The follow-up fix adds a deterministic first-turn guard: model output cannot enter the booking path
without an explicit appointment/booking/visit signal in the current message. It does not apply to
existing conversation history and recognises the ten customer languages available in product
settings. Canary v2 repeated the failing English input five times and the German equivalent twice;
all seven remained outside the booking path, left pending appointment fields empty and created zero
appointments. Separate explicit English and German booking requests still entered the booking path.

Raw Responses streaming is deliberately not added. The current model output is strict structured
JSON and is followed by deterministic booking, handoff, safety and localization decisions; streaming
that opaque JSON would not provide a safe useful customer response. A split response/extraction
architecture would add consistency and call-count risks and is not justified by the current evidence.

## Verification and rollout gate

The repository contains regressions for the validated AI request budget, prompt guard, multilingual
explicit-signal classifier and deterministic runtime override. Edge/runtime tests pass 60/60, ESLint
passes and the production build succeeds. The first implementation commit passed GitHub Quality but
its v20 production gate was rejected as described above. The deterministic guard now requires its own
pushed GitHub Quality result before Edge redeployment, followed by health and repeated synthetic
checks, a staged frontend Worker preview/smoke, authenticated Testchat acceptance where available,
cleanup of the isolated QA records and final source-of-truth update.
