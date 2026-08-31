from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf"
LOGO = ROOT / "public" / "zunftecho-mark.png"

WIDTH, HEIGHT = A4
MARGIN = 38

NAVY = HexColor("#10263A")
BLUE = HexColor("#0589C6")
BLUE_DARK = HexColor("#046C9B")
ORANGE = HexColor("#F07D18")
LIGHT_BLUE = HexColor("#EAF6FC")
LIGHT_ORANGE = HexColor("#FFF3E8")
LIGHT = HexColor("#F6F9FB")
TEXT = HexColor("#14212D")
MUTED = HexColor("#586A79")
BORDER = HexColor("#DCE5EB")
GREEN = HexColor("#16865F")


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Zunft", "C:/Windows/Fonts/arial.ttf"))
    pdfmetrics.registerFont(TTFont("Zunft-Bold", "C:/Windows/Fonts/arialbd.ttf"))


def wrap_lines(text: str, font: str, size: float, max_width: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if current and pdfmetrics.stringWidth(candidate, font, size) > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def draw_wrapped(
    pdf: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    max_width: float,
    font: str = "Zunft",
    size: float = 10,
    leading: float = 14,
    color=TEXT,
    max_lines: int | None = None,
) -> float:
    lines = wrap_lines(text, font, size, max_width)
    if max_lines is not None:
        lines = lines[:max_lines]
    pdf.setFont(font, size)
    pdf.setFillColor(color)
    for line in lines:
        pdf.drawString(x, y, line)
        y -= leading
    return y


def draw_qr(pdf: canvas.Canvas, data: str, x: float, y: float, size: float) -> None:
    qr = QrCodeWidget(data)
    x1, y1, x2, y2 = qr.getBounds()
    qr_width = x2 - x1
    qr_height = y2 - y1
    drawing = Drawing(
        size,
        size,
        transform=[size / qr_width, 0, 0, size / qr_height, 0, 0],
    )
    drawing.add(qr)
    renderPDF.draw(drawing, pdf, x, y)


def draw_header(pdf: canvas.Canvas, eyebrow: str) -> None:
    pdf.setFillColor(NAVY)
    pdf.rect(0, HEIGHT - 76, WIDTH, 76, stroke=0, fill=1)
    pdf.setFillColor(white)
    pdf.roundRect(MARGIN, HEIGHT - 62, 42, 42, 10, stroke=0, fill=1)
    pdf.drawImage(str(LOGO), MARGIN + 2, HEIGHT - 60, 38, 38, mask="auto")
    pdf.setFont("Zunft-Bold", 18)
    pdf.drawString(MARGIN + 54, HEIGHT - 44, "ZunftEcho")
    pdf.setFont("Zunft", 8.5)
    pdf.setFillColor(HexColor("#BBD6E6"))
    pdf.drawString(MARGIN + 54, HEIGHT - 58, "Digitale Kundenkommunikation für SHK-Betriebe")

    badge_width = pdfmetrics.stringWidth(eyebrow, "Zunft-Bold", 8.5) + 24
    pdf.setFillColor(HexColor("#1C3C55"))
    pdf.roundRect(WIDTH - MARGIN - badge_width, HEIGHT - 53, badge_width, 24, 12, stroke=0, fill=1)
    pdf.setFillColor(white)
    pdf.setFont("Zunft-Bold", 8.5)
    pdf.drawCentredString(WIDTH - MARGIN - badge_width / 2, HEIGHT - 45, eyebrow)


def draw_footer(pdf: canvas.Canvas, source_label: str) -> None:
    pdf.setStrokeColor(BORDER)
    pdf.line(MARGIN, 34, WIDTH - MARGIN, 34)
    pdf.setFillColor(MUTED)
    pdf.setFont("Zunft", 7.5)
    pdf.drawString(MARGIN, 21, "zunftecho.de | Berlin & Brandenburg")
    pdf.drawRightString(WIDTH - MARGIN, 21, source_label)


def draw_feature_card(
    pdf: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    height: float,
    number: str,
    title: str,
    text: str,
) -> None:
    pdf.setFillColor(white)
    pdf.setStrokeColor(BORDER)
    pdf.roundRect(x, y, width, height, 14, stroke=1, fill=1)
    pdf.setFillColor(LIGHT_BLUE)
    pdf.circle(x + 24, y + height - 25, 13, stroke=0, fill=1)
    pdf.setFillColor(BLUE_DARK)
    pdf.setFont("Zunft-Bold", 8.5)
    pdf.drawCentredString(x + 24, y + height - 28, number)
    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 11)
    pdf.drawString(x + 44, y + height - 29, title)
    draw_wrapped(pdf, text, x + 14, y + height - 52, width - 28, size=8.5, leading=11.5, color=MUTED)


