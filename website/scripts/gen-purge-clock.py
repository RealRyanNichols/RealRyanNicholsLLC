#!/usr/bin/env python3
"""The BIG Lie — THE 30-DAY CLOCK.

Capitol Police footage deletes itself. DiBiase, ECF 71-1 fn.1: "Without
affirmative preservation, all Department footage is automatically purged within
30 days." So every hour that survived, survived because somebody asked for it
inside a 30-day window. Nothing had to be decided to destroy the rest.

Run from website/:  python3 scripts/gen-purge-clock.py
"""
import datetime as dt
import os
import shutil
import subprocess

BG = "#12152b"; DEEP = "#0e1122"; GOLD = "#d9b32a"; WHITE = "#f4f5f9"
MUTED = "#a8adc4"; MUTED2 = "#7c81a0"; BLUE = "#8a93f8"; RED = "#e0533f"
GREEN = "#4cc38a"; ORANGE = "#e0913f"; BORDER = "#2b2f56"; PANEL = "#1b1f3e"
DIM = "#232752"
OUT = "public/thebiglie/charts"

START = dt.date(2020, 12, 22)
END = dt.date(2021, 2, 12)
EVENT = dt.date(2021, 1, 6)

# (source date, status, label)
#   preserved = named in DiBiase's sworn accounting
#   archive   = Pope observed it in the House archive, not in the sworn accounting
ROWS = [
    (dt.date(2020, 12, 28), "archive", "Dec 28"),
    (dt.date(2020, 12, 30), "archive", "Dec 30"),
    (dt.date(2021, 1, 1), "archive", "Jan 1"),
    (dt.date(2021, 1, 3), "preserved", "Jan 3"),
    (dt.date(2021, 1, 4), "preserved", "Jan 4"),
    (dt.date(2021, 1, 5), "preserved", "Jan 5"),
    (dt.date(2021, 1, 6), "event", "Jan 6"),
]


