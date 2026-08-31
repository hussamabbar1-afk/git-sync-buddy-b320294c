from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

from generate_marketing_onepagers import (
    BLUE_DARK,
    BORDER,
    GREEN,
    LIGHT,
    LIGHT_BLUE,
    LIGHT_ORANGE,
    MARGIN,
    MUTED,
    NAVY,
    ORANGE,
    TEXT,
    WIDTH,
    HEIGHT,
    draw_check_line,
    draw_footer,
    draw_header,
    draw_qr,
    draw_wrapped,
    register_fonts,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "ZunftEcho-Vertrauensnachweis.pdf"


def draw_proof_card(
    pdf: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    title: str,
    text: str,
    accent,
) -> None:
    height = 78
    pdf.setFillColor(white)
    pdf.setStrokeColor(BORDER)
    pdf.roundRect(x, y, width, height, 12, stroke=1, fill=1)
    pdf.setFillColor(accent)
    pdf.roundRect(x + 12, y + height - 27, 6, 15, 3, stroke=0, fill=1)
    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 9.6)
    pdf.drawString(x + 26, y + height - 23, title)
    draw_wrapped(
        pdf,
        text,
        x + 14,
        y + height - 43,
        width - 28,
        size=7.7,
        leading=10.2,
        color=MUTED,
        max_lines=3,
    )


