#!/usr/bin/env python3
"""The BIG Lie — THE PRESERVATION GAP.

The arithmetic that does not work:
  USCP policy purges video in 30 days (Directive 1000.002, eff. 02/06/2015).
  DiBiase swore (executed 3/17/2021) the Department preserved Jan 6 footage
  "starting at noon and continuing until 8:00 p.m." — eight hours.
  USCP later gave the Select Committee 28,386 hours covering Jan 3, 4, 5 and
  the morning of Jan 6 — all of which passed their 30-day deadline by ~Feb 5.
  The Select Committee did not exist until H.Res. 503, June 30, 2021.

  Something preserved those days in January 2021. No sworn statement says what.

Run from website/:  python3 scripts/gen-preservation-gap.py
"""
import datetime as dt
import os
import shutil
import subprocess

BG = "#12152b"; DEEP = "#0e1122"; GOLD = "#d9b32a"; WHITE = "#f4f5f9"
MUTED = "#a8adc4"; MUTED2 = "#7c81a0"; BLUE = "#8a93f8"; RED = "#e0533f"
GREEN = "#4cc38a"; ORANGE = "#e0913f"; BORDER = "#2b2f56"; PANEL = "#1b1f3e"
OUT = "public/thebiglie/charts"

START = dt.date(2020, 12, 28)
END = dt.date(2021, 7, 20)

MARKS = [
    (dt.date(2021, 1, 6), "JANUARY 6", "The event.", RED, 1),
    (dt.date(2021, 1, 10), "JAN 10-11", "The only transfer documents in evidence. Information Sharing "
     "Agreements with the FBI and MPD. They govern control, not preservation, and name no date range.", MUTED, -1),
    (dt.date(2021, 2, 5), "~FEB 5", "By now every day from Jan 3 through Jan 6 has passed its 30-day "
     "deletion deadline.", ORANGE, 1),
    (dt.date(2021, 3, 17), "MARCH 17", "DiBiase swears the Department preserved footage "
     "“starting at noon and continuing until 8:00 p.m.” Eight hours.", BLUE, -1),
    (dt.date(2021, 6, 30), "JUNE 30", "H.Res. 503. The Select Committee comes into existence. "
     "Five months after that footage would have deleted itself.", GREEN, 1),
]