def draw_check_line(
    pdf: canvas.Canvas,
    x: float,
    y: float,
    text: str,
    width: float,
    text_color=TEXT,
) -> float:
    pdf.setFillColor(GREEN)
    pdf.circle(x + 4, y + 3, 4, stroke=0, fill=1)
    pdf.setStrokeColor(white)
    pdf.setLineWidth(1.2)
    pdf.line(x + 1.8, y + 3, x + 3.4, y + 1.3)
    pdf.line(x + 3.4, y + 1.3, x + 6.6, y + 5.2)
    return draw_wrapped(
        pdf,
        text,
        x + 14,
        y + 7,
        width - 14,
        size=8.5,
        leading=11,
        color=text_color,
    )


def create_pilot_onepager(path: Path) -> None:
    pdf = canvas.Canvas(str(path), pagesize=A4)
    pdf.setTitle("ZunftEcho Pilot-Kurzübersicht")
    pdf.setAuthor("ZunftEcho")
    pdf.setFillColor(LIGHT)
    pdf.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)
    draw_header(pdf, "30-TAGE-PILOT")

    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 28)
    pdf.drawString(MARGIN, 724, "Mehr vollständige Anfragen.")
    pdf.drawString(MARGIN, 688, "Weniger Rückrufchaos.")
    draw_wrapped(
        pdf,
        "ZunftEcho nimmt Website-Anfragen auf, stellt die fehlenden Rückfragen und übergibt Ihrem Team einen vorbereiteten Lead - auch wenn gerade alle auf der Baustelle sind.",
        MARGIN,
        655,
        365,
        size=11,
        leading=16,
        color=MUTED,
    )

    pdf.setFillColor(white)
    pdf.setStrokeColor(BORDER)
    pdf.roundRect(430, 625, 126, 118, 16, stroke=1, fill=1)
    pdf.setFillColor(HexColor("#E9F8F1"))
    pdf.circle(454, 718, 11, stroke=0, fill=1)
    pdf.setFillColor(GREEN)
    pdf.setFont("Zunft-Bold", 8)
    pdf.drawCentredString(454, 715, "OK")
    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 10)
    pdf.drawString(472, 714, "Anfrage vollständig")
    for label, value, y in [
        ("Einsatzort", "Berlin-Neukölln", 689),
        ("Dringlichkeit", "heute prüfen", 665),
        ("Kontakt", "Telefon bestätigt", 641),
    ]:
        pdf.setFillColor(MUTED)
        pdf.setFont("Zunft", 6.8)
        pdf.drawString(444, y + 9, label)
        pdf.setFillColor(TEXT)
        pdf.setFont("Zunft-Bold", 8.2)
        pdf.drawString(444, y, value)

    card_gap = 10
    card_width = (WIDTH - 2 * MARGIN - 2 * card_gap) / 3
    draw_feature_card(
        pdf,
        MARGIN,
        493,
        card_width,
        112,
        "01",
        "Anliegen erfassen",
        "Problem, Kontaktdaten, Einsatzort und Terminwunsch werden strukturiert abgefragt.",
    )
    draw_feature_card(
        pdf,
        MARGIN + card_width + card_gap,
        493,
        card_width,
        112,
        "02",
        "Dringlichkeit erkennen",
        "Gefahrenhinweise und ungewöhnliche Fälle werden sichtbar an einen Menschen übergeben.",
    )
    draw_feature_card(
        pdf,
        MARGIN + 2 * (card_width + card_gap),
        493,
        card_width,
        112,
        "03",
        "Team vorbereiten",
        "Leads, Gespräche und Termine landen nachvollziehbar im gemeinsamen Arbeitsbereich.",
    )

    pdf.setFillColor(white)
    pdf.setStrokeColor(BORDER)
    pdf.roundRect(MARGIN, 358, WIDTH - 2 * MARGIN, 105, 16, stroke=1, fill=1)
    pdf.setFillColor(BLUE_DARK)
    pdf.setFont("Zunft-Bold", 9)
    pdf.drawString(MARGIN + 18, 438, "PERSÖNLICH EINGERICHTET")
    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 15)
    pdf.drawString(MARGIN + 18, 414, "Ihr Betrieb, Ihre Leistungen, Ihre Regeln")
    draw_check_line(pdf, MARGIN + 18, 388, "Firmenname, Leistungen und Servicegebiete", 225)
    draw_check_line(pdf, MARGIN + 18, 370, "Öffnungszeiten und Eskalationsregeln", 225)
    draw_check_line(pdf, 320, 388, "Widget in Ihrer Firmenfarbe", 220)
    draw_check_line(pdf, 320, 370, "Gemeinsamer Optimierungstermin", 220)

    pdf.setFillColor(NAVY)
    pdf.roundRect(MARGIN, 139, WIDTH - 2 * MARGIN, 191, 18, stroke=0, fill=1)
    pdf.setFillColor(HexColor("#9FDBF5"))
    pdf.setFont("Zunft-Bold", 9)
    pdf.drawString(MARGIN + 20, 302, "BETREUTER EINFÜHRUNGSPILOT")
    pdf.setFillColor(white)
    pdf.setFont("Zunft-Bold", 28)
    pdf.drawString(MARGIN + 20, 267, "30 Tage | 99 EUR netto")
    pdf.setFont("Zunft", 10)
    pdf.setFillColor(HexColor("#D8E7F0"))
    draw_wrapped(
        pdf,
        "Einmalig inklusive Einrichtung. Danach optional 149 EUR netto pro Monat, monatlich kündbar.",
        MARGIN + 20,
        244,
        320,
        size=10,
        leading=14,
        color=HexColor("#D8E7F0"),
    )
    pdf.setFont("Zunft-Bold", 9)
    pdf.setFillColor(white)
    pdf.drawString(MARGIN + 20, 197, "Keine Kreditkarte. Kein Jahresvertrag.")
    pdf.setFillColor(ORANGE)
    pdf.roundRect(MARGIN + 20, 159, 250, 28, 14, stroke=0, fill=1)
    pdf.setFillColor(white)
    pdf.setFont("Zunft-Bold", 9.5)
    pdf.drawCentredString(MARGIN + 145, 169, "Live-Demo in zwei Minuten ansehen")

    pdf.setFillColor(white)
    pdf.roundRect(443, 164, 94, 124, 12, stroke=0, fill=1)
    draw_qr(pdf, "https://zunftecho.de/demo?source=pdf-pilot-onepager", 451, 184, 78)
    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 7.5)
    pdf.drawCentredString(490, 174, "zunftecho.de/demo")

    pdf.setFillColor(MUTED)
    pdf.setFont("Zunft", 7.4)
    pdf.drawString(MARGIN, 112, "Alle Preise netto zuzüglich gesetzlicher Umsatzsteuer.")
    pdf.drawString(MARGIN, 99, "Verfügbarkeit und Eignung werden vor dem Pilot gemeinsam geprüft.")
    draw_footer(pdf, "Pilot-Kurzübersicht | Stand 29.08.2026")
    pdf.showPage()
    pdf.save()


