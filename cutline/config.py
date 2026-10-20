from __future__ import annotations

import copy
import math
from typing import Any

from .settings import ASPECTS
from .styles import get_preset, normalize_style

MODES = {
    "social": {
        "label": "Talking head",
        "eyebrow": "Client social",
        "description": "Tight cuts, bold captions, and a vertical timeline that lands ready to post.",
        "defaults": {
            "aspect": "9:16",
            "silence": {"enabled": True, "pacing": "balanced"},
            "captions": {"enabled": True, "source": "auto", "delivery": "overlay_srt", "preset": "creator"},
            "transitions": {"enabled": True, "preset": "light_leak", "frequency": 3, "duration": 0.5, "intensity": 0.72, "scope": "cuts"},
        },
    },
    "vlog": {
        "label": "Travel vlog",
        "eyebrow": "Long-form",
        "description": "Natural breathing room, a location card, and warm captions for the road.",
        "defaults": {
            "aspect": "16:9",
            "silence": {"enabled": True, "pacing": "gentle"},
            "captions": {"enabled": True, "source": "auto", "delivery": "overlay_srt", "preset": "journal"},
            "transitions": {"enabled": True, "preset": "soft_bloom", "frequency": 1, "duration": 0.8, "intensity": 0.55, "scope": "source_changes"},
        },
    },
    "music": {
        "label": "Music video",
        "eyebrow": "Beat-driven",
        "description": "Cut picture to the grid, add lyric captions, and land accents on the beat.",
        "defaults": {
            "aspect": "16:9",
            "silence": {"enabled": False, "pacing": "balanced"},
            "captions": {"enabled": False, "source": "file", "delivery": "overlay_srt", "preset": "neon"},
            "transitions": {"enabled": True, "preset": "flash", "frequency": 8, "duration": 0.28, "intensity": 0.75, "scope": "beats"},
        },
    },
}  # type: ignore[assignment]


TRANSITION_PRESETS = {
    "light_leak": {"label": "Light leak", "blurb": "Warm film shimmer", "duration": 0.6},
    "film_burn": {"label": "Film burn", "blurb": "Edge glow and ember grain", "duration": 0.65},
    "flash": {"label": "Flash", "blurb": "A clipped white snap", "duration": 0.3},
    "glitch": {"label": "Glitch", "blurb": "RGB tears and scan noise", "duration": 0.4},
    "soft_bloom": {"label": "Soft bloom", "blurb": "A gentle veil of light", "duration": 0.8},
    "whip": {"label": "Whip", "blurb": "Streaked motion energy", "duration": 0.35},
    "dip_black": {"label": "Dip to ink", "blurb": "A clean black breath", "duration": 0.5},
    "custom": {"label": "Your overlay", "blurb": "Bring your own alpha movie", "duration": 0.6},
}

SILENCE_PACING = {
    "gentle": {"label": "Natural", "blurb": "Keeps long thoughts intact", "min_silence": 0.9, "margin": 12.5, "padding": 0.24},
    "balanced": {"label": "Tight", "blurb": "A crisp, podcast-style cleanup", "min_silence": 0.55, "margin": 9.0, "padding": 0.15},
    "aggressive": {"label": "Surgical", "blurb": "Removes nearly every gap", "min_silence": 0.32, "margin": 6.5, "padding": 0.08},
}


