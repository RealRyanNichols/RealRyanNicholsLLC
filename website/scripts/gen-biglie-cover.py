#!/usr/bin/env python3
"""PLACEHOLDER cover art for The BIG Lie. Ryan is supplying the real cover.

To replace: drop the real file at public/uploads/biglie-cover.png (~1000x1333).
This script exists only so there is something in the slot meanwhile.

Generates the cover art for The BIG Lie, sized to match the Fighting Shadows
cover (1000x1333) so the two promo cards sit together.

Run from website/:  python3 scripts/gen-biglie-cover.py
Outputs public/uploads/biglie-cover.png
"""
import os
from PIL import Image, ImageDraw, ImageFilter

W, H = 1000, 1333
NAVY = (7, 17, 38)
NAVY2 = (11, 24, 48)
GOLD = (225, 189, 91)
CREAM = (253, 248, 234)
MUTE = (159, 178, 208)
RED = (224, 83, 63)
OUT = "public/uploads/biglie-cover.png"

FONT_DIRS = [
    "/System/Library/Fonts/Supplemental/",
    "/System/Library/Fonts/",
    "/Library/Fonts/",
]
CANDIDATES_BOLD = ["Impact.ttf", "HelveticaNeue.ttc", "Helvetica.ttc", "Arial Bold.ttf", "Arial.ttf"]
CANDIDATES_REG = ["Georgia.ttf", "Times New Roman.ttf", "Helvetica.ttc", "Arial.ttf"]


def font(names, size):
    from PIL import ImageFont
    for d in FONT_DIRS:
        for n in names:
            p = os.path.join(d, n)
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except Exception:
                    continue
    from PIL import ImageFont as IF
    return IF.load_default()


def center(d, y, text, f, fill):
    w = d.textbbox((0, 0), text, font=f)[2]
    d.text(((W - w) / 2, y), text, font=f, fill=fill)


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    im = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(im)

    # subtle vertical wash
    for y in range(H):
        t = y / H
        c = (
            int(NAVY[0] + (NAVY2[0] - NAVY[0]) * t),
            int(NAVY[1] + (NAVY2[1] - NAVY[1]) * t),
            int(NAVY[2] + (NAVY2[2] - NAVY[2]) * t),
        )
        d.line([(0, y), (W, y)], fill=c)

    # faint "redacted" bars behind the title block, as texture
    bar = Image.new("RGB", (W, H), NAVY)
    bd = ImageDraw.Draw(bar)
    import random
    random.seed(6)
    for i in range(34):
        y = 120 + i * 34
        x0 = random.randint(60, 300)
        x1 = x0 + random.randint(180, 620)
        bd.rectangle([x0, y, min(x1, W - 60), y + 16], fill=(26, 38, 66))
    bar = bar.filter(ImageFilter.GaussianBlur(1.2))
    im = Image.blend(im, bar, 0.5)
    d = ImageDraw.Draw(im)

    # gold rule top
    d.rectangle([0, 0, W, 14], fill=GOLD)

    # kicker
    f_k = font(CANDIDATES_REG, 30)
    center(d, 150, "A  R E P O R T  B Y", f_k, MUTE)
    f_n = font(CANDIDATES_BOLD, 54)
    center(d, 196, "RYAN NICHOLS", f_n, CREAM)

    # title
    f_t = font(CANDIDATES_BOLD, 210)
    center(d, 360, "THE", f_t, CREAM)
    center(d, 560, "BIG", f_t, GOLD)
    center(d, 760, "LIE", f_t, CREAM)

    # rule
    d.rectangle([260, 1000, W - 260, 1005], fill=GOLD)

    # subtitle
    f_s = font(CANDIDATES_REG, 31)
    center(d, 1040, "The Feds, Antifa, and Crisis Actors", f_s, MUTE)
    center(d, 1082, "Who Infiltrated January 6th", f_s, MUTE)

    # provenance stamp
    f_p = font(CANDIDATES_REG, 25)
    center(d, 1170, "WRITTEN IN SOLITARY CONFINEMENT", f_p, GOLD)
    f_p2 = font(CANDIDATES_REG, 23)
    center(d, 1206, "26,102 words  ·  166 images  ·  12 charts", f_p2, MUTE)

    # bottom rule
    d.rectangle([0, H - 14, W, H], fill=RED)

    im.save(OUT, "PNG", optimize=True)
    print("wrote", OUT, os.path.getsize(OUT), "bytes", im.size)


if __name__ == "__main__":
    main()
