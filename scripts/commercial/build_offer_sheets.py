from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf"

INK = HexColor("#12151C")
PAPER = HexColor("#F3F1EA")
BLUE = HexColor("#2457FF")
LIME = HexColor("#D7FF3F")
ORANGE = HexColor("#FF6338")
MUTED = HexColor("#5C626D")
WHITE = HexColor("#FFFFFF")


OFFERS = [
    {
        "filename": "perpetual-core-operating-system-map.pdf",
        "index": "01",
        "name": "OPERATING\nSYSTEM MAP",
        "price": "$7.5K-$15K",
        "term": "1-2 WEEKS",
        "accent": LIME,
        "buyer": "For leaders who know disconnected work is costing the organization, but need evidence before choosing the first investment.",
        "outcome": "A decision-ready map of the first workflow, its economics, authority boundaries, implementation range, and 90-day sequence.",
        "scope": [
            "Executive and operator discovery",
            "Current-state workflow and system map",
            "Friction, risk, and value analysis",
            "Prioritized first-workflow specification",
            "Implementation range and 90-day sequence",
        ],
        "sequence": ["Diagnose the operation", "Choose the first workflow", "Define the next investment"],
        "boundary": "This is a paid decision engagement. It does not promise implementation outcomes or authorize consequential automated actions.",
        "cta": "REQUEST THE MAP",
        "url": "perpetualcore.com/contact-sales?intent=operating-system-map",
    },
    {
        "filename": "perpetual-core-workflow-proof-sprint.pdf",
        "index": "02",
        "name": "WORKFLOW\nPROOF SPRINT",
        "price": "$30K-$75K",
        "term": "4-8 WEEKS",
        "accent": BLUE,
        "buyer": "For leaders with one recurring workflow, a named operating owner, and a visible cost in time, revenue, quality, or visibility.",
        "outcome": "One bounded production workflow with explicit approval gates, operator training, launch evidence, and an agreed proof-of-value review.",
        "scope": [
            "Signed workflow specification and measures",
            "Configured or custom production workflow",
            "Integration, permission, and authority boundaries",
            "Operator training and operating runbook",
            "Launch evidence and outcome-review plan",
        ],
        "sequence": ["Baseline and scope", "Build and test", "Launch and review evidence"],
        "boundary": "Scope and acceptance criteria are agreed before build. Outcomes affected by adoption, customers, or third parties are measured - not guaranteed.",
        "cta": "SCOPE THE SPRINT",
        "url": "perpetualcore.com/contact-sales?intent=workflow-proof-sprint",
    },
    {
        "filename": "perpetual-core-managed-operating-lane.pdf",
        "index": "03",
        "name": "MANAGED\nOPERATING LANE",
        "price": "$10K-$35K/MO",
        "term": "90-DAY INITIAL TERM",
        "accent": ORANGE,
        "buyer": "For leaders whose strategically important workflow needs ongoing capacity, operating ownership, exception visibility, and monthly decisions.",
        "outcome": "A named operating lane with explicit capacity, service boundaries, approval rules, evidence reporting, and a monthly improvement rhythm.",
        "scope": [
            "Named lane, capacity, and service boundaries",
            "Monthly operating cadence and managed queue",
            "Human approval and escalation rules",
            "Evidence and exception reporting",
            "Monthly performance and expansion review",
        ],
        "sequence": ["Establish the baseline", "Operate the named lane", "Renew, expand, or hand off"],
        "boundary": "Renewal and expansion require explicit written agreement. The initial term creates time to establish an honest operating baseline.",
        "cta": "DESIGN THE LANE",
        "url": "perpetualcore.com/contact-sales?intent=managed-operating-lane",
    },
]


