# Business sender verification — 8 September 2026

## Current checkpoint

- Actual business receiving Gmail account (suffix `4`) is now accessible. The Gmail connector remains a different account; do not use it for project mail.
- Gmail sending account (suffix `55`) has confirmed the alias `ZunftEcho <kontakt@zunftecho.de>` through the received confirmation link. Personal default From and production SMTP credentials are unchanged.
- One internal test, subject `ZunftEcho – Absendertest 08.09.2026`, was sent at 18:33 Berlin time. Gmail displayed sent, but Brevo logs explicitly rejected it because the sender was not valid. **The test was NOT delivered.** Do not treat Gmail Sent as delivery proof.
- Brevo sender creation led to domain authentication; the business sender is not yet listed as verified in Brevo. Finish domain verification and the specific sender setup before another test.
- Final domain-authentication action is awaiting explicit user confirmation. The four individual record checks now report success; an overall stale mismatch banner still appears, so do not claim final authentication complete.
- Craftboxx inquiry is saved as an unsent Gmail draft in the sending account. HERO and the HeWo response are not sent. Check Sent and this existing draft before any send; do not create duplicates.

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

1. Obtain the requested confirmation for final Brevo domain authentication. Reuse existing domain and DNS records; do not recreate SMTP keys.
2. Complete the specific business sender if still absent; stop for any separate security-sensitive confirmation required by the UI policy.
3. Send one new clearly identified internal test; verify recipient arrival, sender display and authentication before external mail. The earlier rejected test need not be resent.
4. Recheck duplicates; send the saved Craftboxx draft, the HERO draft from `partner-outreach-2026-09-08.md`, and a brief written HeWo deferral once each.
5. Record actual send/delivery evidence, update monitoring and project state. Do not count a send as a customer win.