def create_partner_onepager(path: Path) -> None:
    pdf = canvas.Canvas(str(path), pagesize=A4)
    pdf.setTitle("ZunftEcho Partner-Kurzübersicht")
    pdf.setAuthor("ZunftEcho")
    pdf.setFillColor(LIGHT)
    pdf.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)
    draw_header(pdf, "FÜR WEBAGENTUREN")

    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 27)
    pdf.drawString(MARGIN, 724, "Aus einer guten SHK-Website")
    pdf.drawString(MARGIN, 689, "wird ein verlässlicher Anfragekanal.")
    draw_wrapped(
        pdf,
        "ZunftEcho ergänzt bestehende Websites um eine strukturierte Anfrageaufnahme. Die Agentur behält das Webprojekt - der Betrieb erhält einen klaren Prozess für Rückfragen, Dringlichkeit und Übergabe.",
        MARGIN,
        654,
        500,
        size=11,
        leading=16,
        color=MUTED,
    )

    card_gap = 10
    card_width = (WIDTH - 2 * MARGIN - 2 * card_gap) / 3
    draw_feature_card(
        pdf,
        MARGIN,
        494,
        card_width,
        116,
        "01",
        "Teilbare Live-Demo",
        "Der Kundenbetrieb kann den Ablauf auf Mobilgerät und Desktop ohne Anmeldung testen.",
    )
    draw_feature_card(
        pdf,
        MARGIN + card_width + card_gap,
        494,
        card_width,
        116,
        "02",
        "Einbau per Script",
        "WordPress, Wix, Webflow, Jimdo oder HTML benötigen keinen kompletten Website-Neubau.",
    )
    draw_feature_card(
        pdf,
        MARGIN + 2 * (card_width + card_gap),
        494,
        card_width,
        116,
        "03",
        "Klare Grenzen",
        "Keine White-Label-, Provisions- oder Exklusivzusage ohne separate Vereinbarung.",
    )

    pdf.setFillColor(white)
    pdf.setStrokeColor(BORDER)
    pdf.roundRect(MARGIN, 333, WIDTH - 2 * MARGIN, 132, 16, stroke=1, fill=1)
    pdf.setFillColor(BLUE_DARK)
    pdf.setFont("Zunft-Bold", 9)
    pdf.drawString(MARGIN + 18, 439, "KLARE ROLLEN IM GEMEINSAMEN PILOT")

    role_width = 235
    pdf.setFillColor(LIGHT_BLUE)
    pdf.roundRect(MARGIN + 18, 352, role_width, 70, 12, stroke=0, fill=1)
    pdf.setFillColor(BLUE_DARK)
    pdf.setFont("Zunft-Bold", 10)
    pdf.drawString(MARGIN + 32, 402, "Webagentur")
    draw_wrapped(
        pdf,
        "behält Website, Design und Kundenbeziehung und setzt auf Wunsch das Script ein.",
        MARGIN + 32,
        384,
        role_width - 28,
        size=8.5,
        leading=11.5,
        color=TEXT,
    )

    pdf.setFillColor(LIGHT_ORANGE)
    pdf.roundRect(MARGIN + 28 + role_width, 352, role_width, 70, 12, stroke=0, fill=1)
    pdf.setFillColor(ORANGE)
    pdf.setFont("Zunft-Bold", 10)
    pdf.drawString(MARGIN + 42 + role_width, 402, "ZunftEcho")
    draw_wrapped(
        pdf,
        "prüft den Anwendungsfall und richtet Leistungen, Dialog, Übergabe und Pilot ein.",
        MARGIN + 42 + role_width,
        384,
        role_width - 28,
        size=8.5,
        leading=11.5,
        color=TEXT,
    )

    pdf.setFillColor(NAVY)
    pdf.roundRect(MARGIN, 126, WIDTH - 2 * MARGIN, 178, 18, stroke=0, fill=1)
    pdf.setFillColor(HexColor("#9FDBF5"))
    pdf.setFont("Zunft-Bold", 9)
    pdf.drawString(MARGIN + 20, 276, "SO STARTET EINE EMPFEHLUNG")
    pdf.setFillColor(white)
    pdf.setFont("Zunft-Bold", 18)
    pdf.drawString(MARGIN + 20, 247, "Erst zeigen. Dann gemeinsam prüfen.")
    draw_check_line(
        pdf,
        MARGIN + 20,
        219,
        "Partner teilt Demo oder Anfrage-Check",
        320,
        HexColor("#EAF3F8"),
    )
    draw_check_line(
        pdf,
        MARGIN + 20,
        199,
        "Kundenbetrieb bestätigt Interesse selbst",
        320,
        HexColor("#EAF3F8"),
    )
    draw_check_line(
        pdf,
        MARGIN + 20,
        179,
        "ZunftEcho richtet den 30-Tage-Pilot ein",
        320,
        HexColor("#EAF3F8"),
    )
    pdf.setFillColor(HexColor("#D8E7F0"))
    pdf.setFont("Zunft", 8)
    pdf.drawString(MARGIN + 20, 147, "Eine Empfehlung löst weder Auftrag noch Zahlung aus.")

    pdf.setFillColor(white)
    pdf.roundRect(443, 151, 94, 126, 12, stroke=0, fill=1)
    draw_qr(pdf, "https://zunftecho.de/partner?source=pdf-partner-onepager", 451, 173, 78)
    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 7.5)
    pdf.drawCentredString(490, 160, "Partnerseite öffnen")

    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 11)
    pdf.drawString(MARGIN, 98, "Ein passender SHK-Kunde im Bestand?")
    pdf.setFont("Zunft", 8.5)
    pdf.setFillColor(MUTED)
    pdf.drawString(MARGIN, 82, "Ablauf und Grenzen: zunftecho.de/partner")
    draw_footer(pdf, "Partner-Kurzübersicht | Stand 29.08.2026")
    pdf.showPage()
    pdf.save()


def main() -> None:
    register_fonts()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    create_pilot_onepager(OUTPUT / "ZunftEcho-Pilot-Kurzuebersicht.pdf")
    create_partner_onepager(OUTPUT / "ZunftEcho-Partner-Kurzuebersicht.pdf")
    print("created 2 PDF one-pagers")


if __name__ == "__main__":
    main()
