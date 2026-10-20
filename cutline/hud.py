"""Viewfinder HUD: the persistent rule-of-thirds grid + REC / location type.

Matches the reference look in ``docs/`shots`` where a warm travel montage is
overlaid with a thin 3x3 grid, a camcorder REC tag on the left, and a stacked
location card on the right. Everything is drawn at the output resolution so the
same overlay works for 16:9, 9:16 and square cuts.
"""

from __future__ import annotations

from PIL import Image, ImageDraw

from .captions import _display_text
from .styles import load_font


def _tracked_width(draw: ImageDraw.ImageDraw, text: str, font, tracking: float) -> float:
    if not text:
        return 0.0
    return sum(float(draw.textlength(ch, font=font)) for ch in text) + tracking * (len(text) - 1)


def _draw_tracked(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    text: str,
    font,
    fill,
    tracking: float,
    anchor: str = "lm",
) -> None:
    """Draw letter-spaced type, right-aligning when anchor starts with r."""
    if not text:
        return
    widths = [float(draw.textlength(ch, font=font)) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    cursor = x - total if anchor.startswith("r") else x
    for ch, width in zip(text, widths):
        draw.text((cursor, y), ch, font=font, fill=fill, anchor="l" + anchor[1:])
        cursor += width + tracking


def _fit_tracking(draw: ImageDraw.ImageDraw, text: str, font, target: float, maximum: float) -> float:
    if len(text) < 2:
        return 0.0
    natural = _tracked_width(draw, text, font, 0.0)
    tracking = (target - natural) / (len(text) - 1)
    return max(0.0, min(maximum, tracking))


def _location_lines(raw: str) -> list[str]:
    text = _display_text(raw).upper().strip()
    if not text:
        return []
    for separator in (",", "·", " / ", " – ", " – ", " | "):
        if separator in text:
            left, right = [part.strip() for part in text.split(separator, 1)]
            if left and right:
                return [left, right]
    words = text.split()
    if len(words) >= 2 and len(text) > 12:
        split = (len(words) + 1) // 2
        return [" ".join(words[:split]), " ".join(words[split:])]
    return [text]


def render_hud(width: int, height: int, spec: dict) -> Image.Image:
    """A transparent full-frame HUD layer."""
    scale = max(0.45, height / 1080.0)
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    if spec.get("grid", True):
        stroke = max(1, int(round(1.4 * scale)))
        grid = (255, 255, 255, 54)
        for fraction in (1 / 3, 2 / 3):
            x = int(round(width * fraction))
            draw.line((x, 0, x, height), fill=grid, width=stroke)
        for fraction in (1 / 3, 2 / 3):
            y = int(round(height * fraction))
            draw.line((0, y, width, y), fill=grid, width=stroke)

    margin = int(round(width * 0.05))
    middle = height / 2
    white = (255, 255, 255, 242)
    soft = (255, 255, 255, 208)

    plus_size = max(18, int(round(44 * scale)))
    rec_size = max(26, int(round(74 * scale)))
    location_size = max(22, int(round(60 * scale)))
    plus_font = load_font("inter", 600, plus_size)
    rec_font = load_font("inter", 700, rec_size)
    location_font = load_font("inter", 800, location_size)

    # Left: ++ REC. with a red record dot.
    draw.text((margin, middle), "++", font=plus_font, fill=soft, anchor="lm")
    plus_width = float(draw.textlength("++", font=plus_font))
    rec_x = margin + plus_width + 40 * scale
    draw.text((rec_x, middle), "REC", font=rec_font, fill=white, anchor="lm")
    rec_width = float(draw.textlength("REC", font=rec_font))
    dot_radius = max(2.0, 5.0 * scale)
    dot_x = rec_x + rec_width + 10 * scale
    dot_y = middle + rec_font.size * 0.24
    draw.ellipse(
        (dot_x, dot_y - dot_radius, dot_x + dot_radius * 2, dot_y + dot_radius),
        fill=(255, 59, 48, 245),
    )

    # Right: location card, two stacked lines, right-aligned, flanked by ++.
    plus_width = float(draw.textlength("++", font=plus_font))
    right_edge = width - margin
    draw.text((right_edge, middle), "++", font=plus_font, fill=soft, anchor="rm")
    text_right = right_edge - plus_width - 28 * scale

    lines = _location_lines(str(spec.get("location") or ""))
    if lines:
        widest = max(lines, key=len)
        target = width * (0.195 if len(lines) > 1 else 0.15)
        tracking = _fit_tracking(draw, widest, location_font, target, maximum=4 * scale)
        line_height = location_font.size * 0.80
        top = middle - line_height * (len(lines) - 1) / 2
        for index, line in enumerate(lines):
            _draw_tracked(
                draw,
                text_right,
                top + index * line_height,
                line,
                location_font,
                white,
                tracking,
                anchor="rm",
            )

    return image
