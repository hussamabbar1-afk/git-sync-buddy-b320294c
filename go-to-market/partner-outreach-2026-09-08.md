# First-customer partner inquiries — 8 September 2026

Status: **Five individual inquiries sent and provider-delivered. No partner, referral or customer acquired.**

Current checkpoint superseding the historical setup below: the domain and `ZunftEcho <kontakt@zunftecho.de>` sender are authenticated. A new internal message was received with domain signing and TLS. Craftboxx and HERO were sent once at 23:39 Berlin time and logged as delivered by Brevo. Plancraft was delivered at 23:44, Badheld at 23:56 and KIMEO at 23:57. See `business-sender-verification-2026-09-08.md`. Do not resend or recreate the SMTP key.

Historical setup note: a separate standard Brevo SMTP key named `ZunftEcho Gmail individual replies` was generated (expires 8 September 2027, also subject to provider inactivity expiry). Gmail authenticated over port 587/TLS and the alias was later confirmed. Cloudflare routing still sends all four business aliases to the owner's receiving Gmail account with suffix `4`. No production key, forwarding rule or personal default sender was changed.

## Basis and limits

The official pages below explicitly invite partnership inquiries at the listed addresses (verified 8 September). This is a narrow response to that invitation, not permission for newsletters, recurring follow-ups or outreach to their customers. General email-marketing restrictions remain applicable: https://www.gesetze-im-internet.de/uwg_2004/__7.html . This review is not a legal clearance certificate.

| Organization | Invitation source | Intended recipient | Status |
| --- | --- | --- | --- |
| Craftboxx | https://www.craftboxx.de/partnerprogramme | info@craftboxx.de | Sent once; Brevo delivered 23:39 |
| HERO | https://hero-software.de/kooperationen/partnerschaften | kooperationen@hero-software.de | Sent once; Brevo delivered 23:39 |
| Plancraft | https://plancraft.com/de-de/partner | kooperation@plancraft.com | Sent once; Brevo delivered 23:44 |
| Badheld | https://www.badheld.com/installateure/ | kontakt@badheld.com | Sent once; Brevo delivered 23:56 |
| KIMEO | https://kimeo-handwerk.de/netzwerk | info@kimeo-handwerk.de | Sent once; Brevo delivered 23:57 |

Do not send again without a substantive reply. Use only the verified `ZunftEcho <kontakt@zunftecho.de>` identity for replies. No recipient was subscribed to a list or recurring campaign.

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
