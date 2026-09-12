from __future__ import annotations

from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / "output" / "pdf" / "ZunftEcho-Partner-One-Pager-Webagenturen.pdf"
LOGO = ROOT / "public" / "zunftecho-mark.png"

NAVY = HexColor("#06233B")
TEXT_NAVY = HexColor("#08213B")
BLUE = HexColor("#087EAA")
CYAN = HexColor("#38BDF8")
ORANGE = HexColor("#F2A34C")
PAPER = HexColor("#F7FBFF")
WARM = HexColor("#FFF5E8")
LINE = HexColor("#D8E2EA")
MUTED = HexColor("#607286")
GREEN = HexColor("#22C55E")

FONT_REGULAR = "SegoeUI"
FONT_SEMIBOLD = "SegoeUISemibold"
FONT_BOLD = "SegoeUIBold"


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, r"C:\Windows\Fonts\segoeui.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_SEMIBOLD, r"C:\Windows\Fonts\seguisb.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, r"C:\Windows\Fonts\segoeuib.ttf"))


def wrap_lines(text: str, font: str, size: float, max_width: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if pdfmetrics.stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    max_width: float,
    font: str,
    size: float,
    leading: float,
    color=TEXT_NAVY,
) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap_lines(text, font, size, max_width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_bullet(c: canvas.Canvas, text: str, x: float, y: float, width: float) -> float:
    c.setFillColor(GREEN)
    c.circle(x + 2.2 * mm, y + 1.6 * mm, 1.4 * mm, fill=1, stroke=0)
    c.setStrokeColor(white)
    c.setLineWidth(0.8)
    c.line(x + 1.5 * mm, y + 1.6 * mm, x + 2.0 * mm, y + 1.0 * mm)
    c.line(x + 2.0 * mm, y + 1.0 * mm, x + 3.0 * mm, y + 2.2 * mm)
    return draw_wrapped(
        c,
        text,
        x + 6 * mm,
        y + 0.2 * mm,
        width - 6 * mm,
        FONT_REGULAR,
        8.1,
        10.2,
        MUTED,
    ) - 1.2 * mm


def draw_card(
    c: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    height: float,
    number: str,
    title: str,
    bullets: list[str],
    accent,
) -> None:
    c.setFillColor(white)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.roundRect(x, y, width, height, 4 * mm, fill=1, stroke=1)
    c.setFillColor(accent)
    c.roundRect(x + 5 * mm, y + height - 12 * mm, 8 * mm, 8 * mm, 2.2 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 8.5)
    c.drawCentredString(x + 9 * mm, y + height - 9.3 * mm, number)
    title_y = draw_wrapped(
        c,
        title,
        x + 16 * mm,
        y + height - 7.5 * mm,
        width - 21 * mm,
        FONT_SEMIBOLD,
        10.8,
        12.5,
        TEXT_NAVY,
    )
    bullet_y = min(title_y - 3 * mm, y + height - 20 * mm)
    for bullet in bullets:
        bullet_y = draw_bullet(c, bullet, x + 5 * mm, bullet_y, width - 10 * mm)


def build_pdf() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("ZunftEcho Partner-One-Pager für Webagenturen")
    c.setAuthor("ZunftEcho")
    c.setSubject("Strukturierte Website-Anfragen für SHK-Betriebe")

    # Background and hero.
    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    hero_h = 91 * mm
    c.setFillColor(NAVY)
    c.rect(0, height - hero_h, width, hero_h, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.circle(width - 8 * mm, height - 12 * mm, 39 * mm, fill=1, stroke=0)
    c.setFillColor(CYAN)
    c.circle(width - 14 * mm, height - 18 * mm, 28 * mm, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.circle(width - 18 * mm, height - 22 * mm, 22 * mm, fill=1, stroke=0)

    margin = 17 * mm
    c.setFillColor(white)
    c.roundRect(margin, height - 28 * mm, 67 * mm, 13 * mm, 4 * mm, fill=1, stroke=0)
    c.drawImage(ImageReader(str(LOGO)), margin + 3 * mm, height - 25.5 * mm, 8 * mm, 8 * mm, mask="auto", preserveAspectRatio=True)
    c.setFillColor(TEXT_NAVY)
    c.setFont(FONT_BOLD, 13)
    c.drawString(margin + 14 * mm, height - 22.3 * mm, "ZunftEcho")
    c.setFillColor(MUTED)
    c.setFont(FONT_SEMIBOLD, 6.8)
    c.drawString(margin + 14 * mm, height - 25.1 * mm, "FÜR SHK-BETRIEBE")

    c.setFillColor(CYAN)
    c.setFont(FONT_BOLD, 8.4)
    c.drawString(margin, height - 38 * mm, "FÜR WEBAGENTUREN UND DIGITALISIERUNGSPARTNER")
    headline = "Aus einer guten SHK-Website wird ein verlässlicher Anfragekanal."
    y = draw_wrapped(c, headline, margin, height - 49 * mm, 150 * mm, FONT_BOLD, 25, 28, white)
    draw_wrapped(
        c,
        "ZunftEcho ergänzt bestehende Websites um einen strukturierten Anfrageablauf - ohne Relaunch.",
        margin,
        y - 3 * mm,
        154 * mm,
        FONT_REGULAR,
        11,
        14,
        HexColor("#DDEAF2"),
    )
    c.setFillColor(ORANGE)
    c.roundRect(margin, height - 84.5 * mm, 42 * mm, 3 * mm, 1.5 * mm, fill=1, stroke=0)

    # Three role/value cards.
    card_y = height - 156 * mm
    card_h = 56 * mm
    gap = 5 * mm
    card_w = (width - 2 * margin - 2 * gap) / 3
    draw_card(
        c,
        margin,
        card_y,
        card_w,
        card_h,
        "01",
        "Vollständigere Erstanfragen",
        ["Anliegen und Einsatzort", "Dringlichkeit und Erreichbarkeit", "Foto optional und Terminwunsch"],
        BLUE,
    )
    draw_card(
        c,
        margin + card_w + gap,
        card_y,
        card_w,
        card_h,
        "02",
        "Klare Rollen im Projekt",
        ["Die Agentur behält die Website", "ZunftEcho begleitet die Einrichtung", "Der SHK-Betrieb prüft und übernimmt"],
        ORANGE,
    )
    draw_card(
        c,
        margin + 2 * (card_w + gap),
        card_y,
        card_w,
        card_h,
        "03",
        "Saubere Grenzen",
        ["Demo nur mit Beispieldaten", "Keine Ferndiagnose oder Terminzusage", "Keine Provisions- oder Integrationszusage"],
        NAVY,
    )

    # Pilot flow.
    flow_y = height - 205 * mm
    c.setFillColor(WARM)
    c.setStrokeColor(HexColor("#F4D7B6"))
    c.roundRect(margin, flow_y, width - 2 * margin, 38 * mm, 5 * mm, fill=1, stroke=1)
    c.setFillColor(TEXT_NAVY)
    c.setFont(FONT_BOLD, 12.5)
    c.drawString(margin + 7 * mm, flow_y + 28 * mm, "So beginnt eine Zusammenarbeit")
    steps = [
        ("1", "Demo zeigen"),
        ("2", "Anwendungsfall prüfen"),
        ("3", "Pilot ausdrücklich bestätigen"),
        ("4", "Einbau und Übergabe testen"),
    ]
    start_x = margin + 7 * mm
    step_gap = 43.5 * mm
    for index, (number, label) in enumerate(steps):
        sx = start_x + index * step_gap
        c.setFillColor(BLUE if index < 3 else NAVY)
        c.circle(sx + 3 * mm, flow_y + 16 * mm, 3 * mm, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 7.8)
        c.drawCentredString(sx + 3 * mm, flow_y + 14.9 * mm, number)
        draw_wrapped(c, label, sx + 8 * mm, flow_y + 18.2 * mm, 31 * mm, FONT_SEMIBOLD, 8.2, 10, TEXT_NAVY)
        if index < 3:
            c.setStrokeColor(LINE)
            c.setLineWidth(1)
            c.line(sx + 36 * mm, flow_y + 16 * mm, sx + 41 * mm, flow_y + 16 * mm)
    c.setFont(FONT_REGULAR, 7.4)
    c.setFillColor(MUTED)
    c.drawString(margin + 7 * mm, flow_y + 6 * mm, "Pilotstart und Abrechnung erst nach Abschluss der rechtlichen Einrichtung.")

    # CTA area.
    cta_y = 19 * mm
    cta_h = 57 * mm
    c.setFillColor(NAVY)
    c.roundRect(margin, cta_y, width - 2 * margin, cta_h, 6 * mm, fill=1, stroke=0)
    c.setFillColor(CYAN)
    c.setFont(FONT_BOLD, 8.4)
    c.drawString(margin + 8 * mm, cta_y + 45 * mm, "DER NÄCHSTE SICHERE SCHRITT")
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 18)
    c.drawString(margin + 8 * mm, cta_y + 34 * mm, "Demo mit Beispieldaten öffnen")
    draw_wrapped(
        c,
        "Keine Anmeldung. Keine Weitergabe von Kundendaten. Der Betrieb entscheidet selbst.",
        margin + 8 * mm,
        cta_y + 24 * mm,
        112 * mm,
        FONT_REGULAR,
        9.2,
        12,
        HexColor("#DDEAF2"),
    )
    demo_url = "https://zunftecho.de/demo?source=partner-onepager-01"
    c.setFillColor(white)
    c.roundRect(margin + 8 * mm, cta_y + 8 * mm, 112 * mm, 10 * mm, 3 * mm, fill=1, stroke=0)
    c.setFillColor(TEXT_NAVY)
    c.setFont(FONT_SEMIBOLD, 8.2)
    c.drawString(margin + 12 * mm, cta_y + 11.8 * mm, demo_url)

    qr_widget = qr.QrCodeWidget(demo_url)
    bounds = qr_widget.getBounds()
    qr_size = 40 * mm
    scale = qr_size / max(bounds[2] - bounds[0], bounds[3] - bounds[1])
    c.setFillColor(white)
    c.roundRect(width - margin - 47.5 * mm, cta_y + 7 * mm, 43 * mm, 43 * mm, 4 * mm, fill=1, stroke=0)
    drawing = Drawing(qr_size, qr_size, transform=[scale, 0, 0, scale, 0, 0])
    drawing.add(qr_widget)
    renderPDF.draw(drawing, c, width - margin - 46 * mm, cta_y + 8.5 * mm)

    c.setFillColor(MUTED)
    c.setFont(FONT_REGULAR, 7.4)
    c.drawString(margin, 10 * mm, "ZunftEcho · zunftecho.de/partner · kontakt@zunftecho.de")
    c.drawRightString(width - margin, 10 * mm, "Stand: 12. September 2026")

    c.showPage()
    c.save()


if __name__ == "__main__":
    build_pdf()
