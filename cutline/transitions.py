from __future__ import annotations

import math
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .ffmpeg import encode_overlay_frames


def _ease(x: float) -> float:
    return math.sin(math.pi * max(0.0, min(1.0, x))) ** 1.35


def _grain(width: int, height: int, rng: np.random.Generator, scale: float = 1.0) -> Image.Image:
    small_w = max(8, int(width / max(1.0, 3.2 * scale)))
    small_h = max(8, int(height / max(1.0, 3.2 * scale)))
    noise = rng.normal(0, 1, (small_h, small_w)).astype(np.float32)
    noise = np.clip(noise * 42 + 128, 0, 255).astype(np.uint8)
    image = Image.fromarray(noise, "L").resize((width, height), Image.Resampling.BILINEAR)
    return image


def _base_rgba(width: int, height: int) -> Image.Image:
    return Image.new("RGBA", (width, height), (0, 0, 0, 0))


def _light_leak(width: int, height: int, u: float, intensity: float, rng: np.random.Generator) -> Image.Image:
    canvas = _base_rgba(width, height)
    t = max(0.0, min(1.0, u))
    # Two moving blooms, like light crossing the lens.
    for index, (hue, scale, speed) in enumerate((("#FF7A3C", 0.9, 1.0), ("#FFC46B", 0.65, -0.6))):
        cx = (0.18 + 0.64 * ((t * speed + index * 0.23) % 1.0)) * width
        cy = (0.12 + 0.35 * index) * height
        radius = min(width, height) * (0.5 + 0.12 * math.sin(math.pi * t)) * scale
        blob = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(blob)
        color = tuple(int(hue[i:i + 2], 16) for i in (1, 3, 5))
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color + (140,))
        blob = blob.filter(ImageFilter.GaussianBlur(max(8, int(min(width, height) * 0.09))))
        canvas = Image.alpha_composite(canvas, blob)
    grain = _grain(width, height, rng)
    grain_rgba = Image.merge("RGBA", (grain, grain.point(lambda v: int(v * 0.72)), grain.point(lambda v: int(v * 0.42)), grain.point(lambda v: 38)))
    canvas = Image.alpha_composite(canvas, grain_rgba)
    return _apply_envelope(canvas, u, intensity)


def _film_burn(width: int, height: int, u: float, intensity: float, rng: np.random.Generator) -> Image.Image:
    canvas = _base_rgba(width, height)
    t = max(0.0, min(1.0, u))
    # Ember-edged frame with warm blooms.
    draw = ImageDraw.Draw(canvas)
    edge = int(min(width, height) * 0.12 * (0.5 + 0.8 * t))
    color = (255, 126, 38)
    for i in range(8):
        alpha = int(50 * (1 - i / 8) * intensity)
        inset = i * max(1, edge // 10)
        draw.rectangle((inset, inset, width - inset, height - inset), outline=color + (alpha,), width=max(2, int(min(width, height) * 0.01)))
    burn = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    bd = ImageDraw.Draw(burn)
    radius = min(width, height) * 0.45
    cx = width * (0.15 + 0.7 * t)
    cy = height * (0.35 + 0.15 * math.sin(t * math.pi * 2))
    bd.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(255, 187, 92, 120))
    burn = burn.filter(ImageFilter.GaussianBlur(max(10, int(min(width, height) * 0.06))))
    canvas = Image.alpha_composite(canvas, burn)
    grain = _grain(width, height, rng)
    grain_rgba = Image.merge("RGBA", (grain, grain.point(lambda v: int(v * 0.55)), grain.point(lambda v: int(v * 0.25)), grain.point(lambda v: 55)))
    canvas = Image.alpha_composite(canvas, grain_rgba)
    return _apply_envelope(canvas, u, intensity)


def _flash(width: int, height: int, u: float, intensity: float, rng: np.random.Generator) -> Image.Image:
    t = max(0.0, min(1.0, u))
    if t < 0.35:
        strength = (t / 0.35) ** 1.8
    else:
        strength = 1.0 - ((t - 0.35) / 0.65) ** 0.65
    strength = max(0.0, strength) * intensity
    canvas = Image.new("RGBA", (width, height), (255, 249, 229, int(235 * strength)))
    return canvas


def _glitch(width: int, height: int, u: float, intensity: float, rng: np.random.Generator) -> Image.Image:
    t = max(0.0, min(1.0, u))
    canvas = _base_rgba(width, height)
    draw = ImageDraw.Draw(canvas)
    band_count = 18
    for i in range(band_count):
        y = int((i / band_count) * height)
        h = int(height / band_count * 0.65)
        if rng.random() > 0.53:
            continue
        color = tuple(int(value) for value in rng.choice([(255, 58, 61), (38, 244, 255), (255, 255, 255), (166, 255, 94)]))
        x_shift = int(rng.uniform(-0.12, 0.12) * width * (1.0 - abs(t - 0.5) * 1.2))
        alpha = int(rng.uniform(30, 120) * intensity)
        draw.rectangle((x_shift, y, width + x_shift, y + h), fill=color + (alpha,))
    scan = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scan)
    for y in range(0, height, max(2, int(min(width, height) * 0.006))):
        sd.line((0, y, width, y), fill=(0, 0, 0, 24))
    canvas = Image.alpha_composite(canvas, scan)
    return _apply_envelope(canvas, u, intensity)


