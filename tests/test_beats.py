from __future__ import annotations

import numpy as np
import pytest

from cutline.beats import beat_grid_after, detect_beats


def _click_track(bpm=120.0, duration=20.0, sample_rate=22050, offset=0.25):
    t = np.arange(int(sample_rate * duration)) / sample_rate
    signal = np.random.default_rng(5).normal(0, 0.002, t.size)
    period = 60.0 / bpm
    beat = offset
    while beat < duration:
        start = int(beat * sample_rate)
        length = int(0.07 * sample_rate)
        tt = np.arange(length) / sample_rate
        hit = 0.9 * np.exp(-tt * 30) * np.sin(2 * np.pi * 60 * tt)
        end = min(t.size, start + length)
        signal[start:end] += hit[: end - start]
        beat += period
    return signal, sample_rate


def test_detects_tempo_of_a_click_track():
    samples, rate = _click_track(bpm=120.0, duration=24.0)
    result = detect_beats(samples, rate, 24.0)
    assert result["bpm"] == pytest.approx(120.0, abs=3.0)
    assert result["beats"][0] == pytest.approx(0.25, abs=0.12)
    assert len(result["beats"]) >= 45


def test_manual_bpm_overrides_detection():
    samples, rate = _click_track(bpm=100.0)
    result = detect_beats(samples, rate, 20.0, hint_bpm=140)
    assert result["bpm"] == 140
    assert result["source"] == "manual"
    assert result["detected_bpm"] == pytest.approx(100.0, abs=6.0)


def test_silence_returns_a_usable_grid():
    samples = np.zeros(22050 * 5, dtype=np.float32)
    result = detect_beats(samples, 22050, 5.0)
    assert result["bpm"] >= 40
    assert len(result["beats"]) >= 3


def test_beat_grid_after_alignment():
    grid = beat_grid_after(4.0, 120.0, offset=0.1, step_beats=1)
    assert grid[0] == pytest.approx(0.1)
    assert grid[1] == pytest.approx(0.6)
    assert grid[-1] <= 4.0
