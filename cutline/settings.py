from __future__ import annotations

import os
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = APP_ROOT.parent
ASSETS_DIR = APP_ROOT / "assets"
FONTS_DIR = ASSETS_DIR / "fonts"
STATIC_DIR = APP_ROOT / "static"

DATA_DIR = Path(os.environ.get("CUTLINE_DATA", PROJECT_ROOT / "data")).expanduser().resolve()
PROJECTS_DIR = DATA_DIR / "projects"
MODELS_DIR = Path(os.environ.get("CUTLINE_MODELS", DATA_DIR / "models")).expanduser().resolve()
DEMO_DIR = DATA_DIR / "demo"

HOST = os.environ.get("CUTLINE_HOST", "0.0.0.0")
PORT = int(os.environ.get("CUTLINE_PORT", "8787"))

ASPECTS: dict[str, tuple[int, int]] = {
    "9:16": (1080, 1920),
    "16:9": (1920, 1080),
    "1:1": (1080, 1080),
    "4:5": (1080, 1350),
}

FPS_CHOICES = (23.976, 24, 25, 29.97, 30, 50, 59.94, 60)


def ensure_dirs() -> None:
    for directory in (DATA_DIR, PROJECTS_DIR, MODELS_DIR, DEMO_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def human_size(num: int | float) -> str:
    value = float(num)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if value < 1024 or unit == "TB":
            return f"{value:.0f} {unit}" if unit == "B" else f"{value:.1f} {unit}"
        value /= 1024
    return f"{value:.1f} TB"
