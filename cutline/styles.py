from __future__ import annotations

import copy
import re
from pathlib import Path

from PIL import ImageFont

from .settings import FONTS_DIR

HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

FONT_LIBRARY: dict[str, dict] = {
    "inter": {
        "label": "Inter",
        "css": "Inter",
        "weights": {400: "Inter-Regular.ttf", 600: "Inter-SemiBold.ttf", 700: "Inter-Bold.ttf", 800: "Inter-ExtraBold.ttf"},
    },
    "archivo": {
        "label": "Archivo Black",
        "css": "Archivo Black",
        "weights": {400: "ArchivoBlack-Regular.ttf"},
    },
    "bebas": {
        "label": "Bebas Neue",
        "css": "Bebas Neue",
        "weights": {400: "BebasNeue-Regular.ttf"},
    },
    "playfair": {
        "label": "Playfair Display",
        "css": "Playfair Display",
        "weights": {400: "PlayfairDisplay-Regular.ttf", 600: "PlayfairDisplay-SemiBold.ttf"},
    },
}

BASE_STYLE: dict = {
    "font": "inter",
    "weight": 800,
    "size": 66,
    "uppercase": True,
    "color": "#FFFFFF",
    "accent": "#D8FF3E",
    "active": "accent",           # accent | box | none
    "outline": 0,
    "outline_color": "#09090C",
    "shadow": 0.45,
    "shadow_color": "#000000",
    "background": "#0B0B0F",
    "background_opacity": 0.0,
    "radius": 24,
    "padding": 20,
    "max_words": 3,
    "max_chars": 22,
    "max_duration": 2.6,
    "position": "bottom",          # top | center | lower_third | bottom
    "align": "center",
    "animation": "pop",           # pop | rise | slide | fade | none
    "karaoke": True,
    "glow": 0.0,
    "line_spacing": 1.0,
}

PRESETS: dict[str, dict] = {
    "creator": {
        **BASE_STYLE,
        "id": "creator",
        "label": "Creator",
        "tagline": "Big, bold, made to stop the scroll",
        "font": "inter",
        "weight": 800,
        "size": 68,
        "color": "#FFFFFF",
        "accent": "#D8FF3E",
        "shadow": 0.5,
        "max_words": 3,
        "max_chars": 22,
        "animation": "pop",
        "position": "bottom",
        "uppercase": True,
    },
    "clean": {
        **BASE_STYLE,
        "id": "clean",
        "label": "Clean",
        "tagline": "A soft card that stays out of the way",
        "font": "inter",
        "weight": 600,
        "size": 56,
        "color": "#FFFFFF",
        "accent": "#FFFFFF",
        "active": "none",
        "background": "#08080B",
        "background_opacity": 0.58,
        "radius": 26,
        "padding": 22,
        "shadow": 0.15,
        "max_words": 5,
        "max_chars": 30,
        "animation": "rise",
        "position": "bottom",
        "uppercase": False,
    },
    "kinetic": {
        **BASE_STYLE,
        "id": "kinetic",
        "label": "Kinetic",
        "tagline": "Editorial type for music and montage",
        "font": "archivo",
        "weight": 400,
        "size": 72,
        "color": "#FFF4DF",
        "accent": "#FF5E3A",
        "shadow": 0.25,
        "max_words": 2,
        "max_chars": 16,
        "max_duration": 1.8,
        "animation": "pop",
        "position": "center",
        "uppercase": True,
    },
    "journal": {
        **BASE_STYLE,
        "id": "journal",
        "label": "Journal",
        "tagline": "Quiet, warm captions for travel films",
        "font": "playfair",
        "weight": 600,
        "size": 50,
        "color": "#FFF8EC",
        "accent": "#EFC98B",
        "active": "accent",
        "shadow": 0.3,
        "max_words": 6,
        "max_chars": 34,
        "max_duration": 3.6,
        "animation": "fade",
        "position": "lower_third",
        "uppercase": False,
        "line_spacing": 1.08,
    },
    "broadcast": {
        **BASE_STYLE,
        "id": "broadcast",
        "label": "Broadcast",
        "tagline": "Punchy lower thirds with a newsroom snap",
        "font": "bebas",
        "weight": 400,
        "size": 82,
        "color": "#FFFFFF",
        "accent": "#FFD400",
        "background": "#07070A",
        "background_opacity": 0.64,
        "radius": 10,
        "padding": 18,
        "shadow": 0.1,
        "max_words": 4,
        "max_chars": 26,
        "animation": "slide",
        "position": "bottom",
        "uppercase": True,
    },
    "neon": {
        **BASE_STYLE,
        "id": "neon",
        "label": "Neon",
        "tagline": "Karaoke colour for lyric-led edits",
        "font": "inter",
        "weight": 800,
        "size": 62,
        "color": "#FFFFFF",
        "accent": "#DFFF4F",
        "background": "#07070C",
        "background_opacity": 0.46,
        "radius": 18,
        "padding": 18,
        "shadow": 0.2,
        "glow": 0.55,
        "max_words": 3,
        "max_chars": 20,
        "max_duration": 2.2,
        "animation": "pop",
        "position": "center",
        "uppercase": True,
        "karaoke": True,
    },
    "minimal": {
        **BASE_STYLE,
        "id": "minimal",
        "label": "Minimal",
        "tagline": "No card. Just a clean white line.",
        "font": "inter",
        "weight": 600,
        "size": 50,
        "color": "#F8F4EC",
        "accent": "#F8F4EC",
        "active": "none",
        "outline": 2,
        "outline_color": "#08080B",
        "shadow": 0.2,
        "max_words": 6,
        "max_chars": 36,
        "animation": "none",
        "position": "bottom",
        "uppercase": False,
    },
}