def build_svg():
    W = 1180
    left = 150
    right = 60
    top = 300
    rh = 62
    H = top + len(ROWS) * rh + 300
    axis_w = W - left - right
    span = (END - START).days
    def X(d):
        return left + (d - START).days / span * axis_w

    s = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img" '
         'aria-label="Timeline showing that Capitol Police footage auto-deletes after 30 days, '
         'with the purge deadline for each date from December 28 2020 through January 6 2021.">'
         % (W, H)]
    s.append('<rect width="%d" height="%d" fill="%s"/>' % (W, H, BG))
    s.append('<text x="36" y="54" font-family="Inter,Helvetica,sans-serif" font-size="27" '
             'font-weight="900" fill="%s">THE 30-DAY CLOCK</text>' % WHITE)
    s.append('<text x="36" y="82" font-family="Inter,Helvetica,sans-serif" font-size="14.5" '
             'fill="%s">Capitol Police footage deletes itself. Everything that survived, survived '
             'because somebody asked for it in time.</text>' % MUTED)

    # the quote
    s.append('<rect x="36" y="104" width="%d" height="86" rx="12" fill="%s" stroke="%s" '
             'stroke-width="2"/>' % (W - 72, DEEP, ORANGE))
    s.append('<text x="56" y="132" font-family="Inter,Helvetica,sans-serif" font-size="10.5" '
             'font-weight="800" letter-spacing="1.7" fill="%s">SWORN &#183; USCP GENERAL COUNSEL '
             'THOMAS DiBIASE &#183; ECF 71-1, FOOTNOTE 1</text>' % ORANGE)
    s.append('<text x="56" y="166" font-family="Georgia,serif" font-size="19" font-style="italic" '
             'fill="%s">&#8220;Without affirmative preservation, all Department footage is '
             'automatically purged within 30 days.&#8221;</text>' % WHITE)

    s.append('<text x="36" y="222" font-family="Inter,Helvetica,sans-serif" font-size="14" '
             'fill="%s">Nobody has to decide to destroy anything. The clock does it. Each bar below '
             'is one day of footage and how long there was to ask for it.</text>' % MUTED)

    # axis
    ay = top - 34
    s.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke="%s" stroke-width="2"/>'
             % (left, ay, W - right, ay, BORDER))
    d = START
    while d <= END:
        if d.day in (1, 15) or d == START:
            x = X(d)
            s.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke="%s" stroke-width="1"/>'
                     % (x, ay, x, top + len(ROWS) * rh - 10, BORDER))
            s.append('<text x="%.1f" y="%d" text-anchor="middle" font-family="Inter,Helvetica,'
                     'sans-serif" font-size="11.5" font-weight="700" fill="%s">%s</text>'
                     % (x, ay - 10, MUTED2, d.strftime("%b %-d")))
        d += dt.timedelta(days=1)

    # the event marker
    ex = X(EVENT)
    s.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke="%s" stroke-width="2.5" '
             'stroke-dasharray="6 4"/>' % (ex, ay, ex, top + len(ROWS) * rh + 8, RED))
    s.append('<text x="%.1f" y="%d" text-anchor="middle" font-family="Inter,Helvetica,sans-serif" '
             'font-size="11.5" font-weight="800" letter-spacing="1.2" fill="%s">JANUARY 6</text>'
             % (ex, ay - 30, RED))

    for i, (src, status, lab) in enumerate(ROWS):
        y = top + i * rh
        purge = src + dt.timedelta(days=30)
        if i % 2 == 0:
            s.append('<rect x="14" y="%d" width="%d" height="%d" rx="8" fill="%s" fill-opacity=".4"/>'
                     % (y - 16, W - 28, rh - 8, PANEL))
        col = GREEN if status == "preserved" else (GOLD if status == "event" else BLUE)
        s.append('<text x="36" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="15" '
                 'font-weight="800" fill="%s">%s</text>' % (y + 6, WHITE, lab))
        x0, x1 = X(src), X(purge)
        s.append('<rect x="%.1f" y="%d" width="%.1f" height="20" rx="5" fill="%s" fill-opacity=".28" '
                 'stroke="%s" stroke-width="1.4" stroke-dasharray="5 4"/>'
                 % (x0, y - 10, x1 - x0, col, col))
        s.append('<circle cx="%.1f" cy="%d" r="6" fill="%s"/>' % (x0, y, col))
        s.append('<text x="%.1f" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11.5" '
                 'font-weight="800" fill="%s">gone %s</text>'
                 % (x1 + 10, y + 4, col, purge.strftime("%b %-d")))

    # legend
    ly = top + len(ROWS) * rh + 26
    legs = [
        (GREEN, "In the sworn accounting", "DiBiase named Jan 3, 4, 5 and Jan 6 in the 41,057 hours."),
        (BLUE, "In the House archive, not in the sworn accounting",
         "Pope reviewed CHA terminals holding Dec 28 onward. No sworn figure covers those days."),
        (RED, "The eight hours preserved immediately", "Noon to 8 PM on January 6. That was the whole first decision."),
    ]
    for k, (col, t, n) in enumerate(legs):
        yy = ly + k * 30
        s.append('<rect x="36" y="%d" width="14" height="14" rx="3" fill="%s" fill-opacity=".6" '
                 'stroke="%s" stroke-width="1.4"/>' % (yy, col, col))
        s.append('<text x="60" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="13.6" '
                 'font-weight="800" fill="%s">%s</text>' % (yy + 12, WHITE, t))
        s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="12.4" '
                 'fill="%s">%s</text>' % (560, yy + 12, MUTED, n))

    fy = ly + 3 * 30 + 16
    s.append('<rect x="36" y="%d" width="%d" height="118" rx="12" fill="%s" stroke="%s" '
             'stroke-width="2"/>' % (fy, W - 72, DEEP, GOLD))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.8" fill="%s">WHAT THIS MEANS</text>' % (fy + 28, GOLD))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14.5" fill="%s">'
             'The first preservation was eight hours. Noon to eight, on one day. Everything else in this '
             'chart survived only because a</text>' % (fy + 56, WHITE))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14.5" fill="%s">'
             'committee asked later, and every request had a deadline it did not set. Whatever nobody '
             'asked for in time was deleted</text>' % (fy + 78, WHITE))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14.5" fill="%s">'
             'automatically, with no order, no log, and no way to ever know what it was.</text>'
             % (fy + 100, WHITE))

    s.append('<text x="%d" y="%d" text-anchor="end" font-family="Inter,Helvetica,sans-serif" '
             'font-size="11" font-weight="800" letter-spacing="1.6" fill="%s">REALRYANNICHOLS.COM</text>'
             % (W - 36, H - 20, GOLD))
    s.append('<text x="36" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.6" fill="%s">THE 30-DAY CLOCK</text>' % (H - 20, MUTED2))
    s.append("</svg>")
    return "".join(s)


def main():
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, "purge-clock.svg")
    with open(p, "w") as f:
        f.write(build_svg())
    print("wrote", p)
    for src, _, lab in ROWS:
        print("  %-7s -> purges %s" % (lab, (src + dt.timedelta(days=30)).strftime("%b %-d %Y")))

    tmp = "/tmp/qlpurge"
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp, exist_ok=True)
    subprocess.run(["qlmanage", "-t", "-s", "1200", "-o", tmp, p], capture_output=True, check=False)
    made = [x for x in os.listdir(tmp) if x.endswith(".png")]
    if not made:
        print("no png")
        return
    dst = os.path.join(OUT, "purge-clock.png")
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
