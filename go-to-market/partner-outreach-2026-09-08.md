# First-customer partner inquiries — 8 September 2026

Status: **Five individual inquiries sent and provider-delivered. No partner, referral or customer acquired.**

Current checkpoint superseding the historical setup below: the domain and `ZunftEcho <kontakt@zunftecho.de>` sender are authenticated. A new internal message was received with domain signing and TLS. Craftboxx and HERO were sent once at 23:39 Berlin time and logged as delivered by Brevo. Plancraft was delivered at 23:44, Badheld at 23:56 and KIMEO at 23:57. See `business-sender-verification-2026-09-08.md`. Do not resend or recreate the SMTP key.

Historical setup note: a separate standard Brevo SMTP key named `ZunftEcho Gmail individual replies` was generated (expires 8 September 2027, also subject to provider inactivity expiry). Gmail authenticated over port 587/TLS and the alias was later confirmed. Cloudflare routing still sends all four business aliases to the owner's receiving Gmail account with suffix `4`. No production key, forwarding rule or personal default sender was changed.

## HWK Berlin — Netzwerk-Eignungsanfrage, 13 September 2026

**Status: sent once, 13 September 2026 13:55 Europe/Berlin; NOT joined.** Selected by the final whole-project capacity
audit, not a replacement for HPH or the existing follow-up plan. Official
[network invitation](https://www.hwk-berlin.de/artikel/technologietransfer-netzwerke-und-partner-91,0,368.html)
addresses interested parties at `wiktor@hwk-berlin.de`; participation eligibility and fees for an
early-stage external software provider are unknown. No implied endorsement or guaranteed SHK access.
The owner confirmed the specific sender, destination and inquiry in the next turn. Before composing,
`in:anywhere {from:hwk-berlin.de to:hwk-berlin.de}` returned no matches in both the receiving suffix4
and sending suffix55 Gmail accounts. The existing business alias was selected for this message only.
Gmail confirmed `تمّ إرسال الرسالة`; View message verified From `ZunftEcho <kontakt@zunftecho.de>`,
To `wiktor@hwk-berlin.de`, 13:55, exact subject/body and `mailed-by: zunftecho.de`.
This proves sender-side submission, not independent delivery or interest. Brevo logs were not accessed:
the provider presented a login screen. No credentials, SMTP key or sender settings changed.
One initial click had left the same draft intact with no Sent record; after dismissing an obstructing
desktop-notification banner the send completed. Do not retry or recreate this now-sent inquiry.
No reminder scheduled; one network eligibility inquiry, zero replies/referrals/memberships.

To: `wiktor@hwk-berlin.de` — Kerstin Wiktor, HWK Berlin BIT

From/Reply-To: `ZunftEcho <kontakt@zunftecho.de>` / `kontakt@zunftecho.de`

Subject: `Ihre Netzwerkeinladung: Eignung von ZunftEcho für Berliner Handwerk digital`

Guten Tag Frau Wiktor,

auf Ihrer HWK-Seite laden Sie Interessierte ein, sich zum Netzwerk „Berliner Handwerk digital“
per E-Mail zu melden. Dazu möchte ich zunächst die Eignung und Teilnahmebedingungen klären.

Ich entwickle ZunftEcho, einen Website-Anfrageassistenten für kleine SHK-Betriebe in Berlin und
Brandenburg. Er erfasst fehlende Angaben zu Serviceanfragen strukturiert und hält die Informationen
für die weitere Bearbeitung durch den Betrieb bereit; fachliche Diagnose und Entscheidungen
bleiben beim Menschen. Das Projekt befindet sich vor dem kommerziellen Pilotstart.

Ist ein fachlicher Austausch im Netzwerk auch für einen externen Softwareanbieter in dieser
frühen Phase möglich? Welche Voraussetzungen und gegebenenfalls Kosten gelten, und gibt es
ein passendes produktneutrales Format zum Thema vollständige Website-Anfragen in kleinen Teams?

Ich frage nur nach Eignung und dem zulässigen nächsten Schritt, nicht nach einer Aufnahme oder
Werbeverteilung an Mitglieder. Eine kurze schriftliche Einordnung genügt; ein Telefon- oder
Videotermin ist nicht nötig. Wenn dies nicht zu Ihrem Netzwerk passt, respektiere ich das und
sehe von weiteren Nachrichten ab.

Vielen Dank und freundliche Grüße
Hussam Alabar
ZunftEcho
kontakt@zunftecho.de

**Scope:** one invitation-related eligibility inquiry, no attachment/tracking/price/customer data,
no automatic membership, newsletter, integration, commission or paid commitment. Full comparison:
`opportunity-capacity-audit-2026-09-13.md`. Sender UI acknowledgement must not be reported as
independent delivery. Sent evidence above supersedes the prior local-draft checkpoint; never resend it.

## Basis and limits

The official pages below explicitly invite partnership inquiries at the listed addresses (verified 8 September). This is a narrow response to that invitation, not permission for newsletters, recurring follow-ups or outreach to their customers. General email-marketing restrictions remain applicable: https://www.gesetze-im-internet.de/uwg_2004/__7.html . This review is not a legal clearance certificate.

| Organization | Invitation source | Intended recipient | Status |
| --- | --- | --- | --- |
| Craftboxx | https://www.craftboxx.de/partnerprogramme | info@craftboxx.de | Sent once; Brevo delivered 23:39 |
| HERO | https://hero-software.de/kooperationen/partnerschaften | kooperationen@hero-software.de | Sent once; Brevo delivered 23:39 |
| Plancraft | https://plancraft.com/de-de/partner | kooperation@plancraft.com | Sent once; Brevo delivered 23:44 |
| Badheld | https://www.badheld.com/installateure/ | kontakt@badheld.com | Sent once; Brevo delivered 23:56 |
| KIMEO | https://kimeo-handwerk.de/netzwerk | info@kimeo-handwerk.de | Sent once; Brevo delivered 23:57 |

Do not duplicate an inquiry. The later approved rule permits at most one individual follow-up from
15 September, only after checking the actual project inbox, absence of a human reply or objection,
and the current explicit invitation. This is not an automatic sending authorization. Use only the
verified `ZunftEcho <kontakt@zunftecho.de>` identity. No recipient was subscribed to a list or recurring campaign.

## Craftboxx — individual inquiry

Subject: Ihre Einladung zu Kooperationen: ZunftEcho für SHK-Website-Anfragen

Guten Tag Craftboxx-Team,

auf Ihrer Partnerseite laden Sie Anbieter von Produkten und Services fürs Handwerk ausdrücklich zur Zusammenarbeit ein. Darauf bezieht sich meine Anfrage.

ZunftEcho unterstützt kleine SHK-Betriebe dabei, Anfragen auf ihrer bestehenden Website strukturiert aufzunehmen: Anliegen, Einsatzort, Dringlichkeit und Erreichbarkeit; Fotos sind freiwillig. Der Betrieb prüft die Angaben und übernimmt die weitere Bearbeitung.

Der mögliche gemeinsame Ansatz liegt vor der Einsatzplanung: vollständigere Erstanfragen statt unklarer Nachrichten. Eine direkte Craftboxx-Schnittstelle besteht derzeit nicht.

Wir bereiten die ersten Pilotbetriebe in Berlin und Brandenburg vor. Wäre eine Prüfung für Ihre Partnerübersicht oder eine freiwillige Weiterleitung unserer Demo an einen passenden Betrieb grundsätzlich interessant? Eine Weitergabe von Kundendaten ist dafür nicht nötig.

Die Demo arbeitet mit Beispieldaten: https://zunftecho.de/demo

Pilotstart und Abrechnung erfolgen erst nach Abschluss der rechtlichen Einrichtung. Zunächst geht es ausschließlich um eine unverbindliche Einschätzung Ihrer Partnerkriterien; eine kurze Antwort per E-Mail genügt, ohne Telefontermin.

Freundliche Grüße
ZunftEcho
kontakt@zunftecho.de
https://zunftecho.de/impressum

## Plancraft — individual inquiry

Subject: Kooperationsanfrage: strukturierte Website-Anfragen vor der Auftragsbearbeitung

Sent once to `kooperation@plancraft.com` from the verified business sender. It used the distinct source `plancraft-partner-01`, explicitly stated that no Plancraft integration exists, requested written-only review and kept Pilot activation and billing on hold. Brevo logged `Versendet` and `Zugestellt` at 23:44 Berlin time.

## HERO — individual inquiry

Subject: Partnerschaftsanfrage: strukturierte Website-Anfragen für SHK-Betriebe

Guten Tag HERO-Partnerschaftsteam,

Ihre Seite „HERO für Partnerschaften“ nennt diese Adresse für Kooperationsideen. Ich möchte Ihnen dazu einen konkreten Anwendungsfall vorstellen.

ZunftEcho nimmt Anfragen auf bestehenden SHK-Websites schrittweise auf und fragt fehlende Angaben wie Einsatzort, Anliegen und Erreichbarkeit ab. Kritische Fälle werden an Menschen verwiesen; der Assistent stellt keine Ferndiagnosen.

Die mögliche Ergänzung zu HERO wäre die strukturierte Erstanfrage vor der eigentlichen Auftragsbearbeitung. Eine native HERO-Integration besteht nicht; wir möchten weder eine vorhandene Schnittstelle behaupten noch deren Entwicklung ungeprüft zusagen.

Aktuell bereiten wir erste kleine SHK-Pilotbetriebe in Berlin und Brandenburg vor. Welche Voraussetzungen gelten bei Ihnen für eine frühe Partnerprüfung? Falls der Ansatz passt, wäre eine freiwillige Weiterleitung der Demo an einen interessierten Betrieb ein denkbarer erster Schritt, ohne Übermittlung seiner Kontaktdaten an uns.

Demo mit Beispieldaten: https://zunftecho.de/demo

Pilotstart und Abrechnung bleiben bis zum Abschluss der rechtlichen Einrichtung ausgesetzt. Eine schriftliche Einschätzung per E-Mail reicht zunächst völlig aus; ein Telefon- oder Videotermin ist nicht erforderlich.

Freundliche Grüße
ZunftEcho
kontakt@zunftecho.de
https://zunftecho.de/impressum

## Badheld — individual inquiry

Subject: Kooperationsanfrage: vollständige SHK-Website-Anfragen vor der Projektprüfung

Sent once after the official Installateure page explicitly invited direct contact for SHK projects and cooperation. The message used `badheld-partner-01`, stated that no integration, data transfer or remuneration exists, and requested only a written voluntary review/referral. Brevo logged `Versendet` and `Zugestellt` at 23:56 Berlin time.

## KIMEO — criteria inquiry

Subject: Schriftliche Partnerprüfung: ZunftEcho für strukturierte SHK-Anfragen

Sent once after the official network page invited software providers and startups to apply as partners. The message used `kimeo-partner-01`, disclosed that ZunftEcho has no paying customer yet and asked for the legal, EU-AI-Act and membership-fee criteria. It explicitly said this was not a paid application and made no integration, remuneration or data-transfer commitment. Brevo logged `Versendet` and `Zugestellt` at 23:57 Berlin time.

## Execution and response rules

1. Verify the business sender and Reply-To, then send each inquiry once, individually. Record actual provider acceptance and time; acceptance is not proof of delivery or interest.
2. Do not add any recipient to marketing lists or scheduled follow-ups. If declined, stop and record the objection.
3. If interested, answer their criteria in writing. No commissions, paid listing, integration commitment or customer-data exchange without a separate decision.
4. For a voluntary referral, let the interested business contact ZunftEcho itself. Qualify its website, trade and request volume using the existing async qualification process.
5. A positive partner reply is not a won customer. Contract/Pilot activation and billing remain held pending Gewerbe/legal readiness.

## Follow-up preparation — 13 September 2026

Status: **Three local German messages prepared; none sent or scheduled.** Browser access recovered
on 13 September. The verified suffix-4 project inbox showed only the already-known HeWo reply and
Craftboxx acknowledgement in the latest partner-domain check. The mismatched Gmail connector was
not searched. Recheck the original thread at action time; this snapshot is not proof of future silence.

### Priority and evidence

1. **Craftboxx:** direct service/product listing invitation is still visible at
   [its official partner page](https://www.craftboxx.de/partnerprogramme), including `info@craftboxx.de`.
   Ask only whether a non-integrated early product can be considered; no discount/listing promise.
2. **Plancraft:** [its official partner page](https://plancraft.com/de-de/partner) still invites
   cooperation ideas at `kooperation@plancraft.com`. Ask whether written review without an integration
   is within scope; keep existing source `plancraft-partner-01`.
3. **HERO:** [its official partner page](https://hero-software.de/kooperationen/partnerschaften)
   still lists `kooperationen@hero-software.de` and several partner routes. Ask which route, if any,
   fits without a native integration, rather than proposing an unapproved webinar or deal.

These invitations were rechecked on 13 September. They are evidence of the advertised contact route,
not proof of consent to repeated marketing or legal clearance for a follow-up.

KIMEO remains a criteria-only opportunity: [its network page](https://kimeo-handwerk.de/netzwerk)
states that software partners require reviewed EU-AI-Act status and membership contributions.
Any human reply is handled promptly; no paid membership or compliance certification is assumed.
Badheld is outside this first follow-up preparation because the software-partner fit is less direct.
HeWo remains excluded by its video/meeting condition. Bauleo's form is not resubmitted.

### Action-time gates

- Earliest date: 15 September, preserving the previously approved response window after 8 September.
  No additional calendar delay once the gates are satisfied.
- Check the correct suffix-4 receiving inbox and original thread immediately before each action.
  If there is a human reply, answer it instead. Any refusal/objection ends the contact permanently.
- Recheck current invitation and applicable contact restrictions. If ambiguous, hold; no cold-email fallback.
- Reply within the existing thread, individually, from `ZunftEcho <kontakt@zunftecho.de>` with the same
  Reply-To; no CC/BCC, attachments, tracking pixels, new list, duplicated original pitch or customer-data request.
- Obtain any action-time confirmation required by the sending tool. No automatic follow-up.
- Record provider evidence separately from human interest. If this one follow-up receives no reply,
  close the route for this experiment; no second reminder.
- No Pilot activation/billing, commission, discount, integration or paid listing commitment.

### HPH — new individual criteria inquiry, 13 September 2026

**Status: submitted ONCE on 13 September 2026 at 13:07 Berlin time.** After the owner explicitly
confirmed, reCAPTCHA showed checked and the form was sent once. The visible result was
`Vielen Dank für deine Mitteilung. Sie wurde versandt.` and the fields reset. This is form-side
send confirmation, not independent recipient delivery or human interest. No reminder or second
submission. Official
[partner page](https://www.hph-software.de/partner-werden/) expressly welcomes software manufacturers
for small/mid-sized businesses and directs them to its form; its network includes Sage handcraft
software dealers. This is a potentially relevant distribution route, not proven SHK reach or interest.
The live [Impressum](https://www.hph-software.de/impressum/) was reviewed; no visible marketing
objection was found. An `in:anywhere` search limited to this domain in the verified suffix-4 project
inbox returned no messages. Neither observation constitutes blanket legal clearance.

**Why now:** independent partner qualification does not change YouTube distribution or attribution.
No artificial future date; the reCAPTCHA dependency was closed by explicit owner confirmation.
Do not replace the form route with email or submit again. Await a voluntary human response and
handle its criteria individually; no partner agreement, fee, integration or data-transfer commitment.

Completed browser result: Chrome tab `458451348`, exact URL above, marked as a deliverable. The previous
tab `458451013` was no longer present when recovering from the usage interruption at 13:01;
the same saved draft was restored, then sent for the first time after confirmation. Name, business
reply email, manufacturer option, subject and message were verified in the form; telephone stays
empty. Email presence was visually confirmed because text/DOM observations did not expose its value.
Do not keep retyping or duplicating it. No file upload, tracking pixel, list enrollment or cost.
The visible success state closed the interrupted task. Do not recover the old draft as unfinished
or resend after a usage interruption. No reminder is scheduled for this new route.

Other bounded screening: OneQrew's public partner invitation exists, but its advertised portfolio/
reseller orientation does not yet prove a low-obligation early-product referral fit; queue, no contact.
openHandwerk's partner page could not be directly fetched twice; no fresh channel verification or
contact. HPH is now completed; stop further broad searches without new fit/distribution evidence.

#### Prepared form content

Name: `Hussam Alabar – ZunftEcho`; email: `kontakt@zunftecho.de`; category: `Hersteller`.

Subject: `Ihre Einladung für Softwarehersteller: schriftliche Prüfung von ZunftEcho`

Guten Tag HPH-Team,

Ihre Netzwerkseite lädt auch Hersteller von Softwarelösungen für kleine Unternehmen ein. Ist eine
schriftliche Partnerprüfung für einen frühen Anbieter ohne bestehende Sage-Integration grundsätzlich möglich?

ZunftEcho nimmt Anfragen auf SHK-Websites schrittweise auf und ergänzt fehlende Angaben wie Anliegen,
Einsatzort und Erreichbarkeit. Die Prüfung und weitere Bearbeitung bleiben beim Betrieb; kritische
Fälle werden an Menschen verwiesen, ohne Ferndiagnose.

Wir suchen zunächst nur eine Einschätzung Ihrer Voraussetzungen und gegebenenfalls eine freiwillige
Weiterleitung der Demo mit Beispieldaten: https://zunftecho.de/demo

Noch bestehen weder eine Integration noch eine Partnervereinbarung. Es geht nicht um Provisionen,
Kundendaten oder einen kostenpflichtigen Auftrag. Die rechtliche Einrichtung ist noch nicht
abgeschlossen; Pilotstart und Abrechnung bleiben ausgesetzt. Eine Antwort per E-Mail genügt, ohne
Telefon- oder Videotermin.

Falls der Ansatz nicht passt, fragen wir nicht erneut nach.

Freundliche Grüße
Hussam Alabar
ZunftEcho
kontakt@zunftecho.de
https://zunftecho.de/impressum

### Craftboxx — prepared reply

To: `info@craftboxx.de`; reply to the existing subject/thread.

Guten Tag Craftboxx-Team,

ich greife meine Anfrage vom 8. September zu Ihrer Einladung für Handwerks-Services einmal kurz auf.
Passt ein früher Anbieter für strukturierte SHK-Website-Anfragen grundsätzlich in Ihre Partnerübersicht,
auch ohne direkte Craftboxx-Schnittstelle?

ZunftEcho nimmt Anliegen, Einsatzort und Erreichbarkeit auf; die weitere Bearbeitung bleibt beim Betrieb.
Eine kurze schriftliche Einschätzung Ihrer Voraussetzungen genügt. Pilotstart und Abrechnung bleiben
bis zum Abschluss unserer rechtlichen Einrichtung ausgesetzt.

Falls der Ansatz nicht passt, genügt ein kurzer Hinweis; wir fragen dann nicht erneut nach.

Freundliche Grüße
ZunftEcho
kontakt@zunftecho.de
https://zunftecho.de/impressum

### Plancraft — prepared reply

To: `kooperation@plancraft.com`; reply to the existing subject/thread.

Guten Tag plancraft-Partnerteam,

zu meiner Kooperationsanfrage vom 8. September habe ich eine kurze Frage: Ist eine schriftliche
Prüfung für einen frühen Anbieter ohne plancraft-Integration grundsätzlich möglich?

ZunftEcho strukturiert Erstanfragen auf SHK-Websites vor der Auftragsbearbeitung. Die Demo verwendet
Beispieldaten: https://zunftecho.de/demo?source=plancraft-partner-01

Wir suchen zunächst nur eine Einschätzung Ihrer Partnerkriterien, keine Integrationszusage oder
Kundendaten. Pilotstart und Abrechnung bleiben bis zum Abschluss unserer rechtlichen Einrichtung ausgesetzt.
Falls der Ansatz nicht passt, fragen wir nicht erneut nach.

Freundliche Grüße
ZunftEcho
kontakt@zunftecho.de
https://zunftecho.de/impressum

### HERO — prepared reply

To: `kooperationen@hero-software.de`; reply to the existing subject/thread.

Guten Tag HERO-Partnerschaftsteam,

ich greife meine Anfrage vom 8. September einmal kurz auf. Welcher Ihrer Partnerwege käme,
wenn überhaupt, für einen frühen Anbieter strukturierter SHK-Website-Anfragen ohne native HERO-Integration infrage?

ZunftEcho erfasst fehlende Angaben zur Erstanfrage; der Betrieb prüft und bearbeitet sie weiter.
Es geht zunächst ausschließlich um Ihre Voraussetzungen, nicht um einen Schnittstellen-, Webinar-
oder Vergütungsauftrag. Eine kurze Antwort per E-Mail genügt.

Pilotstart und Abrechnung bleiben bis zum Abschluss unserer rechtlichen Einrichtung ausgesetzt.
Falls kein Weg passt, genügt ein kurzer Hinweis; wir fragen dann nicht erneut nach.

Freundliche Grüße
ZunftEcho
kontakt@zunftecho.de
https://zunftecho.de/impressum
