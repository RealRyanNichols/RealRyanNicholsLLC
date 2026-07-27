#!/usr/bin/env python3
"""The BIG Lie — 'what the footage actually looks like' scale chart.

One square = one day (24 hours) of continuous video.
  44,000 hours = 1,833 days = 5.0 years
  14,000 hours =   583 days  (what Ryan was told existed)
   4,800 hours =   200 days  (what actually reached defendants)

Pure stdlib SVG, converted to PNG with macOS qlmanage.
Run from website/:  python3 scripts/gen-footage-scale.py
"""
import os
import shutil
import subprocess

BG = "#12152b"; DEEP = "#0e1122"; GOLD = "#d9b32a"; WHITE = "#f4f5f9"
MUTED = "#a8adc4"; MUTED2 = "#7c81a0"; BLUE = "#8a93f8"; RED = "#e0533f"
BORDER = "#2b2f56"; DIM = "#232752"

OUT = "public/thebiglie/charts"

TOTAL_HOURS = 44000
TOLD_HOURS = 14000
GOT_HOURS = 4800

TOTAL = round(TOTAL_HOURS / 24)   # 1833
TOLD = round(TOLD_HOURS / 24)     # 583
GOT = round(GOT_HOURS / 24)       # 200


def build_svg():
    cols = 47
    cell = 17
    gap = 4
    step = cell + gap
    rows = (TOTAL + cols - 1) // cols          # 40 rows
    gw = cols * step - gap
    left = 34
    top = 208
    W = left * 2 + gw
    H = top + rows * step + 262

    s = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img" '
         'aria-label="Grid of 1,833 squares, one per day of continuous video. 200 squares mark '
         'what reached defendants, 583 mark what was said to exist, the rest is the remainder '
         'of the 44,000 hour total.">' % (W, H)]
    s.append('<rect width="%d" height="%d" fill="%s"/>' % (W, H, BG))

    s.append('<text x="%d" y="52" font-family="Inter,Helvetica,sans-serif" font-size="26" '
             'font-weight="900" fill="%s">WHAT 44,000 HOURS ACTUALLY LOOKS LIKE</text>' % (left, WHITE))
    s.append('<text x="%d" y="80" font-family="Inter,Helvetica,sans-serif" font-size="14.5" '
             'fill="%s">Every square is one full day of continuous video. All 1,833 of them.</text>'
             % (left, MUTED))

    # headline numbers
    stats = [
        (str(TOTAL), "DAYS OF VIDEO", GOLD),
        ("5.0", "YEARS, IF YOU NEVER LOOKED AWAY", GOLD),
        ("%d%%" % round(GOT_HOURS / TOTAL_HOURS * 100), "OF IT REACHED DEFENDANTS", RED),
    ]
    bx = left
    for val, lab, col in stats:
        s.append('<rect x="%d" y="108" width="228" height="66" rx="10" fill="%s" stroke="%s" '
                 'stroke-width="1.4"/>' % (bx, DEEP, BORDER))
        s.append('<text x="%d" y="145" font-family="Inter,Helvetica,sans-serif" font-size="27" '
                 'font-weight="900" fill="%s">%s</text>' % (bx + 16, col, val))
        s.append('<text x="%d" y="163" font-family="Inter,Helvetica,sans-serif" font-size="9.6" '
                 'font-weight="800" letter-spacing="1.3" fill="%s">%s</text>' % (bx + 16, MUTED2, lab))
        bx += 244

    # the grid
    for i in range(TOTAL):
        r, c = divmod(i, cols)
        x = left + c * step
        y = top + r * step
        if i < GOT:
            fill, op, stroke, sw = RED, "1", RED, "0"
        elif i < TOLD:
            fill, op, stroke, sw = BLUE, ".85", BLUE, "0"
        else:
            fill, op, stroke, sw = DIM, ".55", BORDER, "1"
        s.append('<rect x="%d" y="%d" width="%d" height="%d" rx="3" fill="%s" fill-opacity="%s" '
                 'stroke="%s" stroke-width="%s"/>' % (x, y, cell, cell, fill, op, stroke, sw))

    # bracket labels on the right of the first rows
    got_rows = GOT / cols
    told_rows = TOLD / cols
    ry = top + got_rows * step
    s.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="2"/>'
             % (left - 10, top, left - 10, ry, RED))
    s.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="2"/>'
             % (left - 18, ry, left - 18, top + told_rows * step, BLUE))

    # legend
    ly = top + rows * step + 30
    items = [
        (RED, "1", "%d days &#183; 4,800 hours" % GOT, "What actually reached defendants. 515 cameras."),
        (BLUE, ".85", "%d days &#183; 14,000 hours" % TOLD, "What I was told existed while I wrote this report."),
        (DIM, ".55", "%d days &#183; the remainder" % (TOTAL - TOLD), "Existed the whole time. I never saw a frame of it."),
    ]
    for k, (col, op, title, note) in enumerate(items):
        y = ly + k * 34
        s.append('<rect x="%d" y="%d" width="15" height="15" rx="3" fill="%s" fill-opacity="%s" '
                 'stroke="%s" stroke-width="1"/>' % (left, y, col, op, col if col != DIM else BORDER))
        s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14" '
                 'font-weight="800" fill="%s">%s</text>' % (left + 26, y + 13, WHITE, title))
        s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="12.6" '
                 'fill="%s">%s</text>' % (left + 250, y + 13, MUTED, note))

    fy = ly + 3 * 34 + 8
    s.append('<rect x="%d" y="%d" width="%d" height="52" rx="10" fill="%s" stroke="%s" '
             'stroke-width="1.5"/>' % (left, fy, gw, DEEP, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="13.6" '
             'fill="%s">In February 2023 my own motion put 41,000 hours on the record. In November 2023 '
             'the House began releasing 44,000. And that is only what has been tracked and recovered.</text>'
             % (left + 16, fy + 32, WHITE))

    s.append('<text x="%d" y="%d" text-anchor="end" font-family="Inter,Helvetica,sans-serif" '
             'font-size="11" font-weight="800" letter-spacing="1.6" fill="%s">REALRYANNICHOLS.COM</text>'
             % (W - left, H - 18, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.6" fill="%s">THE SCALE OF THE FOOTAGE</text>'
             % (left, H - 18, MUTED2))
    s.append("</svg>")
    return "".join(s)


def main():
    os.makedirs(OUT, exist_ok=True)
    svg_path = os.path.join(OUT, "footage-scale.svg")
    with open(svg_path, "w") as f:
        f.write(build_svg())
    print("wrote", svg_path, os.path.getsize(svg_path), "bytes")
    print("math: %d total days, %d told, %d got, %.1f%% reached defendants"
          % (TOTAL, TOLD, GOT, GOT_HOURS / TOTAL_HOURS * 100))

    tmp = "/tmp/qlscale"
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp, exist_ok=True)
    subprocess.run(["qlmanage", "-t", "-s", "1200", "-o", tmp, svg_path],
                   capture_output=True, check=False)
    made = [x for x in os.listdir(tmp) if x.endswith(".png")]
    if not made:
        print("QuickLook produced no PNG")
        return
    dst = os.path.join(OUT, "footage-scale.png")
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