def wrapped_lines(text: str, font: str, size: float, width: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_paragraph(c: canvas.Canvas, text: str, x: float, y: float, width: float, font: str, size: float, leading: float, color) -> float:
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrapped_lines(text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_offer(offer: dict) -> Path:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    path = OUTPUT / offer["filename"]
    c = canvas.Canvas(str(path), pagesize=letter, pageCompression=1)
    width, height = letter

    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(INK)
    c.rect(0, height - 84, width, 84, fill=1, stroke=0)
    c.setFillColor(offer["accent"])
    c.roundRect(36, height - 61, 30, 30, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.circle(51, height - 46, 5, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(78, height - 50, "PERPETUAL CORE")
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(HexColor("#AEB3BE"))
    c.drawRightString(width - 36, height - 49, "GOVERNED AI OPERATING SYSTEMS")

    c.setFillColor(offer["accent"])
    c.roundRect(36, height - 132, 34, 20, 10, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(53, height - 125, offer["index"])
    c.setFillColor(MUTED)
    c.drawString(80, height - 125, offer["term"])

    title_y = height - 174
    c.setFillColor(INK)
    title_size = 31 if offer["index"] == "03" else 35
    c.setFont("Helvetica-Bold", title_size)
    for line in offer["name"].split("\n"):
        c.drawString(36, title_y, line)
        title_y -= 34
    c.setFillColor(offer["accent"])
    c.setFont("Helvetica-Bold", 23)
    c.drawString(36, title_y - 4, offer["price"])

    right_x = 330
    right_w = 246
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(right_x, height - 125, "BEST WHEN")
    y = draw_paragraph(c, offer["buyer"], right_x, height - 149, right_w, "Helvetica-Bold", 11, 16, INK)
    c.setStrokeColor(HexColor("#CBC8BF"))
    c.line(right_x, y - 7, width - 36, y - 7)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(INK)
    c.drawString(right_x, y - 28, "THE OPERATING RESULT")
    draw_paragraph(c, offer["outcome"], right_x, y - 52, right_w, "Helvetica", 10.5, 15, MUTED)

    divider_y = 474
    c.setStrokeColor(HexColor("#CBC8BF"))
    c.line(36, divider_y, width - 36, divider_y)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(36, divider_y - 28, "INCLUDED IN THE ENGAGEMENT")
    bullet_y = divider_y - 53
    for item in offer["scope"]:
        c.setFillColor(offer["accent"])
        c.circle(42, bullet_y + 3, 3, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(54, bullet_y, item)
        bullet_y -= 24

    sequence_y = 292
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(36, sequence_y, "HOW THE ENGAGEMENT MOVES")
    box_y = sequence_y - 62
    box_w = 168
    gap = 12
    for index, label in enumerate(offer["sequence"], start=1):
        x = 36 + (index - 1) * (box_w + gap)
        c.setFillColor(WHITE)
        c.roundRect(x, box_y, box_w, 46, 10, fill=1, stroke=0)
        c.setFillColor(offer["accent"])
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 12, box_y + 27, f"0{index}")
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x + 12, box_y + 13, label)

    boundary_y = 150
    c.setFillColor(INK)
    c.roundRect(36, boundary_y, width - 72, 62, 12, fill=1, stroke=0)
    c.setFillColor(offer["accent"])
    c.setFont("Helvetica-Bold", 8)
    c.drawString(52, boundary_y + 42, "COMMERCIAL AND AUTHORITY BOUNDARY")
    draw_paragraph(c, offer["boundary"], 52, boundary_y + 25, width - 104, "Helvetica", 8.8, 12, WHITE)

    c.setFillColor(offer["accent"])
    c.roundRect(36, 78, 204, 58, 14, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(54, 111, offer["cta"])
    c.setFont("Helvetica", 7.5)
    c.drawString(54, 94, offer["url"])
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawRightString(width - 36, 111, "Every request is reviewed by a human.")
    c.drawRightString(width - 36, 96, "Scope, timing, and fit are confirmed in writing.")

    c.setStrokeColor(HexColor("#CBC8BF"))
    c.line(36, 52, width - 36, 52)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(36, 36, "PERPETUALCORE.COM")
    c.drawRightString(width - 36, 36, "Human authority  |  Explicit boundaries  |  Evidence attached")

    c.setTitle(f"Perpetual Core - {offer['name'].replace(chr(10), ' ').title()}")
    c.setAuthor("Perpetual Core LLC")
    c.showPage()
    c.save()
    return path


if __name__ == "__main__":
    for item in OFFERS:
        print(draw_offer(item))
