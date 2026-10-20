from __future__ import annotations

from typing import Iterable

import numpy as np

from .config import SILENCE_PACING


def _db(value: np.ndarray) -> np.ndarray:
    return 20.0 * np.log10(np.maximum(value, 1e-9))


def envelope(samples: np.ndarray, sample_rate: int = 16000, win: float = 0.03, hop: float = 0.01) -> tuple[np.ndarray, float]:
    win_n = max(1, int(win * sample_rate))
    hop_n = max(1, int(hop * sample_rate))
    if samples.size < win_n:
        rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2) + 1e-12))
        return np.array([20.0 * np.log10(max(rms, 1e-9))]), 0.0
    count = 1 + (samples.size - win_n) // hop_n
    if count <= 0:
        return np.array([-90.0]), 0.0
    indices = np.arange(count)[:, None] * hop_n + np.arange(win_n)[None, :]
    frames = samples[indices].astype(np.float64)
    rms = np.sqrt(np.mean(frames * frames, axis=1) + 1e-12)
    db = _db(rms)
    # A tiny median-style smoother prevents a single quiet frame from splitting speech.
    if db.size >= 5:
        padded = np.pad(db, (2, 2), mode="edge")
        stacked = np.stack([padded[i:i + db.size] for i in range(5)], axis=1)
        db = np.median(stacked, axis=1)
    return db, hop


def _runs(mask: np.ndarray) -> list[tuple[int, int]]:
    if mask.size == 0:
        return []
    padded = np.concatenate(([False], mask.astype(bool), [False]))
    edges = np.flatnonzero(padded[1:] != padded[:-1])
    return [(int(edges[i]), int(edges[i + 1])) for i in range(0, len(edges), 2)]


def _complement(removed: Iterable[tuple[float, float]], duration: float) -> list[dict]:
    out: list[dict] = []
    cursor = 0.0
    for start, end in sorted(removed):
        start = max(0.0, min(duration, start))
        end = max(0.0, min(duration, end))
        if end <= start:
            continue
        if start > cursor + 1e-4:
            out.append({"start": round(cursor, 4), "end": round(start, 4)})
        cursor = max(cursor, end)
    if cursor < duration - 1e-4:
        out.append({"start": round(cursor, 4), "end": round(duration, 4)})
    return out


def analyze_silence(
    samples: np.ndarray,
    sample_rate: int,
    duration: float,
    pacing: str = "balanced",
    threshold_db: float | None = None,
    min_silence: float | None = None,
    padding: float | None = None,
    min_keep: float = 0.16,
) -> dict:
    preset = SILENCE_PACING.get(pacing, SILENCE_PACING["balanced"])
    min_silence = float(min_silence if min_silence is not None else preset["min_silence"])
    padding = float(padding if padding is not None else preset["padding"])
    db, hop = envelope(samples, sample_rate)
    if db.size == 0:
        return _full(duration, "No audio envelope was available.")

    # Ignore digital silence when estimating the room tone.
    valid = db[db > -95]
    noise_floor = float(np.percentile(valid, 15)) if valid.size else -80.0
    speech_level = float(np.percentile(db, 92))
    if threshold_db is None:
        threshold = noise_floor + float(preset["margin"])
        threshold = max(-58.0, min(-16.0, threshold))
        # If the dynamic range is very shallow the material is likely a music bed,
        # so a conservative gate avoids cutting into it.
        if speech_level - noise_floor < 8.0:
            threshold = noise_floor + max(5.0, (speech_level - noise_floor) * 0.45)
    else:
        threshold = float(threshold_db)

    quiet = db < threshold
    raw_runs = _runs(quiet)
    removed: list[tuple[float, float]] = []
    for start_i, end_i in raw_runs:
        start = start_i * hop
        end = min(duration, end_i * hop + 0.03)
        if end - start < min_silence:
            continue
        # Keep a little air around the actual speech.
        cut_start = start + padding if start_i > 0 else 0.0
        cut_end = end - padding if end_i < len(db) else duration
        if cut_end - cut_start >= 0.06:
            removed.append((cut_start, cut_end))

    kept = _complement(removed, duration)
    kept = [seg for seg in kept if seg["end"] - seg["start"] >= min_keep]
    if not kept:
        kept = [{"start": 0.0, "end": round(duration, 4)}]
    # Merge segments separated by only a frame or two of rounding.
    merged: list[dict] = []
    for seg in kept:
        if merged and seg["start"] - merged[-1]["end"] <= 0.045:
            merged[-1]["end"] = seg["end"]
        else:
            merged.append(dict(seg))
    kept = [
        {"start": round(seg["start"], 4), "end": round(seg["end"], 4), "duration": round(seg["end"] - seg["start"], 4)}
        for seg in merged
    ]
    removed_total = max(0.0, duration - sum(seg["duration"] for seg in kept))
    return {
        "duration": round(duration, 4),
        "noise_floor_db": round(noise_floor, 2),
        "speech_level_db": round(speech_level, 2),
        "threshold_db": round(threshold, 2),
        "pacing": pacing,
        "min_silence": min_silence,
        "padding": padding,
        "segments": kept,
        "removed": [[round(a, 3), round(b, 3)] for a, b in sorted(removed)],
        "removed_seconds": round(removed_total, 3),
        "kept_seconds": round(sum(seg["duration"] for seg in kept), 3),
        "removed_ratio": round(removed_total / duration, 4) if duration else 0.0,
        "cuts": max(0, len(kept) - 1),
    }


def _full(duration: float, warning: str) -> dict:
    return {
        "duration": round(duration, 4),
        "noise_floor_db": None,
        "speech_level_db": None,
        "threshold_db": None,
        "pacing": "balanced",
        "min_silence": 0.0,
        "padding": 0.0,
        "segments": [{"start": 0.0, "end": round(duration, 4), "duration": round(duration, 4)}],
        "removed": [],
        "removed_seconds": 0.0,
        "kept_seconds": round(duration, 4),
        "removed_ratio": 0.0,
        "cuts": 0,
        "warning": warning,
    }


def silent_full_track(duration: float) -> dict:
    return {
        "duration": round(duration, 4),
        "noise_floor_db": None,
        "speech_level_db": None,
        "threshold_db": None,
        "pacing": "off",
        "min_silence": 0.0,
        "padding": 0.0,
        "segments": [{"start": 0.0, "end": round(duration, 4), "duration": round(duration, 4)}],
        "removed": [],
        "removed_seconds": 0.0,
        "kept_seconds": round(duration, 4),
        "removed_ratio": 0.0,
        "cuts": 0,
    }