POSITION_LABELS = {
    "bottom": "Lower safe",
    "lower_third": "Lower third",
    "center": "Centre",
    "top": "Upper safe",
}

ANIMATIONS = ("pop", "rise", "slide", "fade", "none")


def get_presets() -> list[dict]:
    order = ["creator", "clean", "kinetic", "journal", "broadcast", "neon", "minimal"]
    return [copy.deepcopy(PRESETS[key]) for key in order if key in PRESETS]


def get_preset(style_id: str) -> dict:
    return copy.deepcopy(PRESETS.get(style_id, PRESETS["creator"]))


def _safe_color(value, fallback: str) -> str:
    if isinstance(value, str) and HEX_RE.match(value.strip()):
        return value.strip().upper()
    return fallback


def _safe_number(value, fallback, low, high):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    return max(low, min(high, number))


def normalize_style(raw: dict | None, preset_id: str | None = None) -> dict:
    base = get_preset(preset_id) if preset_id else get_preset("creator")
    source = raw if isinstance(raw, dict) else {}
    for key, value in source.items():
        if key in ("id", "label", "tagline"):
            continue
        base[key] = value

    if str(base.get("font")) not in FONT_LIBRARY:
        base["font"] = "inter"
    weights = FONT_LIBRARY[base["font"]]["weights"]
    base["weight"] = min(weights, key=lambda w: abs(w - int(_safe_number(base.get("weight"), 800, 100, 900))))
    base["size"] = int(_safe_number(base.get("size"), 66, 28, 150))
    base["uppercase"] = bool(base.get("uppercase", True))
    base["karaoke"] = bool(base.get("karaoke", False))
    for key, fallback in (("color", "#FFFFFF"), ("accent", "#D8FF3E"), ("outline_color", "#09090C"),
                          ("shadow_color", "#000000"), ("background", "#0B0B0F")):
        base[key] = _safe_color(base.get(key), fallback)
    base["active"] = base.get("active") if base.get("active") in ("accent", "box", "none") else "accent"
    base["outline"] = int(_safe_number(base.get("outline"), 0, 0, 12))
    base["shadow"] = round(_safe_number(base.get("shadow"), 0.4, 0, 1), 2)
    base["background_opacity"] = round(_safe_number(base.get("background_opacity"), 0, 0, 1), 2)
    base["radius"] = int(_safe_number(base.get("radius"), 24, 0, 60))
    base["padding"] = int(_safe_number(base.get("padding"), 20, 0, 80))
    base["max_words"] = int(_safe_number(base.get("max_words"), 3, 1, 12))
    base["max_chars"] = int(_safe_number(base.get("max_chars"), 22, 8, 60))
    base["max_duration"] = round(_safe_number(base.get("max_duration"), 2.6, 0.55, 8), 2)
    base["position"] = base.get("position") if base.get("position") in POSITION_LABELS else "bottom"
    base["align"] = "center"
    base["animation"] = base.get("animation") if base.get("animation") in ANIMATIONS else "none"
    base["glow"] = round(_safe_number(base.get("glow"), 0, 0, 1), 2)
    base["line_spacing"] = round(_safe_number(base.get("line_spacing"), 1.0, 0.8, 1.5), 2)
    base.pop("id", None)
    base.pop("label", None)
    base.pop("tagline", None)
    return base


def font_file(font: str, weight: int) -> Path:
    lib = FONT_LIBRARY.get(font, FONT_LIBRARY["inter"])
    actual = min(lib["weights"], key=lambda w: abs(w - int(weight)))
    path = FONTS_DIR / lib["weights"][actual]
    if path.exists():
        return path
    fallback = FONTS_DIR / "Inter-ExtraBold.ttf"
    if fallback.exists():
        return fallback
    raise FileNotFoundError(f"Caption font is missing: {path}. Reinstall Cutline so the bundled fonts are present.")


_FONT_CACHE: dict[tuple[str, int, int], ImageFont.FreeTypeFont] = {}


def load_font(font: str, weight: int, size: int) -> ImageFont.FreeTypeFont:
    key = (font, int(weight), int(size))
    if key not in _FONT_CACHE:
        _FONT_CACHE[key] = ImageFont.truetype(str(font_file(font, weight)), int(size))
    return _FONT_CACHE[key]


def style_css_font(font: str) -> str:
    return FONT_LIBRARY.get(font, FONT_LIBRARY["inter"])["css"]