def mode_defaults(mode: str) -> dict:
    mode = mode if mode in MODES else "social"
    base = {
        "mode": mode,
        "name": "",
        "aspect": "9:16",
        "fps": "auto",
        "silence": {
            "enabled": True,
            "pacing": "balanced",
            "threshold_db": None,
            "min_silence": None,
            "padding": None,
        },
        "captions": {
            "enabled": True,
            "source": "auto",
            "language": "auto",
            "quality": "balanced",
            "delivery": "overlay_srt",
            "preset": "creator",
            "style": get_preset("creator"),
            "timing": "source",
        },
        "transitions": {
            "enabled": True,
            "preset": "light_leak",
            "frequency": 3,
            "duration": 0.5,
            "intensity": 0.72,
            "scope": "cuts",
            "custom_asset": None,
        },
        "vlog": {
            "title": "",
            "location": "",
            "date": "",
            "title_card": True,
            "chapter_cards": True,
            "title_seconds": 4.0,
        },
        "music": {
            "bpm": None,
            "beats_per_cut": 4,
            "transition_every": 8,
            "order": "sequence",
            "start_at": 0.0,
            "audio_file": None,
        },
        "output": {
            "resolution": "1080",
            "overlay_codec": "qtrle",
            "preview": True,
        },
    }
    return _deep_merge(base, copy.deepcopy(MODES[mode]["defaults"]))


def _deep_merge(base: dict, incoming: dict) -> dict:
    for key, value in incoming.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            base[key] = _deep_merge(base[key], value)
        elif value is not None:
            base[key] = value
    return base


def _number(value, fallback, low, high):
    try:
        value = float(value)
    except (TypeError, ValueError):
        return fallback
    if math.isnan(value) or math.isinf(value):
        return fallback
    return max(low, min(high, value))


