from __future__ import annotations

import os
import re
import threading
from pathlib import Path
from typing import Callable

from .settings import MODELS_DIR

_MODEL_CACHE: dict[tuple[str, str, str], object] = {}
_MODEL_LOCK = threading.Lock()

MODEL_NAMES = {
    "fast": {"en": "tiny.en", "multi": "tiny"},
    "balanced": {"en": "base.en", "multi": "base"},
    "best": {"en": "small.en", "multi": "small"},
}


class TranscriptionUnavailable(RuntimeError):
    pass


class NoSpeechFound(RuntimeError):
    pass


def faster_whisper_installed() -> bool:
    try:
        import faster_whisper  # noqa: F401

        return True
    except Exception:
        return False


def installed_models() -> list[str]:
    try:
        if not MODELS_DIR.exists():
            return []
        names = sorted({p.name for p in MODELS_DIR.iterdir() if p.is_dir()})
        return names
    except Exception:
        return []


def capabilities() -> dict:
    return {
        "available": faster_whisper_installed(),
        "engine": "faster-whisper (local)",
        "models_downloaded": installed_models(),
        "download_first_run": True,
        "note": "Speech-to-text runs privately on this machine. The first run downloads a 75–500 MB model.",
    }


def model_for(quality: str, language: str) -> str:
    env_model = os.environ.get("CUTLINE_WHISPER_MODEL")
    if env_model:
        return env_model
    quality = quality if quality in MODEL_NAMES else "balanced"
    lang = (language or "auto").lower()
    is_english = lang in ("auto", "en", "english")
    return MODEL_NAMES[quality]["en" if is_english else "multi"]


def _load_model(model_name: str):
    try:
        from faster_whisper import WhisperModel
    except Exception as exc:  # pragma: no cover - environment dependent
        raise TranscriptionUnavailable(
            "Automatic captions need the optional `faster-whisper` package. "
            "Run `./install.sh` again, or upload an SRT instead."
        ) from exc
    device = os.environ.get("CUTLINE_WHISPER_DEVICE", "auto")
    compute = os.environ.get("CUTLINE_WHISPER_COMPUTE", "int8")
    key = (model_name, device, compute)
    with _MODEL_LOCK:
        if key in _MODEL_CACHE:
            return _MODEL_CACHE[key]
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        try:
            model = WhisperModel(
                model_name,
                device=device,
                compute_type=compute,
                download_root=str(MODELS_DIR),
            )
        except Exception as exc:
            message = str(exc)
            if re.search(r"connect|download|resolve|HTTP|network|offline|getaddrinfo", message, re.I):
                raise TranscriptionUnavailable(
                    "The speech model could not be downloaded. Connect to the internet once "
                    "so Cutline can fetch it, then try again. You can also upload an SRT/VTT/LRC file."
                ) from exc
            raise TranscriptionUnavailable(
                "The local speech engine could not start. "
                "Try `pip install --upgrade faster-whisper`, or upload an SRT instead.\n"
                f"{message[:400]}"
            ) from exc
        _MODEL_CACHE[key] = model
        return model


def _fallback_words(start: float, end: float, text: str) -> list[dict]:
    tokens = [token for token in re.split(r"(\s+)", text) if token]
    words = [token for token in tokens if token.strip()]
    if not words:
        return []
    span = max(0.12, end - start)
    weights = [max(1, len(re.sub(r"\W", "", word))) for word in words]
    total = sum(weights)
    cursor = start
    out = []
    for word, weight in zip(words, weights):
        length = span * weight / total
        out.append({"word": word, "start": round(cursor, 3), "end": round(cursor + length, 3), "probability": None})
        cursor += length
    return out


def transcribe_audio(
    audio_path: str | Path,
    duration: float,
    language: str = "auto",
    quality: str = "balanced",
    progress: Callable[[float, str], None] | None = None,
) -> dict:
    if not faster_whisper_installed():
        raise TranscriptionUnavailable(
            "Automatic captions are not installed in this copy of Cutline. "
            "Run `./install.sh` (or `pip install faster-whisper`) and restart, "
            "or choose “Upload an SRT” in the captions step."
        )
    model_name = model_for(quality, language)
    if progress:
        progress(0.02, f"Loading the {model_name} speech model…")
    model = _load_model(model_name)
    lang = None if (language or "auto") in ("auto", "") else language
    if progress:
        progress(0.08, "Listening for speech…")
    try:
        segments_iter, info = model.transcribe(
            str(audio_path),
            language=lang,
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 320, "speech_pad_ms": 120},
            word_timestamps=True,
            condition_on_previous_text=False,
            temperature=0.0,
        )
    except Exception as exc:
        raise TranscriptionUnavailable(f"Speech recognition failed: {str(exc)[:500]}") from exc

    segments: list[dict] = []
    all_words: list[dict] = []
    for segment in segments_iter:
        text = str(getattr(segment, "text", "") or "").strip()
        start = float(getattr(segment, "start", 0.0))
        end = float(getattr(segment, "end", start + 0.2))
        words: list[dict] = []
        for word in getattr(segment, "words", None) or []:
            raw = str(getattr(word, "word", "") or "")
            if not raw.strip():
                continue
            words.append({
                "word": raw.strip(),
                "start": round(float(getattr(word, "start", start)), 3),
                "end": round(float(getattr(word, "end", end)), 3),
                "probability": round(float(getattr(word, "probability", 0.0)), 3) if getattr(word, "probability", None) is not None else None,
            })
        if not words and text:
            words = _fallback_words(start, end, text)
        if text:
            segments.append({
                "start": round(start, 3),
                "end": round(end, 3),
                "text": text,
                "words": words,
            })
            all_words.extend(words)
        if progress and duration > 0:
            fraction = min(0.99, max(0.08, end / duration))
            progress(0.08 + fraction * 0.9, f"Transcribing at {int(end):02d}:{int((end % 60)):02d}…")
    if not segments:
        raise NoSpeechFound(
            "No speech was detected in this audio. Try another clip, turn off the music bed, "
            "or add captions manually with an SRT file."
        )
    return {
        "segments": segments,
        "words": all_words,
        "language": getattr(info, "language", lang or "auto"),
        "language_probability": round(float(getattr(info, "language_probability", 0.0) or 0.0), 3),
        "model": model_name,
    }
