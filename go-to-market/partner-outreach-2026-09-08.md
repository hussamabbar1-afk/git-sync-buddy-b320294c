# First-customer partner inquiries — 8 September 2026

Status: **Prepared, NOT SENT. No partner, referral or customer acquired.**

Current checkpoint superseding the historical setup below: Gmail alias confirmed; receiving account accessible. One internal test was rejected by Brevo (unverified sender), not delivered. Four DNS record checks now pass; final domain authentication awaits user confirmation. Craftboxx is saved as an unsent Gmail draft; HERO remains unsent. See `business-sender-verification-2026-09-08.md`. Do not recreate that draft or SMTP key.

Latest sender setup: a separate standard Brevo SMTP key named `ZunftEcho Gmail individual replies` was generated (expires 8 September 2027, also subject to provider inactivity expiry). Gmail authenticated successfully over port 587/TLS, but the alias is **pending email confirmation**, not ready to send. Cloudflare rules directly establish that all four business aliases forward to the owner's Gmail address with suffix `4`, not the currently signed-in Brevo account with suffix `55`. The destination account is not signed into the browser. User sign-in is required; do not redirect mail as a workaround. No test or partner email has been sent. No production key or personal default sender changed. Historical statements below describe the pre-setup state.

## Basis and limits

The official pages below explicitly invite partnership inquiries at the listed addresses (verified 8 September). This is a narrow response to that invitation, not permission for newsletters, recurring follow-ups or outreach to their customers. General email-marketing restrictions remain applicable: https://www.gesetze-im-internet.de/uwg_2004/__7.html . This review is not a legal clearance certificate.

| Organization | Invitation source | Intended recipient | Status |
| --- | --- | --- | --- |
| Craftboxx | https://www.craftboxx.de/partnerprogramme | info@craftboxx.de | Prepared; business sending channel required |
| HERO | https://hero-software.de/kooperationen/partnerschaften | kooperationen@hero-software.de | Prepared; business sending channel required |

Do not send from the unrelated Gmail connector account. The owner's Gmail browser session is accessible, but its compose view did not expose a business From selector. Brevo is accessible; its individual Compose action requests connecting an email account. No connection, API key creation, contact subscription or send was performed. Use verified `ZunftEcho <kontakt@zunftecho.de>` for eventual sending and replies. Recheck invitation and duplicate/sent status before sending.

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

## Execution and response rules

1. Verify the business sender and Reply-To, then send each inquiry once, individually. Record actual provider acceptance and time; acceptance is not proof of delivery or interest.
2. Do not add either recipient to marketing lists or scheduled follow-ups. If declined, stop and record the objection.
3. If interested, answer their criteria in writing. No commissions, paid listing, integration commitment or customer-data exchange without a separate decision.
4. For a voluntary referral, let the interested business contact ZunftEcho itself. Qualify its website, trade and request volume using the existing async qualification process.
5. A positive partner reply is not a won customer. Contract/Pilot activation and billing remain held pending Gewerbe/legal readiness.