def create_trust_onepager(path: Path) -> None:
    pdf = canvas.Canvas(str(path), pagesize=A4)
    pdf.setTitle("ZunftEcho Vertrauensnachweis")
    pdf.setAuthor("ZunftEcho")
    pdf.setSubject("Prüfbare Zusagen, KI-Grenzen und Pilot-Rahmen")
    pdf.setFillColor(LIGHT)
    pdf.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)
    draw_header(pdf, "VERTRAUEN & SICHERHEIT")

    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 28)
    pdf.drawString(MARGIN, 724, "Prüfbar statt nur versprochen.")
    draw_wrapped(
        pdf,
        "ZunftEcho startet bewusst mit einer begrenzten Pilotgruppe. Vertrauen entsteht dabei nicht durch erfundene Referenzen, sondern durch einen testbaren Ablauf, klare Grenzen und transparente Bedingungen.",
        MARGIN,
        690,
        WIDTH - 2 * MARGIN,
        size=10.5,
        leading=15,
        color=MUTED,
    )

    gap = 10
    card_width = (WIDTH - 2 * MARGIN - gap) / 2
    draw_proof_card(
        pdf,
        MARGIN,
        569,
        card_width,
        "Live-Demo ohne Anmeldung",
        "Der zentrale Anfrageablauf kann vor einer Entscheidung selbst getestet werden.",
        BLUE_DARK,
    )
    draw_proof_card(
        pdf,
        MARGIN + card_width + gap,
        569,
        card_width,
        "Pilot endet automatisch",
        "30 Tage für 99 EUR netto. Keine automatische Verlängerung und keine Kreditkarte.",
        ORANGE,
    )
    draw_proof_card(
        pdf,
        MARGIN,
        481,
        card_width,
        "Datenwege offengelegt",
        "Datenschutz, Anbieterangaben und Bedingungen sind vorab öffentlich einsehbar.",
        GREEN,
    )
    draw_proof_card(
        pdf,
        MARGIN + card_width + gap,
        481,
        card_width,
        "Keine gekauften Referenzen",
        "Namen, Logos, Zitate und Kennzahlen werden nur nach ausdrücklicher Freigabe gezeigt.",
        BLUE_DARK,
    )

    pdf.setFillColor(white)
    pdf.setStrokeColor(BORDER)
    pdf.roundRect(MARGIN, 325, WIDTH - 2 * MARGIN, 132, 15, stroke=1, fill=1)
    pdf.setFillColor(BLUE_DARK)
    pdf.setFont("Zunft-Bold", 8.5)
    pdf.drawString(MARGIN + 18, 431, "KLARE KI-GRENZEN")
    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 14)
    pdf.drawString(MARGIN + 18, 408, "Die Software bereitet vor. Menschen entscheiden.")

    pdf.setFillColor(LIGHT_BLUE)
    pdf.roundRect(MARGIN + 18, 343, 235, 50, 10, stroke=0, fill=1)
    pdf.setFillColor(BLUE_DARK)
    pdf.setFont("Zunft-Bold", 8.5)
    pdf.drawString(MARGIN + 30, 378, "ZUNFTECHO KANN")
    draw_wrapped(
        pdf,
        "Anfragen strukturieren, Informationen sammeln und kritische Fälle an Menschen übergeben.",
        MARGIN + 30,
        362,
        210,
        size=7.5,
        leading=9.5,
        color=TEXT,
    )

    pdf.setFillColor(LIGHT_ORANGE)
    pdf.roundRect(MARGIN + 263, 343, 238, 50, 10, stroke=0, fill=1)
    pdf.setFillColor(ORANGE)
    pdf.setFont("Zunft-Bold", 8.5)
    pdf.drawString(MARGIN + 275, 378, "ZUNFTECHO ENTSCHEIDET NICHT")
    draw_wrapped(
        pdf,
        "Keine verbindlichen Preise, keine ungeprüften Zusagen und kein Ersatz für Fachpersonal.",
        MARGIN + 275,
        362,
        212,
        size=7.5,
        leading=9.5,
        color=TEXT,
    )

    pdf.setFillColor(NAVY)
    pdf.roundRect(MARGIN, 138, WIDTH - 2 * MARGIN, 162, 16, stroke=0, fill=1)
    pdf.setFillColor(HexColor("#9FDBF5"))
    pdf.setFont("Zunft-Bold", 8.5)
    pdf.drawString(MARGIN + 18, 274, "TECHNISCHER STAND - 31.08.2026")
    pdf.setFillColor(white)
    pdf.setFont("Zunft-Bold", 16)
    pdf.drawString(MARGIN + 18, 251, "Dokumentierter Produktcheck vor dem Pilot")
    draw_check_line(
        pdf,
        MARGIN + 18,
        224,
        "Produktions-Build und automatisierter Smoke-Test bestanden",
        340,
        HexColor("#EAF3F8"),
    )
    draw_check_line(
        pdf,
        MARGIN + 18,
        205,
        "Öffentliche Testwege, Datenschutz und KI-Grenzen dokumentiert",
        340,
        HexColor("#EAF3F8"),
    )
    pdf.setFillColor(HexColor("#BFD2DE"))
    pdf.setFont("Zunft", 7.4)
    pdf.drawString(MARGIN + 18, 171, "Keine unabhängige Zertifizierung und kein Penetrationstest.")

    pdf.setFillColor(white)
    pdf.roundRect(445, 162, 92, 113, 11, stroke=0, fill=1)
    draw_qr(pdf, "https://zunftecho.de/vertrauen?source=pdf-trust-onepager", 452, 181, 78)
    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 7.2)
    pdf.drawCentredString(491, 170, "Nachweise prüfen")

    pdf.setFillColor(TEXT)
    pdf.setFont("Zunft-Bold", 10.5)
    pdf.drawString(MARGIN, 105, "Entscheiden Sie erst, nachdem Sie den Ablauf selbst geprüft haben.")
    pdf.setFillColor(MUTED)
    pdf.setFont("Zunft", 8)
    pdf.drawString(MARGIN, 88, "Live-Demo, Bedingungen und Nachweise: zunftecho.de/vertrauen")
    draw_footer(pdf, "Vertrauensnachweis | Stand 31.08.2026")
    pdf.showPage()
    pdf.save()


def main() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    create_trust_onepager(OUTPUT)
    print(f"created {OUTPUT}")


if __name__ == "__main__":
    main()
