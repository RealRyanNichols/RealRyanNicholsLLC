#!/usr/bin/env python3
"""Generates the 'footage count' chart for The BIG Lie.

Pure stdlib: writes an SVG, then converts to PNG with macOS qlmanage.
Run from the website/ directory:
    python3 scripts/gen-footage-chart.py
Outputs public/thebiglie/charts/footage-count.{svg,png}
"""
import os
import subprocess
import shutil

BG = "#12152b"; PANEL = "#1b1f3e"; DEEP = "#0e1122"; GOLD = "#d9b32a"
WHITE = "#f4f5f9"; MUTED = "#a8adc4"; MUTED2 = "#7c81a0"; GREEN = "#4cc38a"
BLUE = "#8a93f8"; ORANGE = "#e0913f"; RED = "#e0533f"; BORDER = "#2b2f56"

OUT = "public/thebiglie/charts"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


ROWS = [
    ("4,800", 4800, RED, "Actually produced to defendants",
     "515 cameras. Oct 2021 government filing, US v. Bingert."),
    ("7,000", 7000, ORANGE, "Produced from the USCP transfer",
     "Sept 2021 DOJ discovery status filing."),
    ("7,000", 7000, MUTED2, "Withheld as “not relevant to this case”",
     "Same filing. Same sentence."),
    ("14,000", 14000, BLUE, "What I knew about when I wrote this",
     "USCP footage handed to the FBI. Noon to 8 PM on Jan 6 only."),
    ("41,000", 41000, GOLD, "What my own motion put on the record",
     "Feb 2023, Dkt. 212. “More than double the amount said to previously be available.”"),
    ("44,000", 44000, GREEN, "The House total, made public",
     "Nov 2023. Speaker Johnson begins posting. ~40,000 committed to release."),
]


def build_svg():
    W = 1120; top = 138; rh = 92
    H = top + len(ROWS) * rh + 150
    lab = 470; bx0 = lab + 16; bmax = W - 150
    scale = (bmax - bx0) / 44000.0
    s = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img" '
         'aria-label="Bar chart of January 6 footage volume figures from 4,800 hours '
         'produced to 44,000 hours total.">' % (W, H)]
    s.append('<rect x="0" y="0" width="%d" height="%d" fill="%s"/>' % (W, H, BG))
    s.append('<text x="28" y="46" font-family="Inter,Helvetica,sans-serif" font-size="25" '
             'font-weight="900" fill="%s">WHAT THEY SAID EXISTED, AND WHAT EXISTS</text>' % WHITE)
    s.append('<text x="28" y="74" font-family="Inter,Helvetica,sans-serif" font-size="14.5" '
             'fill="%s">Hours of January 6 Capitol closed-circuit footage, by what the record '
             'said and when it said it.</text>' % MUTED)
    for mo in (0, 10000, 20000, 30000, 44000):
        gx = bx0 + mo * scale
        s.append('<line x1="%.1f" y1="%d" x2="%.1f" y2="%d" stroke="%s" stroke-width="1"/>'
                 % (gx, top - 16, gx, top + len(ROWS) * rh - 14, BORDER))
        lbl = "44,000" if mo == 44000 else ("%dk" % (mo // 1000) if mo else "0")
        s.append('<text x="%.1f" y="%d" text-anchor="middle" font-family="Inter,Helvetica,sans-serif" '
                 'font-size="11.5" font-weight="700" fill="%s">%s</text>' % (gx, top - 24, MUTED2, lbl))
    s.append('<text x="%d" y="%d" text-anchor="middle" font-family="Inter,Helvetica,sans-serif" '
             'font-size="10.5" font-weight="800" letter-spacing="2.4" fill="%s">HOURS OF FOOTAGE</text>'
             % ((bx0 + bmax) / 2, top - 46, MUTED2))
    for i, (val, n, col, title, note) in enumerate(ROWS):
        y = top + i * rh
        if i % 2 == 0:
            s.append('<rect x="14" y="%d" width="%d" height="%d" rx="8" fill="%s" fill-opacity=".45"/>'
                     % (y - 12, W - 28, rh - 8, PANEL))
        s.append('<text x="28" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="16.5" '
                 'font-weight="800" fill="%s">%s</text>' % (y + 16, WHITE, esc(title)))
        s.append('<text x="28" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="12.3" '
                 'fill="%s">%s</text>' % (y + 38, MUTED, esc(note)))
        bw = max(n * scale, 6)
        s.append('<rect x="%d" y="%d" width="%.1f" height="30" rx="6" fill="%s" fill-opacity=".82" '
                 'stroke="%s" stroke-width="1.6"/>' % (bx0, y + 2, bw, col, col))
        s.append('<text x="%.1f" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="17" '
                 'font-weight="900" fill="%s" letter-spacing=".5">%s</text>'
                 % (bx0 + bw + 13, y + 24, col, val))
    fy = top + len(ROWS) * rh + 18
    s.append('<rect x="14" y="%d" width="%d" height="86" rx="10" fill="%s" stroke="%s" '
             'stroke-width="1.5"/>' % (fy, W - 28, DEEP, GOLD))
    s.append('<text x="30" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.8" fill="%s">WHY THE NUMBER GREW</text>' % (fy + 26, GOLD))
    s.append('<text x="30" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="13.5" fill="%s">'
             'The 14,000 figure covered noon to 8 PM on one day, and only what the Capitol Police handed '
             'the FBI. Of that, half was withheld</text>' % (fy + 50, WHITE))
    s.append('<text x="30" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="13.5" fill="%s">'
             'as not relevant. What actually reached defendants was 4,800 hours. That is about 11 percent '
             'of what the House later made public.</text>' % (fy + 70, WHITE))
    s.append('<text x="%d" y="%d" text-anchor="end" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.6" fill="%s">REALRYANNICHOLS.COM</text>' % (W - 24, H - 16, GOLD))
    s.append('<text x="24" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" font-weight="800" '
             'letter-spacing="1.6" fill="%s">THE FOOTAGE COUNT</text>' % (H - 16, MUTED2))
    s.append("</svg>")
    return "".join(s)


def main():
    os.makedirs(OUT, exist_ok=True)
    svg_path = os.path.join(OUT, "footage-count.svg")
    with open(svg_path, "w") as f:
        f.write(build_svg())
    print("wrote", svg_path, os.path.getsize(svg_path), "bytes")

    # macOS QuickLook render to PNG
    tmp = "/tmp/qlchart"
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp, exist_ok=True)
    subprocess.run(["qlmanage", "-t", "-s", "1100", "-o", tmp, svg_path],
                   capture_output=True, check=False)
    made = [x for x in os.listdir(tmp) if x.endswith(".png")]
    if not made:
        print("QuickLook produced no PNG; SVG is still usable on the web.")
        return
    src = os.path.join(tmp, made[0])
    dst = os.path.join(OUT, "footage-count.png")
    try:
        from PIL import Image
        im = Image.open(src).convert("RGB")
        bg = Image.new("RGB", im.size, BG)
        bg.paste(im)
        bg.save(dst, "PNG", optimize=True)
    except Exception:
        shutil.copy(src, dst)
    print("wrote", dst, os.path.getsize(dst), "bytes")


if __name__ == "__main__":
    main()