def _soft_bloom(width: int, height: int, u: float, intensity: float, rng: np.random.Generator) -> Image.Image:
    t = max(0.0, min(1.0, u))
    canvas = _base_rgba(width, height)
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    color = (255, 224, 196)
    draw.ellipse((-width * 0.3, height * (0.1 + t * 0.2), width * 0.55, height * 1.1), fill=color + (80,))
    draw.ellipse((width * 0.55, -height * 0.2, width * 1.3, height * 0.8), fill=(255, 198, 170, 55))
    glow = glow.filter(ImageFilter.GaussianBlur(max(12, int(min(width, height) * 0.10))))
    canvas = Image.alpha_composite(canvas, glow)
    return _apply_envelope(canvas, u, intensity * 0.8)


def _whip(width: int, height: int, u: float, intensity: float, rng: np.random.Generator) -> Image.Image:
    t = max(0.0, min(1.0, u))
    canvas = _base_rgba(width, height)
    draw = ImageDraw.Draw(canvas)
    streak_count = 26
    for _ in range(streak_count):
        y = rng.uniform(0, height)
        thickness = rng.uniform(0.002, 0.02) * height
        length = rng.uniform(0.25, 0.9) * width
        start_x = (t * width * 1.7 + rng.uniform(-0.4, 0.2) * width) % (width * 1.4) - width * 0.2
        color = tuple(int(value) for value in rng.choice([(255, 255, 255), (255, 214, 160), (208, 231, 255)]))
        alpha = int(rng.uniform(12, 60) * intensity)
        draw.line((start_x, y, start_x + length, y), fill=color + (alpha,), width=max(1, int(thickness)))
    canvas = canvas.filter(ImageFilter.GaussianBlur(max(2, int(min(width, height) * 0.005))))
    # A translucent sweep darkens the cut edge just enough to hide the join.
    veil = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    vd = ImageDraw.Draw(veil)
    band_x = int((t * 1.6 - 0.3) * width)
    vd.rectangle((band_x, 0, band_x + width * 0.22, height), fill=(0, 0, 0, int(35 * intensity)))
    canvas = Image.alpha_composite(canvas, veil)
    return _apply_envelope(canvas, u, intensity)


def _dip_black(width: int, height: int, u: float, intensity: float, rng: np.random.Generator) -> Image.Image:
    t = max(0.0, min(1.0, u))
    strength = (math.sin(math.pi * t) ** 1.3) * intensity
    return Image.new("RGBA", (width, height), (4, 4, 7, int(245 * strength)))


def _apply_envelope(canvas: Image.Image, u: float, intensity: float) -> Image.Image:
    alpha = canvas.getchannel("A").point(lambda value: int(value * intensity))
    canvas.putalpha(alpha)
    # Global fade envelope around the cut.
    factor = _ease(u) * 0.55 + 0.45
    alpha = canvas.getchannel("A").point(lambda value: int(value * factor))
    out = canvas.copy()
    out.putalpha(alpha)
    return out


GENERATORS = {
    "light_leak": _light_leak,
    "film_burn": _film_burn,
    "flash": _flash,
    "glitch": _glitch,
    "soft_bloom": _soft_bloom,
    "whip": _whip,
    "dip_black": _dip_black,
}


def transition_frames(
    preset: str,
    width: int,
    height: int,
    fps: float,
    duration_frames: int,
    intensity: float = 0.7,
) -> Iterable[Image.Image]:
    generator = GENERATORS.get(preset, _light_leak)
    rng = np.random.default_rng(abs(hash(preset)) % (2**32))
    count = max(2, int(duration_frames))
    for index in range(count):
        u = index / max(1, count - 1)
        # Generate at a reasonable internal size for speed, then scale up.
        low_w = min(width, 540 if width > height else 360)
        low_h = int(low_w * height / width)
        frame = generator(low_w, low_h, u, intensity, rng)
        if (low_w, low_h) != (width, height):
            frame = frame.resize((width, height), Image.Resampling.LANCZOS)
        yield frame


def render_transition(
    preset: str,
    width: int,
    height: int,
    fps: float,
    duration_frames: int,
    intensity: float,
    dst: str | Path,
    codec: str = "qtrle",
) -> Path:
    dst = Path(dst)
    return encode_overlay_frames(
        transition_frames(preset, width, height, fps, duration_frames, intensity),
        dst, width, height, fps, codec=codec,
    )
