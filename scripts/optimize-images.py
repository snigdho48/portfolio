"""Generate OG image + WebP compressions for portfolio assets."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT_OG = PUBLIC / "og-image.webp"
OUT_AVATAR = PUBLIC / "avatar.webp"


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def make_og() -> None:
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), "#0a0c0f")
    draw = ImageDraw.Draw(img)

    # soft glow blobs
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((-120, -180, 520, 420), fill=(46, 230, 166, 40))
    od.ellipse((780, 220, 1380, 820), fill=(34, 211, 238, 32))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    title = load_font(64)
    sub = load_font(28)
    small = load_font(22)

    draw.text((72, 180), "SNIGDHO.", font=title, fill="#2ee6a6")
    draw.text(
        (72, 280),
        "Software Engineer",
        font=sub,
        fill="#f3f6f8",
    )
    draw.text(
        (72, 340),
        "Backend Systems  ·  Full-Stack  ·  Cloud",
        font=small,
        fill=(243, 246, 248, 160),
    )
    draw.text(
        (72, 520),
        "github.com/snigdho48",
        font=small,
        fill="#22d3ee",
    )

    img.save(OUT_OG, "WEBP", quality=82, method=6)
    print("wrote", OUT_OG, OUT_OG.stat().st_size)


def compress_avatar() -> None:
    src = PUBLIC / "avatar.png"
    if not src.exists():
        print("skip avatar — missing")
        return
    im = Image.open(src).convert("RGBA")
    # Fit within 800px wide while preserving alpha on white-ish bg for webp
    im.thumbnail((800, 800), Image.Resampling.LANCZOS)
    bg = Image.new("RGB", im.size, "#0a0c0f")
    bg.paste(im, mask=im.split()[-1] if im.mode == "RGBA" else None)
    bg.save(OUT_AVATAR, "WEBP", quality=78, method=6)
    print("wrote", OUT_AVATAR, OUT_AVATAR.stat().st_size)


def compress_pngs() -> None:
    keep = {"avatar.png"}  # source kept; webp is served
    for path in PUBLIC.glob("*.png"):
        if path.name in keep:
            continue
        # leftover template assets — remove after unused check
        print("leave", path.name)


if __name__ == "__main__":
    make_og()
    compress_avatar()
    compress_pngs()