def _bool(value, fallback=False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("1", "true", "yes", "on")
    if value is None:
        return fallback
    return bool(value)


def normalize_config(raw: dict[str, Any] | None, default_mode: str = "social") -> dict:
    raw = raw if isinstance(raw, dict) else {}
    mode = str(raw.get("mode") or default_mode)
    mode = mode if mode in MODES else "social"
    cfg = mode_defaults(mode)

    cfg["mode"] = mode
    if raw.get("name"):
        cfg["name"] = str(raw["name"])[:140]
    if str(raw.get("aspect")) in ASPECTS:
        cfg["aspect"] = str(raw["aspect"])
    fps_raw = raw.get("fps", "auto")
    if fps_raw == "auto":
        cfg["fps"] = "auto"
    else:
        cfg["fps"] = round(_number(fps_raw, 30, 12, 60), 3)

    sil = raw.get("silence") if isinstance(raw.get("silence"), dict) else {}
    cfg["silence"]["enabled"] = _bool(sil.get("enabled"), cfg["silence"]["enabled"])
    if sil.get("pacing") in SILENCE_PACING:
        cfg["silence"]["pacing"] = sil["pacing"]
    for key in ("threshold_db", "min_silence", "padding"):
        if sil.get(key) is not None:
            lo, hi = {"threshold_db": (-70, -8), "min_silence": (0.1, 5.0), "padding": (0.0, 1.0)}[key]
            cfg["silence"][key] = round(_number(sil[key], cfg["silence"][key] or 0, lo, hi), 3)

    cap = raw.get("captions") if isinstance(raw.get("captions"), dict) else {}
    cfg["captions"]["enabled"] = _bool(cap.get("enabled"), cfg["captions"]["enabled"])
    if cap.get("source") in ("auto", "file", "none"):
        cfg["captions"]["source"] = cap["source"]
    if cfg["captions"]["source"] == "none":
        cfg["captions"]["enabled"] = False
    if cap.get("language"):
        cfg["captions"]["language"] = str(cap["language"])[:16]
    if cap.get("quality") in ("fast", "balanced", "best"):
        cfg["captions"]["quality"] = cap["quality"]
    if cap.get("delivery") in ("overlay_srt", "srt", "overlay"):
        cfg["captions"]["delivery"] = cap["delivery"]
    if cap.get("timing") in ("source", "timeline"):
        cfg["captions"]["timing"] = cap["timing"]
    if cap.get("preset"):
        cfg["captions"]["preset"] = str(cap["preset"])
    style_raw = cap.get("style") if isinstance(cap.get("style"), dict) else {}
    cfg["captions"]["style"] = normalize_style(style_raw, cfg["captions"]["preset"])

    tr = raw.get("transitions") if isinstance(raw.get("transitions"), dict) else {}
    cfg["transitions"]["enabled"] = _bool(tr.get("enabled"), cfg["transitions"]["enabled"])
    if tr.get("preset") in TRANSITION_PRESETS:
        cfg["transitions"]["preset"] = tr["preset"]
    cfg["transitions"]["frequency"] = int(_number(tr.get("frequency"), cfg["transitions"]["frequency"], 0, 64))
    cfg["transitions"]["duration"] = round(_number(tr.get("duration"), cfg["transitions"]["duration"], 0.12, 2.0), 2)
    cfg["transitions"]["intensity"] = round(_number(tr.get("intensity"), cfg["transitions"]["intensity"], 0.05, 1.0), 2)
    if tr.get("scope") in ("cuts", "source_changes", "beats"):
        cfg["transitions"]["scope"] = tr["scope"]
    if tr.get("custom_asset"):
        cfg["transitions"]["custom_asset"] = str(tr["custom_asset"])
    if cfg["transitions"]["preset"] == "custom" and not cfg["transitions"].get("custom_asset"):
        cfg["transitions"]["preset"] = "light_leak"

    vlog = raw.get("vlog") if isinstance(raw.get("vlog"), dict) else {}
    for key in ("title", "location", "date"):
        if vlog.get(key):
            cfg["vlog"][key] = str(vlog[key])[:120]
    cfg["vlog"]["title_card"] = _bool(vlog.get("title_card"), cfg["vlog"]["title_card"])
    cfg["vlog"]["chapter_cards"] = _bool(vlog.get("chapter_cards"), cfg["vlog"]["chapter_cards"])
    cfg["vlog"]["title_seconds"] = round(_number(vlog.get("title_seconds"), 4.0, 1.0, 8.0), 1)

    output = raw.get("output") if isinstance(raw.get("output"), dict) else {}
    if str(output.get("resolution")) in ("1080", "720", "720p"):
        cfg["output"]["resolution"] = "720" if str(output["resolution"]).startswith("720") else "1080"
    if output.get("overlay_codec") in ("qtrle", "prores"):
        cfg["output"]["overlay_codec"] = output["overlay_codec"]

    music = raw.get("music") if isinstance(raw.get("music"), dict) else {}
    if music.get("bpm") is not None:
        cfg["music"]["bpm"] = round(_number(music["bpm"], 120, 40, 240), 2)
    allowed_bpc = (1, 2, 4, 8, 16)
    cfg["music"]["beats_per_cut"] = int(_number(music.get("beats_per_cut"), 4, 1, 32))
    if cfg["music"]["beats_per_cut"] not in allowed_bpc:
        cfg["music"]["beats_per_cut"] = min(allowed_bpc, key=lambda x: abs(x - cfg["music"]["beats_per_cut"]))
    cfg["music"]["transition_every"] = int(_number(music.get("transition_every"), 8, 0, 64))
    if music.get("order") in ("sequence", "shuffle"):
        cfg["music"]["order"] = music["order"]
    cfg["music"]["start_at"] = round(_number(music.get("start_at"), 0.0, 0.0, 300.0), 2)
    return cfg


def output_dimensions(config: dict) -> tuple[int, int]:
    aspect = config.get("aspect") if config.get("aspect") in ASPECTS else "9:16"
    width, height = ASPECTS[aspect]
    resolution = str(config.get("output", {}).get("resolution", "1080"))
    if resolution in ("720", "720p"):
        scale = 720 / 1080
        width, height = width * scale, height * scale
    width = int(round(width / 2) * 2)
    height = int(round(height / 2) * 2)
    return width, height


def normalize_fps(value, fallback: float = 30.0) -> float:
    try:
        value = float(value)
    except (TypeError, ValueError):
        return fallback
    if value <= 0:
        return fallback
    if abs(value - 23.976) < 0.02:
        return 23.976
    if abs(value - 29.97) < 0.02:
        return 29.97
    if abs(value - 59.94) < 0.02:
        return 59.94
    return round(value, 3)
