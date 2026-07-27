#!/usr/bin/env python3
"""The BIG Lie — 'how long it takes to watch what they handed you'.

Every figure is either a government filing, a government-adopted defense metric,
or plain arithmetic that is shown on the chart.

Run from website/:  python3 scripts/gen-review-time.py
"""
import os
import shutil
import subprocess

BG = "#12152b"; DEEP = "#0e1122"; GOLD = "#d9b32a"; WHITE = "#f4f5f9"
MUTED = "#a8adc4"; MUTED2 = "#7c81a0"; BLUE = "#8a93f8"; RED = "#e0533f"
GREEN = "#4cc38a"; ORANGE = "#e0913f"; BORDER = "#2b2f56"; PANEL = "#1b1f3e"

OUT = "public/thebiglie/charts"

# (days, label, sublabel, color)
ROWS = [
    (102, "102 days", "The government's own estimate to view its 9 terabytes.",
     "Feb 2022 discovery filing. Watching around the clock.", GREEN),
    (248, "248 days", "The government's own adopted figure for the CCTV it produced.",
     "Quoted from a defendant's math in its Dec 2023 filing.", BLUE),
    (600, "600 days", "4,800 hours at eight hours a day.",
     "What actually reached defendants. One pass. No notes, no re-watching.", ORANGE),
    (1833, "1,833 days", "44,000 hours, watching every hour of every day.",
     "Five straight years without sleeping.", RED),
    (5500, "5,500 days", "44,000 hours at eight hours a day.",
     "Fifteen years. To watch it once.", RED),
]
HELD = 548  # 18 months awaiting trial, as stated in the report


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build_svg():
    W = 1160
    left = 34
    top = 200
    rh = 96
    H = top + len(ROWS) * rh + 250
    lab = 430
    bx0 = left + lab
    bmax = W - 210
    scale = (bmax - bx0) / 5500.0

    s = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img" '
         'aria-label="Bar chart of how many days it takes to watch January 6 discovery '
         'footage, against the 548 days Ryan Nichols was held awaiting trial.">' % (W, H)]
    s.append('<rect width="%d" height="%d" fill="%s"/>' % (W, H, BG))
    s.append('<text x="%d" y="52" font-family="Inter,Helvetica,sans-serif" font-size="26" '
             'font-weight="900" fill="%s">HOW LONG IT TAKES TO WATCH IT</text>' % (left, WHITE))
    s.append('<text x="%d" y="80" font-family="Inter,Helvetica,sans-serif" font-size="14.5" '
             'fill="%s">Days required to review the footage, against the time I was actually '
             'held awaiting trial.</text>' % (left, MUTED))

    # the resources band
    s.append('<rect x="%d" y="104" width="%d" height="62" rx="10" fill="%s" stroke="%s" '
             'stroke-width="1.5"/>' % (left, W - left * 2, DEEP, ORANGE))
    s.append('<text x="%d" y="127" font-family="Inter,Helvetica,sans-serif" font-size="10.5" '
             'font-weight="800" letter-spacing="1.8" fill="%s">WHAT WE HAD TO REVIEW IT WITH</text>'
             % (left + 16, ORANGE))
    s.append('<text x="%d" y="151" font-family="Inter,Helvetica,sans-serif" font-size="14" '
             'fill="%s">23 shared laptops for the whole jail. Two week checkout. A waiting list. '
             'One tablet app. Months at a stretch with no access at all.</text>' % (left + 16, WHITE))

    # gridlines
    for d in (0, 1000, 2000, 3000, 4000, 5500):
        gx = bx0 + d * scale
        s.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke="%s" stroke-width="1"/>'
                 % (gx, top - 14, gx, top + len(ROWS) * rh - 16, BORDER))
        lbl = "5,500" if d == 5500 else ("%d,000" % (d // 1000) if d else "0")
        s.append('<text x="%.1f" y="%d" text-anchor="middle" font-family="Inter,Helvetica,sans-serif" '
                 'font-size="11.5" font-weight="700" fill="%s">%s</text>' % (gx, top - 22, MUTED2, lbl))
    s.append('<text x="%.0f" y="%d" text-anchor="middle" font-family="Inter,Helvetica,sans-serif" '
             'font-size="10.5" font-weight="800" letter-spacing="2.4" fill="%s">DAYS</text>'
             % ((bx0 + bmax) / 2, top - 44, MUTED2))

    # the "held" marker line, drawn behind the bars
    hx = bx0 + HELD * scale
    s.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke="%s" stroke-width="2.5" '
             'stroke-dasharray="7 5"/>' % (hx, top - 14, hx, top + len(ROWS) * rh + 6, GOLD))

    for i, (days, big, title, note, col) in enumerate(ROWS):
        y = top + i * rh
        if i % 2 == 0:
            s.append('<rect x="%d" y="%d" width="%d" height="%d" rx="8" fill="%s" fill-opacity=".45"/>'
                     % (14, y - 14, W - 28, rh - 10, PANEL))
        s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="15.5" '
                 'font-weight="800" fill="%s">%s</text>' % (left, y + 12, WHITE, esc(title)))
        s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="12.2" '
                 'fill="%s">%s</text>' % (left, y + 34, MUTED, esc(note)))
        bw = max(days * scale, 5)
        s.append('<rect x="%d" y="%d" width="%.1f" height="32" rx="6" fill="%s" fill-opacity=".82" '
                 'stroke="%s" stroke-width="1.6"/>' % (bx0, y - 2, bw, col, col))
        s.append('<text x="%.1f" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="17" '
                 'font-weight="900" fill="%s">%s</text>' % (bx0 + bw + 13, y + 21, col, big))

    # marker label
    my = top + len(ROWS) * rh + 26
    s.append('<text x="%.1f" y="%d" text-anchor="middle" font-family="Inter,Helvetica,sans-serif" '
             'font-size="12" font-weight="800" letter-spacing="1.2" fill="%s">548 DAYS</text>'
             % (hx, my, GOLD))
    s.append('<text x="%.1f" y="%d" text-anchor="middle" font-family="Inter,Helvetica,sans-serif" '
             'font-size="11.5" fill="%s">the 18 months I sat in a cell awaiting trial</text>'
             % (hx, my + 18, MUTED))

    fy = my + 40
    s.append('<rect x="%d" y="%d" width="%d" height="96" rx="10" fill="%s" stroke="%s" '
             'stroke-width="1.5"/>' % (14, fy, W - 28, DEEP, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.8" fill="%s">READ THAT AGAIN</text>' % (30, fy + 26, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14" fill="%s">'
             'Watching a single pass of what they actually handed me takes longer than the entire time '
             'I was held. Watching everything that</text>' % (30, fy + 52, WHITE))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14" fill="%s">'
             'existed, eight hours a day, takes fifteen years. They called that a fair opportunity to '
             'prepare a defense.</text>' % (30, fy + 74, WHITE))

    s.append('<text x="%d" y="%d" text-anchor="end" font-family="Inter,Helvetica,sans-serif" '
             'font-size="11" font-weight="800" letter-spacing="1.6" fill="%s">REALRYANNICHOLS.COM</text>'
             % (W - left, H - 18, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.6" fill="%s">THE TIME IT TAKES</text>'
             % (left, H - 18, MUTED2))
    s.append("</svg>")
    return "".join(s)


def main():
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, "review-time.svg")
    with open(p, "w") as f:
        f.write(build_svg())
    print("wrote", p)
    print("math: 44000/8=%d days = %.1f yrs | 4800/8=%d | 44000/24=%d"
          % (44000 / 8, 44000 / 8 / 365, 4800 / 8, 44000 / 24))

    tmp = "/tmp/qlrt"
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp, exist_ok=True)
    subprocess.run(["qlmanage", "-t", "-s", "1200", "-o", tmp, p], capture_output=True, check=False)
    made = [x for x in os.listdir(tmp) if x.endswith(".png")]
    if not made:
        print("no png")
        return
    dst = os.path.join(OUT, "review-time.png")
    try:
        from PIL import Image
        im = Image.open(os.path.join(tmp, made[0])).convert("RGB")
        bg = Image.new("RGB", im.size, BG)
        bg.paste(im)
        bg.save(dst, "PNG", optimize=True)
    except Exception:
        shutil.copy(os.path.join(tmp, made[0]), dst)
    print("wrote", dst, os.path.getsize(dst), "bytes")


if __name__ == "__main__":
    main()
