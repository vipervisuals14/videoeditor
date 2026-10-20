from __future__ import annotations

import hashlib
import math
import random
import re
from dataclasses import dataclass
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .styles import load_font

_WS_RE = re.compile(r"\s+")


def hex_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def rgba(value: str, alpha: float) -> tuple[int, int, int, int]:
    r, g, b = hex_rgb(value)
    return r, g, b, max(0, min(255, int(alpha * 255)))


def _ease_out_cubic(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1.0 - (1.0 - x) ** 3


def _ease_out_back(x: float) -> float:
    x = max(0.0, min(1.0, x))
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def _with_alpha(image: Image.Image, factor: float) -> Image.Image:
    factor = max(0.0, min(1.0, factor))
    if factor >= 0.999:
        return image
    alpha = image.getchannel("A").point(lambda value: int(value * factor))
    out = image.copy()
    out.putalpha(alpha)
    return out


def split_words(text: str) -> list[str]:
    return [word for word in _WS_RE.split(text.strip()) if word]


def words_for_cue(cue: dict) -> list[dict]:
    words = cue.get("words") or []
    if words:
        return [
            {
                "word": str(item.get("word", "")).strip(),
                "start": float(item.get("start", cue["start"])),
                "end": float(item.get("end", cue["end"])),
            }
            for item in words
            if str(item.get("word", "")).strip()
        ]
    tokens = split_words(str(cue.get("text", "")))
    if not tokens:
        return []
    span = max(0.18, float(cue["end"]) - float(cue["start"]))
    weights = [max(1, len(re.sub(r"\W", "", token))) for token in tokens]
    total = sum(weights)
    cursor = float(cue["start"])
    out = []
    for token, weight in zip(tokens, weights):
        length = span * weight / total
        out.append({"word": token, "start": cursor, "end": cursor + length})
        cursor += length
    return out


@dataclass
class _WordBox:
    word: str
    width: float
    start: float
    end: float


@dataclass
class _Layout:
    lines: list[list[_WordBox]]
    font: ImageFont.FreeTypeFont
    line_height: float
    width: float
    height: float


def caption_scale(width: int, height: int) -> float:
    """Caption type is sized against frame height so it reads the same in
    vertical, square, and widescreen cuts."""
    return max(0.42, height / 1080.0)


def _aria(font: ImageFont.FreeTypeFont) -> float:
    """Mean advance width of a normal string, as a share of the point size.

    Used to set balanced multi-line captions without re-measuring every line.
    """
    sample = "the quick brown fox jumps over"
    try:
        return max(0.22, font.getlength(sample) / len(sample) / font.size)
    except Exception:
        return 0.52


def balance_lines(words: list[str], font: ImageFont.FreeTypeFont, max_width: float, max_lines: int) -> list[str] | None:
    """Split words into `max_lines` lines of similar width (greedy min-max).

    Returns None when the words cannot fit in that many lines.
    """
    if not words:
        return []
    space = font.getlength(" ")
    total_width = sum(font.getlength(word) for word in words) + space * max(0, len(words) - 1)
    if total_width <= max_width and len(words) <= 6:
        return [" ".join(words)]
    lines: list[list[str]] = [[] for _ in range(max_lines)]
    cursor = 0
    for index in range(max_lines):
        remaining_lines = max_lines - index
        target = total_width / remaining_lines
        width = 0.0
        while cursor < len(words):
            word = words[cursor]
            add = font.getlength(word) + (space if lines[index] else 0)
            if lines[index] and width + add > max_width:
                break
            if lines[index] and width + add > target and len(words) - cursor >= remaining_lines - 1:
                # Look ahead: bail out once this line is close enough to its share.
                break
            lines[index].append(word)
            width += add
            cursor += 1
        if cursor >= len(words):
            break
    if cursor < len(words):
        return None
    result = [" ".join(line) for line in lines if line]
    if any(not line for line in result):
        return None
    return result


def _layout_words(words: list[dict], style: dict, width: int, height: int, uppercase: bool) -> _Layout:
    scale = caption_scale(width, height)
    base_size = max(18, int(style["size"] * scale))
    max_width = width * (0.84 if width < height else 0.80)
    chosen_size = base_size
    chosen_font = load_font(style["font"], style["weight"], chosen_size)
    space_width = chosen_font.getlength(" ")
    for _ in range(18):
        font = load_font(style["font"], style["weight"], chosen_size)
        space_width = font.getlength(" ")
        texts = [word["word"].upper() if uppercase else word["word"] for word in words]
        for max_lines in (2, 3):
            balanced = balance_lines(texts, font, max_width, max_lines)
            if balanced is None:
                continue
            lines = []
            cursor = 0
            for line_text in balanced:
                count = len(line_text.split(" "))
                boxes = [
                    _WordBox(texts[cursor + k], font.getlength(texts[cursor + k]),
                             float(words[cursor + k]["start"]), float(words[cursor + k]["end"]))
                    for k in range(count)
                ]
                lines.append(boxes)
                cursor += count
            widest = max((sum(box.width for box in line) + space_width * max(0, len(line) - 1) for line in lines), default=0)
            if widest <= max_width and cursor == len(texts):
                chosen_size, chosen_font = chosen_size, font
                break
        else:
            chosen_size = max(int(chosen_size * 0.91), 18)
            chosen_font = load_font(style["font"], style["weight"], chosen_size)
            continue
        break
    else:
        font = chosen_font
        lines = []
        for word in words:
            text = word["word"].upper() if uppercase else word["word"]
            lines.append([_WordBox(text, font.getlength(text), float(word["start"]), float(word["end"]))])
        chosen_font = font
    space_width = chosen_font.getlength(" ")

    ascent, descent = chosen_font.getmetrics()
    line_height = (ascent + descent) * float(style.get("line_spacing", 1.0))
    widest = max((sum(box.width for box in line) + space_width * max(0, len(line) - 1) for line in lines), default=0)
    return _Layout(lines=lines, font=chosen_font, line_height=line_height, width=widest, height=line_height * len(lines))


def _draw_text_words(
    draw: ImageDraw.ImageDraw,
    layout: _Layout,
    origin: tuple[float, float],
    style: dict,
    t: float,
    scale: float,
    fill_override: tuple[int, int, int, int] | None = None,
) -> None:
    x0, y0 = origin
    font = layout.font
    ascent, descent = font.getmetrics()
    space_width = font.getlength(" ")
    stroke = int(style["outline"] * scale)
    for line_index, line in enumerate(layout.lines):
        total = sum(box.width for box in line) + space_width * max(0, len(line) - 1)
        x = x0 + (layout.width - total) / 2
        y = y0 + line_index * layout.line_height
        for box in line:
            active = box.start <= t < box.end
            color = rgba(style["accent"], 1.0) if (active and style["active"] == "accent") else rgba(style["color"], 1.0)
            if fill_override:
                color = fill_override
            draw.text(
                (x, y), box.word, font=font, fill=color,
                stroke_width=stroke,
                stroke_fill=rgba(style["outline_color"], 1.0) if stroke else None,
            )
            x += box.width + space_width


def render_caption_block(
    cue: dict,
    style: dict,
    width: int,
    height: int,
    t: float,
) -> Image.Image:
    """Render one caption as a transparent layer the size of the frame."""
    words = words_for_cue(cue)
    if not words:
        return Image.new("RGBA", (width, height), (0, 0, 0, 0))
    scale = caption_scale(width, height)
    layout = _layout_words(words, style, width, height, bool(style["uppercase"]))
    pad = max(6, int(style["padding"] * scale))
    anim_enter = min(1.0, max(0.0, (t - float(cue["start"])) / 0.16))
    anim_exit = min(1.0, max(0.0, (float(cue["end"]) - t) / 0.10))
    alpha_factor = min(anim_enter, anim_exit)
    if style["animation"] == "fade":
        alpha_factor = _ease_out_cubic(anim_enter) * min(1.0, anim_exit * 1.4)

    block_w = int(math.ceil(layout.width + pad * 2 + 8))
    block_h = int(math.ceil(layout.height + pad * 2 + 8))
    block = Image.new("RGBA", (block_w, block_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(block)

    # Background card.
    if style["background_opacity"] > 0.001:
        radius = int(style["radius"] * scale)
        draw.rounded_rectangle(
            (pad, pad, pad + layout.width + 4, pad + layout.height + 4),
            radius=radius,
            fill=rgba(style["background"], style["background_opacity"]),
        )

    text_origin = (pad + 2, pad + 2)

    # Glow layer behind the type.
    if style.get("glow", 0) > 0.01:
        glow = Image.new("RGBA", block.size, (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        _draw_text_words(glow_draw, layout, text_origin, style, t, scale, fill_override=rgba(style["accent"], 0.8))
        glow = glow.filter(ImageFilter.GaussianBlur(max(2, int(12 * scale))))
        glow = _with_alpha(glow, float(style["glow"]))
        block = Image.alpha_composite(block, glow)
        draw = ImageDraw.Draw(block)

    # Text shadow.
    if style.get("shadow", 0) > 0.01:
        shadow = Image.new("RGBA", block.size, (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        _draw_text_words(shadow_draw, layout, (text_origin[0], text_origin[1] + int(6 * scale)), style, t, scale, fill_override=(0, 0, 0, 255))
        shadow = shadow.filter(ImageFilter.GaussianBlur(max(2, int(5 * scale))))
        shadow = _with_alpha(shadow, float(style["shadow"]))
        block = Image.alpha_composite(block, shadow)
        draw = ImageDraw.Draw(block)

    # Active-word box sits behind its word.
    if style["active"] == "box" and style.get("karaoke"):
        font = layout.font
        space_width = font.getlength(" ")
        for line_index, line in enumerate(layout.lines):
            total = sum(box.width for box in line) + space_width * max(0, len(line) - 1)
            x = text_origin[0] + (layout.width - total) / 2
            y = text_origin[1] + line_index * layout.line_height
            for box in line:
                if box.start <= t < box.end:
                    draw.rounded_rectangle(
                        (x - int(7 * scale), y - int(2 * scale), x + box.width + int(7 * scale), y + layout.line_height - int(1 * scale)),
                        radius=int(8 * scale), fill=rgba(style["accent"], 0.95),
                    )
                x += box.width + space_width

    _draw_text_words(draw, layout, text_origin, style, t, scale)

    # Animate the block as a unit.
    anim_scale = 1.0
    dx = dy = 0.0
    if style["animation"] == "pop":
        anim_scale = 0.88 + 0.12 * _ease_out_back(anim_enter)
    elif style["animation"] == "rise":
        dy = (1.0 - _ease_out_cubic(anim_enter)) * height * 0.035
    elif style["animation"] == "slide":
        dx = (1.0 - _ease_out_cubic(anim_enter)) * width * 0.06
    if anim_exit < 1.0 and style["animation"] not in ("none", "fade"):
        anim_scale *= 0.985 + 0.015 * anim_exit

    if abs(anim_scale - 1.0) > 0.001:
        block = block.resize((max(1, int(block_w * anim_scale)), max(1, int(block_h * anim_scale))), Image.Resampling.LANCZOS)
    block = _with_alpha(block, alpha_factor)

    # Place at the selected safe area.
    x = (width - block.width) / 2 + dx
    aspect_ratio = width / height
    if style["position"] == "top":
        y = height * (0.11 if aspect_ratio < 1 else 0.09)
    elif style["position"] == "center":
        y = (height - block.height) / 2 + dy
    elif style["position"] == "lower_third":
        y = height * (0.74 if aspect_ratio < 1 else 0.70) - block.height / 2 + dy
    else:
        margin_ratio = 0.19 if aspect_ratio < 0.8 else (0.13 if aspect_ratio < 1.05 else 0.105)
        y = height - block.height - height * margin_ratio + dy
    x = max(width * 0.025, min(width * 0.975 - block.width, x))

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(block, (int(x), int(y)))
    return canvas


def render_caption_frame(cue: dict, style: dict, width: int, height: int, t: float) -> Image.Image:
    return render_caption_block(cue, style, width, height, t)


def caption_frames(
    cue: dict,
    style: dict,
    width: int,
    height: int,
    fps: float,
    start_frame: int,
    end_frame: int,
) -> Iterable[Image.Image]:
    for frame_index in range(start_frame, end_frame):
        t = frame_index / fps
        yield render_caption_frame(cue, style, width, height, t)


def draw_gradient_background(width: int, height: int, seed: str = "cutline") -> Image.Image:
    """A warm, defocused stand-in scene for the caption designer."""
    rng = random.Random(hashlib.sha1(seed.encode()).hexdigest())
    image = Image.new("RGB", (width, height), (17, 17, 22))
    top = (28 + rng.randint(0, 20), 32 + rng.randint(0, 18), 39 + rng.randint(0, 18))
    bottom = (10, 10, 14)
    for y in range(height):
        t = y / max(1, height - 1)
        color = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        ImageDraw.Draw(image).line((0, y, width, y), fill=color)
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    for _ in range(4):
        cx = rng.uniform(0.1, 0.9) * width
        cy = rng.uniform(0.0, 0.7) * height
        radius = rng.uniform(0.2, 0.55) * min(width, height)
        color = rng.choice([(255, 154, 90), (92, 160, 255), (248, 211, 128), (255, 98, 77)])
        gdraw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color + (120,))
    glow = glow.filter(ImageFilter.GaussianBlur(int(min(width, height) * 0.12)))
    image = Image.alpha_composite(image.convert("RGBA"), glow).convert("RGB")
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    odraw.rectangle((0, int(height * 0.58), width, height), fill=(0, 0, 0, 90))
    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
    return image


def render_preview(
    style: dict,
    text: str,
    width: int = 540,
    height: int = 960,
    background: Image.Image | None = None,
) -> Image.Image:
    background = background.convert("RGBA") if background else draw_gradient_background(width, height).convert("RGBA")
    if background.size != (width, height):
        background = background.resize((width, height), Image.Resampling.LANCZOS)
    words = split_words(text)
    if not words:
        words = ["Your", "words", "here"]
    total = sum(max(1, len(word)) for word in words)
    cursor = 0.0
    span = 2.6
    cue_words = []
    for word in words:
        length = span * max(1, len(word)) / total
        cue_words.append({"word": word, "start": cursor, "end": cursor + length})
        cursor += length
    cue = {"start": 0.0, "end": max(span, 0.8), "text": " ".join(words), "words": cue_words}
    layer = render_caption_frame(cue, style, width, height, span * 0.52)
    return Image.alpha_composite(background, layer)


# ---------------------------------------------------------------------------
# Titles / chapter cards
# ---------------------------------------------------------------------------

# The bundled display faces have no arrow or dingbat glyphs, and FreeType draws a
# notdef box for anything missing. Map the symbols people actually put in titles
# onto characters that are guaranteed to render.
_TITLE_GLYPHS = {
    "→": "->", "←": "<-", "↔": "<->", "⇄": "<->", "➔": "->", "➜": "->",
    "⇒": "=>", "⇐": "<=", "↗": "/", "↘": "/",
    "★": "*", "☆": "*", "✓": "+", "✔": "+", "♪": "", "♫": "", "♥": "<3",
}


def _display_text(text: str) -> str:
    out = "".join(_TITLE_GLYPHS.get(ch, ch) for ch in text)
    # Drop anything left that the display faces cannot draw (arrows, dingbats,
    # emoji) rather than let FreeType render a notdef box.
    kept = []
    for ch in out:
        if ch.isalnum() or ch.isspace() or (ch.isprintable() and ord(ch) < 0x2190):
            kept.append(ch)
    return "".join(kept).strip()


def title_frames(
    lines: dict,
    width: int,
    height: int,
    fps: float,
    duration: float,
    start_frame: int,
    end_frame: int,
) -> Iterable[Image.Image]:
    scale = max(0.42, height / 1080.0)
    title = _display_text(str(lines.get("title", "")).strip())
    kicker = _display_text(str(lines.get("kicker", "")).strip())
    meta = _display_text(str(lines.get("meta", "")).strip())
    if not title and not kicker:
        return
    title_font = load_font("playfair", 600, max(24, int(66 * scale)))
    kicker_font = load_font("bebas", 400, max(14, int(30 * scale)))
    meta_font = load_font("inter", 400, max(12, int(22 * scale)))
    total_frames = max(1, end_frame - start_frame)
    for n, frame_index in enumerate(range(start_frame, end_frame)):
        u = n / max(1, total_frames - 1)
        reveal = _ease_out_cubic(min(1.0, u / 0.18))
        exit_fade = _ease_out_cubic(min(1.0, (1.0 - u) / 0.16))
        alpha = min(reveal, exit_fade)
        canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        if True:
            veil = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            vd = ImageDraw.Draw(veil)
            for y in range(int(height * 0.55), height):
                t = (y - height * 0.55) / (height * 0.45)
                vd.line((0, y, width, y), fill=(4, 4, 6, int(150 * (t ** 1.7) * alpha)))
            canvas = Image.alpha_composite(canvas, veil)
        draw = ImageDraw.Draw(canvas)
        margin = int(width * (0.075 if width < height else 0.065))
        base_y = int(height * (0.69 if width < height else 0.68))
        y = base_y + (1 - reveal) * int(30 * scale)
        if kicker:
            kicker_y = y - int(46 * scale)
            draw.text((margin, kicker_y), kicker.upper(), font=kicker_font, fill=rgba("#EFC98B", alpha))
            y += int(4 * scale)
        if title:
            draw.text((margin, y), title, font=title_font, fill=rgba("#FFF8EC", alpha),
                      stroke_width=max(0, int(1 * scale)), stroke_fill=rgba("#0A0908", alpha * 0.35))
            y += int(82 * scale)
        line_width = int(90 * scale * reveal)
        draw.line((margin, y, margin + line_width, y), fill=rgba("#EFC98B", alpha * 0.9), width=max(1, int(2 * scale)))
        if meta:
            draw.text((margin, y + int(18 * scale)), meta.upper(), font=meta_font, fill=rgba("#E8E2D6", alpha * 0.9))
        yield canvas


def preview_title(width: int = 960, height: int = 540) -> Image.Image:
    bg = draw_gradient_background(width, height, seed="title").convert("RGBA")
    frames = list(title_frames(
        {"title": "The long way north", "kicker": "Toronto · 07:42", "meta": "October 2026"},
        width, height, 30, 4.0, 0, 30,
    ))
    frame = frames[len(frames) // 2]
    return Image.alpha_composite(bg, frame)
