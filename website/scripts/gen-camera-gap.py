#!/usr/bin/env python3
"""The BIG Lie — two charts built entirely from the government's own sworn numbers.

  camera-gap : ~1,800 cameras existed. 650 were produced in discovery.
  sworn-41057: USCP General Counsel swore 12,671 + 28,386 = 41,057 hours,
               in a declaration filed into Nichols's own docket at ECF 245-3.

Run from website/:  python3 scripts/gen-camera-gap.py
"""
import os
import shutil
import subprocess

BG = "#12152b"; DEEP = "#0e1122"; GOLD = "#d9b32a"; WHITE = "#f4f5f9"
MUTED = "#a8adc4"; MUTED2 = "#7c81a0"; BLUE = "#8a93f8"; RED = "#e0533f"
GREEN = "#4cc38a"; ORANGE = "#e0913f"; BORDER = "#2b2f56"; PANEL = "#1b1f3e"
DIM = "#232752"
OUT = "public/thebiglie/charts"

TOTAL_CAM = 1800     # USCP press release, Nov 2 2022: "roughly 1,800 cameras"
PRODUCED = 650       # Pope ECF 119 fn.1, from the government's own spreadsheet


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def camera_gap():
    cols = 50
    cell = 15
    gap = 4
    step = cell + gap
    rows = (TOTAL_CAM + cols - 1) // cols
    left = 36
    top = 254
    gw = cols * step - gap
    W = left * 2 + gw
    H = top + rows * step + 250

    s = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img" '
         'aria-label="Grid of 1,800 squares, one per Capitol security camera. 650 are marked '
         'as produced in discovery, the remaining 1,150 were not.">' % (W, H)]
    s.append('<rect width="%d" height="%d" fill="%s"/>' % (W, H, BG))
    s.append('<text x="%d" y="52" font-family="Inter,Helvetica,sans-serif" font-size="27" '
             'font-weight="900" fill="%s">THE CAMERA GAP</text>' % (left, WHITE))
    s.append('<text x="%d" y="80" font-family="Inter,Helvetica,sans-serif" font-size="14.5" '
             'fill="%s">Every square is one Capitol security camera. The lit ones are what the '
             'government produced in discovery.</text>' % (left, MUTED))

    # three convergent estimates
    ests = [
        ("1,800", "USCP&#8217;S OWN PRESS RELEASE, NOV 2022", GOLD),
        ("1,750", "14,000 HOURS &#247; 8 HOURS", BLUE),
        ("1,584", "12,671 SWORN HOURS &#247; 8 HOURS", GREEN),
    ]
    bx = left
    for val, lab, col in ests:
        s.append('<rect x="%d" y="106" width="%d" height="64" rx="10" fill="%s" stroke="%s" '
                 'stroke-width="1.4"/>' % (bx, 300, DEEP, BORDER))
        s.append('<text x="%d" y="141" font-family="Inter,Helvetica,sans-serif" font-size="26" '
                 'font-weight="900" fill="%s">%s</text>' % (bx + 16, col, val))
        s.append('<text x="%d" y="159" font-family="Inter,Helvetica,sans-serif" font-size="9.4" '
                 'font-weight="800" letter-spacing="1.2" fill="%s">%s</text>' % (bx + 16, MUTED2, lab))
        bx += 316
    s.append('<text x="%d" y="196" font-family="Inter,Helvetica,sans-serif" font-size="13.5" '
             'fill="%s">Three independent figures, none of them mine, all landing between 1,584 '
             'and 1,800 cameras.</text>' % (left, MUTED))
    s.append('<text x="%d" y="222" font-family="Inter,Helvetica,sans-serif" font-size="17" '
             'font-weight="900" fill="%s">The government produced 650.</text>' % (left, RED))

    for i in range(TOTAL_CAM):
        r, c = divmod(i, cols)
        x = left + c * step
        y = top + r * step
        if i < PRODUCED:
            fill, op, stroke, sw = GOLD, ".92", GOLD, "0"
        else:
            fill, op, stroke, sw = DIM, ".5", BORDER, "1"
        s.append('<rect x="%d" y="%d" width="%d" height="%d" rx="2.5" fill="%s" fill-opacity="%s" '
                 'stroke="%s" stroke-width="%s"/>' % (x, y, cell, cell, fill, op, stroke, sw))

    ly = top + rows * step + 28
    items = [
        (GOLD, ".92", "650 cameras produced in discovery",
         "The government&#8217;s own spreadsheet. Pope ECF 119, June 2023."),
        (DIM, ".5", "%d cameras never produced" % (TOTAL_CAM - PRODUCED),
         "Never inventoried. Never explained. Never denied."),
    ]
    for k, (col, op, title, note) in enumerate(items):
        y = ly + k * 34
        s.append('<rect x="%d" y="%d" width="15" height="15" rx="3" fill="%s" fill-opacity="%s" '
                 'stroke="%s" stroke-width="1"/>' % (left, y, col, op, col if col != DIM else BORDER))
        s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14.5" '
                 'font-weight="800" fill="%s">%s</text>' % (left + 26, y + 13, WHITE, title))
        s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="12.6" '
                 'fill="%s">%s</text>' % (left + 330, y + 13, MUTED, note))

    fy = ly + 2 * 34 + 12
    s.append('<rect x="%d" y="%d" width="%d" height="80" rx="10" fill="%s" stroke="%s" '
             'stroke-width="1.5"/>' % (left, fy, gw, DEEP, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.8" fill="%s">WHAT NOBODY HAS EVER DONE</text>'
             % (left + 16, fy + 26, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="13.6" fill="%s">'
             'Given two chances to answer this in open filings, the government never disputed the '
             'number, never confirmed it, and never</text>' % (left + 16, fy + 50, WHITE))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="13.6" fill="%s">'
             'inventoried the cameras. No court has ever ruled on it either.</text>'
             % (left + 16, fy + 70, WHITE))

    s.append('<text x="%d" y="%d" text-anchor="end" font-family="Inter,Helvetica,sans-serif" '
             'font-size="11" font-weight="800" letter-spacing="1.6" fill="%s">REALRYANNICHOLS.COM</text>'
             % (W - left, H - 18, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.6" fill="%s">THE CAMERA GAP</text>'
             % (left, H - 18, MUTED2))
    s.append("</svg>")
    return "".join(s)


def sworn():
    W = 1140
    left = 36
    H = 720
    s = ['<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" role="img" '
         'aria-label="Chart showing the sworn footage figures 12,671 plus 28,386 equals 41,057 '
         'hours against the 14,000 hours the government defended.">' % (W, H)]
    s.append('<rect width="%d" height="%d" fill="%s"/>' % (W, H, BG))
    s.append('<text x="%d" y="54" font-family="Inter,Helvetica,sans-serif" font-size="27" '
             'font-weight="900" fill="%s">41,057 HOURS, SWORN UNDER OATH</text>' % (left, WHITE))
    s.append('<text x="%d" y="82" font-family="Inter,Helvetica,sans-serif" font-size="14.5" '
             'fill="%s">Capitol Police General Counsel Thomas DiBiase, declaration of March 17, '
             '2023. Filed into my own docket at ECF 245-3.</text>' % (left, MUTED))

    bar_y = 130
    bw_total = W - left * 2
    scale = bw_total / 41057.0
    a = 12671 * scale
    b = 28386 * scale
    s.append('<rect x="%d" y="%d" width="%.1f" height="64" rx="8" fill="%s" fill-opacity=".85"/>'
             % (left, bar_y, a, BLUE))
    s.append('<rect x="%.1f" y="%d" width="%.1f" height="64" rx="8" fill="%s" fill-opacity=".85"/>'
             % (left + a, bar_y, b, GREEN))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="20" '
             'font-weight="900" fill="#0b1830">12,671</text>' % (left + 18, bar_y + 40))
    s.append('<text x="%.1f" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="20" '
             'font-weight="900" fill="#0b1830">28,386</text>' % (left + a + 18, bar_y + 40))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="12.4" '
             'fill="%s">Noon to 8 PM on January 6. Exterior, Capitol and Visitor Center interiors.</text>'
             % (left, bar_y + 88, MUTED))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="12.4" '
             'fill="%s">January 3, 4 and 5. Plus the morning of January 6, before any of it started.</text>'
             % (left, bar_y + 110, MUTED))

    # the 14,000 they defended
    y2 = 312
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.8" fill="%s">WHAT THEY SPENT 2023 DEFENDING AS THE '
             'WHOLE UNIVERSE</text>' % (left, y2, RED))
    s.append('<rect x="%d" y="%d" width="%.1f" height="46" rx="8" fill="%s" fill-opacity=".8"/>'
             % (left, y2 + 16, 14000 * scale, RED))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="18" '
             'font-weight="900" fill="%s">14,000</text>' % (left + 18, y2 + 46, WHITE))
    s.append('<text x="%.1f" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="14" '
             'font-weight="800" fill="%s">and 4,800 of it ever reached defendants</text>'
             % (left + 14000 * scale + 16, y2 + 46, MUTED))

    # the footnote
    fy = 400
    s.append('<rect x="%d" y="%d" width="%d" height="150" rx="12" fill="%s" stroke="%s" '
             'stroke-width="2"/>' % (left, fy, W - left * 2, DEEP, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.8" fill="%s">THE FOOTNOTE THAT ENDS THE ARGUMENT '
             '&#183; ECF 71-1, NOVEMBER 2022</text>' % (left + 20, fy + 30, GOLD))
    s.append('<text x="%d" y="%d" font-family="Georgia,serif" font-size="18" font-style="italic" '
             'fill="%s">&#8220;In response to later requests from both committees, the Department '
             'provided footage from</text>' % (left + 20, fy + 66, WHITE))
    s.append('<text x="%d" y="%d" font-family="Georgia,serif" font-size="18" font-style="italic" '
             'fill="%s">the entire 24-hour period for January 6, 2021.&#8221;</text>'
             % (left + 20, fy + 92, WHITE))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="13" '
             'fill="%s">Sworn fifteen months before the House began releasing 40,000 hours. '
             'The committees already had the whole day.</text>' % (left + 20, fy + 124, MUTED))

    # retention clock
    ry = 578
    s.append('<rect x="%d" y="%d" width="%d" height="76" rx="10" fill="%s" stroke="%s" '
             'stroke-width="1.5"/>' % (left, ry, W - left * 2, DEEP, ORANGE))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.8" fill="%s">AND THE CLOCK THAT DECIDED IT ALL</text>'
             % (left + 20, ry + 26, ORANGE))
    s.append('<text x="%d" y="%d" font-family="Georgia,serif" font-size="16.5" font-style="italic" '
             'fill="%s">&#8220;Without affirmative preservation, all Department footage is '
             'automatically purged within 30 days.&#8221;</text>' % (left + 20, ry + 56, WHITE))

    s.append('<text x="%d" y="%d" text-anchor="end" font-family="Inter,Helvetica,sans-serif" '
             'font-size="11" font-weight="800" letter-spacing="1.6" fill="%s">REALRYANNICHOLS.COM</text>'
             % (W - left, H - 18, GOLD))
    s.append('<text x="%d" y="%d" font-family="Inter,Helvetica,sans-serif" font-size="11" '
             'font-weight="800" letter-spacing="1.6" fill="%s">SWORN, AND NEVER WITHDRAWN</text>'
             % (left, H - 18, MUTED2))
    s.append("</svg>")
    return "".join(s)


def render(name, svg):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name + ".svg")
    with open(p, "w") as f:
        f.write(svg)
    tmp = "/tmp/ql_" + name
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp, exist_ok=True)
    subprocess.run(["qlmanage", "-t", "-s", "1200", "-o", tmp, p], capture_output=True, check=False)
    made = [x for x in os.listdir(tmp) if x.endswith(".png")]
    if not made:
        print(name, "NO PNG")
        return
    dst = os.path.join(OUT, name + ".png")
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
    render("camera-gap", camera_gap())
    render("sworn-41057", sworn())
    print("check: 12671 + 28386 =", 12671 + 28386)
    print("check: 12671/8 =", round(12671 / 8), "| 14000/8 =", 14000 // 8)
