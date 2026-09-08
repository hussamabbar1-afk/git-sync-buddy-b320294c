# Business sender verification — 8 September 2026

## Current checkpoint

- Actual business receiving Gmail account (suffix `4`) is now accessible. The Gmail connector remains a different account; do not use it for project mail.
- Gmail sending account (suffix `55`) has confirmed the alias `ZunftEcho <kontakt@zunftecho.de>` through the received confirmation link. Personal default From and production SMTP credentials are unchanged.
- One internal test, subject `ZunftEcho – Absendertest 08.09.2026`, was sent at 18:33 Berlin time. Gmail displayed sent, but Brevo logs explicitly rejected it because the sender was not valid. **The test was NOT delivered.** Do not treat Gmail Sent as delivery proof.
- Brevo domain authentication was completed after all four record checks passed. The sender list now shows `ZunftEcho <kontakt@zunftecho.de>` as verified, with DKIM on `zunftecho.de` and DMARC configured.
- A new internal test, subject `ZunftEcho – Zustelltest nach Domainprüfung`, arrived in the actual receiving account at 23:38 Berlin time. Gmail message details showed `gz.d.sender-sib.com` as sender infrastructure, `zunftecho.de` as the signing domain and standard TLS. Brevo logged delivery and an open. The rejected 18:33 test remains historical evidence and must not be reclassified.
- Craftboxx and HERO were sent once at 23:39 and Brevo logged both as delivered. A written-only HeWo deferral was sent once from Gmail at 23:39; no Brevo delivery event was visible at the last check, so its delivery remains unverified. Plancraft was sent once at 23:44 and Brevo logged it as delivered. None of these is a customer or partnership win.

## DNS changes and verification

Cloudflare originally had eight records, no DMARC policy and no Brevo selectors. Added only:

| Type | Name | Content / intent |
| --- | --- | --- |
| TXT | apex | Brevo-generated ownership code; exact public value in provider settings |
| CNAME | `brevo1._domainkey` | `b1.zunftecho-de.dkim.brevo.com`, DNS only |
| CNAME | `brevo2._domainkey` | `b2.zunftecho-de.dkim.brevo.com`, DNS only |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:sicherheit@zunftecho.de` |

The non-enforcing DMARC policy avoids disrupting existing mail. Aggregate reports stay with the project's existing security address, not Brevo's suggested third-party reporting address. This is **not** an anti-spoofing enforcement claim. No forensic reporting enabled. Public DNS at 1.1.1.1 confirmed both CNAMEs and final DMARC. Brevo's latest per-record check confirms all four values.

MX, SPF, Cloudflare routing DKIM, Google verification, website Worker records and four forwarding rules were preserved. No branding/tracking subdomain, paid plan, billing activation, integration, or contract was created. Secrets are not stored in Git.

Post-change live prelaunch smoke check passed: public pages reachable, brand checks and campaign-source preservation passed. This is a public-site smoke check, not a full product QA audit. Documentation diff check passed.

Reference: https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC and https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/ .

## Incoming partnership status

- HeWo has sent a genuine reply requiring a video introduction before substantive partnership review. This is not a customer, referral, or partnership agreement. Respect written-only preference: no meeting scheduled. A brief polite deferral is planned but **not sent**.
- No Bauleo reply found in the limited project-specific receiving-mailbox search. Do not claim a complete inbox audit.
- QA Pilot messages are tests, not prospects.

## Resume sequence

1. Monitor the actual business receiving account and Brevo logs for replies, bounces or complaints. Do not resend these inquiries automatically.
2. Answer genuine interest in writing within one business day and ask only missing qualification questions.
3. Preserve the billing and Pilot-activation hold until legal readiness. A send, delivery, open or partner reply is not a won customer.
