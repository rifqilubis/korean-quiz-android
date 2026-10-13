#!/usr/bin/env python3
"""Bikin ikon peluncur Android untuk 한국어 Quiz.

Jalankan:
    python tools/make-android-icons.py

Menghasilkan, untuk setiap kerapatan layar:
    mipmap-*/ic_launcher.png             ikon biasa (Android < 8)
    mipmap-*/ic_launcher_round.png       ikon bulat (Android < 8)
    mipmap-*/ic_launcher_foreground.png  lapisan depan ikon adaptif (Android 8+)

Ikon adaptif sendiri (mipmap-anydpi-v26/ic_launcher.xml) memakai gradien di
res/drawable/ic_launcher_background.xml sebagai latar.
"""

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "app", "src", "main", "res")
GLYPH = "한"

C1 = (91, 108, 255)   # #5b6cff
C2 = (139, 92, 246)   # #8b5cf6

# Kerapatan -> ukuran ikon peluncur (48dp) dan lapisan depan adaptif (108dp)
DENSITIES = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\malgunbd.ttf",
    r"C:\Windows\Fonts\malgun.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
]


def find_font():
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    raise SystemExit("Font Korea tidak ditemukan. Tambahkan path-nya ke FONT_CANDIDATES.")


def gradient(size):
    y, x = np.mgrid[0:size, 0:size]
    t = ((x + y) / (2.0 * (size - 1)))[..., None]
    rgb = (np.array(C1) * (1.0 - t) + np.array(C2) * t).astype(np.uint8)
    alpha = np.full((size, size, 1), 255, dtype=np.uint8)
    return Image.fromarray(np.concatenate([rgb, alpha], axis=2), "RGBA")


def mask_for(size, shape, ratio=0.22):
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    if shape == "circle":
        draw.ellipse([0, 0, size - 1, size - 1], fill=255)
    else:
        draw.rounded_rectangle([0, 0, size - 1, size - 1],
                               radius=int(size * ratio), fill=255)
    return mask


def draw_glyph(canvas, size, glyph_ratio, font_path, with_shadow=True):
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype(font_path, int(size * glyph_ratio))
    center = size / 2.0
    if with_shadow:
        offset = max(1, int(size * 0.012))
        draw.text((center + offset, center + offset), GLYPH, font=font,
                  fill=(0, 0, 0, 70), anchor="mm")
    draw.text((center, center), GLYPH, font=font,
              fill=(255, 255, 255, 255), anchor="mm")


def launcher_icon(size, shape, font_path, target):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(gradient(size), (0, 0), mask_for(size, shape))
    draw_glyph(canvas, size, 0.52, font_path)
    canvas.save(target, "PNG", optimize=True)
    return os.path.getsize(target)


def foreground(size, font_path, target):
    """Lapisan depan adaptif: transparan, glyph di dalam zona aman 66%."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_glyph(canvas, size, 0.40, font_path)
    canvas.save(target, "PNG", optimize=True)
    return os.path.getsize(target)


def main():
    font_path = find_font()
    print("font :", font_path)

    total = 0
    for density, (launcher, front) in DENSITIES.items():
        folder = os.path.join(RES, "mipmap-" + density)
        os.makedirs(folder, exist_ok=True)

        a = launcher_icon(launcher, "rounded", font_path,
                          os.path.join(folder, "ic_launcher.png"))
        b = launcher_icon(launcher, "circle", font_path,
                          os.path.join(folder, "ic_launcher_round.png"))
        c = foreground(front, font_path,
                       os.path.join(folder, "ic_launcher_foreground.png"))
        total += a + b + c
        print(f"mipmap-{density:<8} launcher {launcher:>3}px | bulat {launcher:>3}px | "
              f"foreground {front:>3}px")

    print(f"selesai, total {total / 1024:.1f} KB")


if __name__ == "__main__":
    main()