def build_svg():
    W = 1180
    left = 60
    right = 60
    axis_y = 330
    H = 980
    aw = W - left - right
    span = (END - START).days

    def X(d):
        return left + (d - START).days / span * aw

    s = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img" '
         'aria-label="Timeline showing that 28,386 hours of footage from January 3 through 6 2021 '
         'passed a 30-day deletion deadline in early February, five months before the Select '
         'Committee that received it existed.">' % (W, H)]
    s.append('<rect width="%d" height="%d" fill="%s"/>' % (W, H, BG))
    s.append('<text x="36" y="56" font-family="Inter,Helvetica,sans-serif" font-size="28" '
             'font-weight="900" fill="%s">THE PRESERVATION GAP</text>' % WHITE)
    s.append('<text x="36" y="86" font-family="Inter,Helvetica,sans-serif" font-size="15" '
             'fill="%s">28,386 hours survived a deadline that should have deleted them, five months '
             'before anyone asked for them.</text>' % MUTED)

    # the purge zone
    z0, z1 = X(dt.date(2021, 2, 2)), X(dt.date(2021, 2, 5))
    s.append('<rect x="%.1f" y="%d" width="%.1f" height="%d" fill="%s" fill-opacity=".16"/>'
             % (z0, 150, max(z1 - z0, 6), 300, ORANGE))

    # axis
    s.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke="%s" stroke-width="3"/>'
             % (left, axis_y, W - right, axis_y, BORDER))
    d = dt.date(2021, 1, 1)
    while d <= END:
        x = X(d)
        s.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke="%s" stroke-width="1.2"/>'
                 % (x, axis_y, x, axis_y + 10, BORDER))
        s.append('<text x="%.1f" y="%d" text-anchor="middle" font-family="Inter,Helvetica,sans-serif" '
                 'font-size="11.5" font-weight="700" fill="%s">%s</text>'
                 % (x, axis_y + 28, MUTED2, d.strftime("%b")))
        d = (d.replace(day=28) + dt.timedelta(days=5)).replace(day=1)

    for date, lab, txt, col, side in MARKS:
        x = X(date)
        ty = axis_y - 40 if side > 0 else axis_y + 54
        bh = 96
        by = ty - bh if side > 0 else ty
        s.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.8"/>'
                 % (x, axis_y, x, ty if side > 0 else ty, col))
        bx = min(max(x - 150, 14), W - 314)
        s.append('<rect x="%.1f" y="%.1f" width="300" height="%d" rx="10" fill="%s" stroke="%s" '
                 'stroke-width="1.6"/>' % (bx, by, bh, PANEL, col))
        s.append('<text x="%.1f" y="%.1f" font-family="Inter,Helvetica,sans-serif" font-size="12" '
                 'font-weight="900" letter-spacing="1.4" fill="%s">%s</text>' % (bx + 14, by + 24, col, lab))
        # wrap
        words = txt.split()
        line, yy = "", by + 46
        for w in words:
            if len(line) + len(w) + 1 > 42:
                s.append('<text x="%.1f" y="%.1f" font-family="Inter,Helvetica,sans-serif" '
                         'font-size="11.8" fill="%s">%s</text>' % (bx + 14, yy, WHITE, line))
                line, yy = w, yy + 16
            else:
                line = (line + " " + w).strip()
        if line:
            s.append('<text x="%.1f" y="%.1f" font-family="Inter,Helvetica,sans-serif" '
                     'font-size="11.8" fill="%s">%s</text>' % (bx + 14, yy, WHITE, line))
        s.append('<circle cx="%.1f" cy="%d" r="8" fill="%s" stroke="%s" stroke-width="3"/>'
                 % (x, axis_y, DEEP, col))

    # the 69% bar
    by = 540
    s.append('<text x="36" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.8" fill="%s">THE 41,057 HOURS THE SELECT COMMITTEE '
             'RECEIVED, SPLIT BY WHETHER ANY SWORN STATEMENT ACCOUNTS FOR IT</text>' % (by, GOLD))
    bw = W - 72
    scale = bw / 41057.0
    a = 12671 * scale
    s.append('<rect x="36" y="%d" width="%.1f" height="70" rx="8" fill="%s" fill-opacity=".85"/>'
             % (by + 18, a, BLUE))
    s.append('<rect x="%.1f" y="%d" width="%.1f" height="70" rx="8" fill="%s" fill-opacity=".85"/>'
             % (36 + a, by + 18, 28386 * scale, RED))
    s.append('<text x="54" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="21" '
             'font-weight="900" fill="#0b1830">12,671</text>' % (by + 50))
    s.append('<text x="54" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11.5" '
             'font-weight="700" fill="#0b1830">31%% &#183; inside the sworn window</text>' % (by + 68))
    s.append('<text x="%.1f" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="21" '
             'font-weight="900" fill="%s">28,386</text>' % (36 + a + 20, by + 50, WHITE))
    s.append('<text x="%.1f" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11.5" '
             'font-weight="700" fill="%s">69%% &#183; no sworn statement accounts for how it survived</text>'
             % (36 + a + 20, by + 68, WHITE))

    # per camera
    cy = by + 116
    s.append('<rect x="36" y="%d" width="%d" height="70" rx="10" fill="%s" stroke="%s" '
             'stroke-width="1.5"/>' % (cy, bw, DEEP, BORDER))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14.5" fill="%s">'
             'Per camera that is <tspan font-weight="900" fill="%s">51 hours</tspan> of footage &#8212; '
             '15 hours a day across January 3, 4 and 5, plus 6 hours on the morning of January 6 &#8212; '
             'preserved</text>' % (cy + 30, WHITE, GOLD))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14.5" fill="%s">'
             'entirely outside the only preservation anyone has ever sworn to.</text>' % (cy + 52, WHITE))

    fy = cy + 90
    s.append('<rect x="36" y="%d" width="%d" height="130" rx="12" fill="%s" stroke="%s" '
             'stroke-width="2"/>' % (fy, bw, DEEP, GOLD))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.8" fill="%s">THE QUESTION NOBODY HAS ANSWERED</text>'
             % (fy + 28, GOLD))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="15" fill="%s">'
             'Somebody preserved January 3, 4 and 5 in January of 2021, before the deadline ran, and '
             'before any committee that</text>' % (fy + 58, WHITE))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="15" fill="%s">'
             'later received it even existed. There is no preservation order in the public record. '
             'No litigation hold. No directive.</text>' % (fy + 82, WHITE))
    s.append('<text x="56" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="15" '
             'font-weight="900" fill="%s">Who gave that instruction, and on what date?</text>'
             % (fy + 110, GOLD))

    s.append('<text x="%d" y="%d" text-anchor="end" font-family="Inter,Helvetica,sans-serif" '
             'font-size="11" font-weight="800" letter-spacing="1.6" fill="%s">REALRYANNICHOLS.COM</text>'
             % (W - 36, H - 22, GOLD))
    s.append('<text x="36" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.6" fill="%s">THE PRESERVATION GAP</text>' % (H - 22, MUTED2))
    s.append("</svg>")
    return "".join(s)


def main():
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, "preservation-gap.svg")
    with open(p, "w") as f:
        f.write(build_svg())
    print("wrote", p)
    print("check: 12671+28386 =", 12671 + 28386, "| 28386/41057 =",
          round(28386 / 41057 * 100, 1), "%")
    print("per camera outside window: 15*3 + 6 =", 15 * 3 + 6, "hours")

    tmp = "/tmp/qlpg"
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp, exist_ok=True)
    subprocess.run(["qlmanage", "-t", "-s", "1200", "-o", tmp, p], capture_output=True, check=False)
    made = [x for x in os.listdir(tmp) if x.endswith(".png")]
    if not made:
        print("no png")
        return
    dst = os.path.join(OUT, "preservation-gap.png")
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
