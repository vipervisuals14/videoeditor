from __future__ import annotations

import numpy as np

from cutline.silence import analyze_silence


def _speechy(duration=12.0, sample_rate=16000, windows=None, noise=0.0012):
    windows = windows or [(0.0, 3.0), (5.0, 8.0), (10.0, 12.0)]
    t = np.arange(int(sample_rate * duration)) / sample_rate
    envelope = np.zeros_like(t)
    for start, end in windows:
        mask = (t >= start) & (t < end)
        envelope[mask] = 0.25 * (0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * t[mask]))
    rng = np.random.default_rng(3)
    signal = envelope * np.sin(2 * np.pi * 180 * t) + rng.normal(0, noise, t.size)
    return signal, sample_rate


def test_detects_gaps_and_keeps_speech():
    samples, rate = _speechy()
    result = analyze_silence(samples, rate, 12.0, pacing="balanced")
    segments = result["segments"]
    assert len(segments) == 3
    assert segments[0]["start"] == 0.0
    # Every speech window is inside a kept segment.
    for start, end in [(0.0, 3.0), (5.0, 8.0), (10.0, 12.0)]:
        assert any(seg["start"] <= start + 0.05 and seg["end"] >= end - 0.05 for seg in segments)
    assert 3.0 < result["removed_seconds"] < 5.0
    assert result["cuts"] == 2


def test_pacing_changes_aggressiveness():
    samples, rate = _speechy(windows=[(0.0, 5.0), (5.45, 10.0)], noise=0.0008)
    gentle = analyze_silence(samples, rate, 10.0, pacing="gentle")
    aggressive = analyze_silence(samples, rate, 10.0, pacing="aggressive")
    assert aggressive["removed_seconds"] >= gentle["removed_seconds"]


def test_silent_track_is_kept_whole():
    samples = np.zeros(16000 * 4, dtype=np.float32)
    result = analyze_silence(samples, 16000, 4.0)
    # A completely silent file should not vanish: keep one segment.
    assert len(result["segments"]) == 1
    assert result["segments"][0]["duration"] > 0


def test_segments_never_overlap_and_stay_inside_duration():
    samples, rate = _speechy(duration=20.0, windows=[(0.2, 2.0), (2.4, 6.7), (7.0, 9.2), (12.0, 19.5)])
    result = analyze_silence(samples, rate, 20.0, pacing="aggressive")
    last_end = -1.0
    for segment in result["segments"]:
        assert segment["start"] >= last_end - 1e-6
        assert segment["end"] <= 20.0 + 1e-6
        assert segment["duration"] > 0
        last_end = segment["end"]
