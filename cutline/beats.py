from __future__ import annotations

import math

import numpy as np

FRAME = 1024
HOP = 512


def _onset_envelope(samples: np.ndarray, sample_rate: int) -> tuple[np.ndarray, np.ndarray, float]:
    if samples.size < FRAME * 2:
        return np.array([]), np.array([]), HOP / sample_rate
    frame = min(FRAME, 2 ** int(math.floor(math.log2(max(256, samples.size // 8)))))
    hop = max(128, frame // 2)
    count = 1 + (samples.size - frame) // hop
    if count < 4:
        return np.array([]), np.array([]), hop / sample_rate
    window = np.hanning(frame).astype(np.float32)
    # Compute the spectrum in chunks to keep memory flat on long tracks.
    chunk = max(1, int(4_000_000 / frame))
    spectra = []
    for start in range(0, count, chunk):
        idx = np.arange(start, min(count, start + chunk))[:, None] * hop + np.arange(frame)[None, :]
        frames = samples[idx].astype(np.float32) * window
        spectra.append(np.abs(np.fft.rfft(frames, axis=1)))
    spectrum = np.concatenate(spectra, axis=0)
    freqs = np.fft.rfftfreq(frame, 1.0 / sample_rate)
    low = spectrum[:, (freqs >= 35) & (freqs <= 240)].sum(axis=1)
    mid = spectrum[:, (freqs > 240) & (freqs <= 2500)].sum(axis=1)
    high = spectrum[:, (freqs > 2500) & (freqs <= 10000)].sum(axis=1)
    energy = np.log1p(low * 1.4) + np.log1p(mid * 0.65) + np.log1p(high * 0.25)
    novelty = np.maximum(0.0, np.diff(energy, prepend=energy[0]))
    if novelty.size > 5:
        pooled = np.convolve(novelty, np.ones(3) / 3.0, mode="same")
    else:
        pooled = novelty
    std = float(pooled.std())
    if std > 1e-9:
        pooled = (pooled - float(pooled.mean())) / std
        pooled = np.maximum(pooled, 0.0)
    return pooled.astype(np.float64), freqs, hop / sample_rate


def _tempo_from_envelope(env: np.ndarray, frame_rate: float) -> tuple[float, float]:
    if env.size < 16:
        return 120.0, 0.0
    centred = env - env.mean()
    size = 1
    while size < centred.size * 2:
        size *= 2
    spectrum = np.fft.rfft(centred, n=size)
    autocorr = np.fft.irfft(spectrum * np.conj(spectrum))[:centred.size]
    if autocorr[0] <= 1e-9:
        return 120.0, 0.0
    min_lag = max(2, int((60.0 / 200.0) / frame_rate))
    max_lag = min(autocorr.size - 1, int((60.0 / 55.0) / frame_rate))
    if max_lag <= min_lag:
        return 120.0, 0.0
    lags = np.arange(min_lag, max_lag + 1)
    score = autocorr[lags].copy()
    for multiple in (2, 3):
        second = lags * multiple
        valid = second < autocorr.size
        score[valid] += 0.45 * autocorr[second[valid]]
    best = int(np.argmax(score))
    lag = float(lags[best])
    bpm = 60.0 / (lag * frame_rate)
    confidence = float(score[best] / (autocorr[0] + 1e-9))
    # Common octave errors: prefer the musical range.
    if bpm < 72:
        doubled = bpm * 2
        if doubled <= 190:
            bpm = doubled
    elif bpm > 185:
        bpm = bpm / 2
    return round(float(bpm), 2), round(min(1.0, max(0.0, confidence)), 3)


def _best_phase(env: np.ndarray, frame_rate: float, period: float) -> float:
    if env.size < 8:
        return 0.0
    best_offset = 0.0
    best_score = -1.0
    grid_count = int(env.size * frame_rate / max(period, 1e-6)) + 2
    for offset in np.linspace(0, period, 64, endpoint=False):
        times = offset + np.arange(grid_count) * period
        indices = np.round(times / frame_rate).astype(int)
        indices = indices[(indices >= 0) & (indices < env.size)]
        if indices.size == 0:
            continue
        score = float(env[indices].sum())
        if score > best_score:
            best_score, best_offset = score, float(offset)
    return best_offset


def detect_beats(
    samples: np.ndarray,
    sample_rate: int,
    duration: float,
    hint_bpm: float | None = None,
) -> dict:
    env, freqs, frame_rate = _onset_envelope(samples, sample_rate)
    detected_bpm, confidence = _tempo_from_envelope(env, frame_rate) if env.size else (120.0, 0.0)
    bpm = float(hint_bpm) if hint_bpm else detected_bpm
    bpm = max(40.0, min(240.0, bpm))
    period = 60.0 / bpm
    offset = _best_phase(env, frame_rate, period) if env.size else 0.0
    beat_count = int(max(0, duration - offset) / period) + 1
    beats = [round(offset + i * period, 4) for i in range(max(0, beat_count))]
    while beats and beats[-1] > duration + 0.02:
        beats.pop()
    return {
        "bpm": round(bpm, 2),
        "detected_bpm": detected_bpm,
        "confidence": confidence,
        "source": "manual" if hint_bpm else "detected",
        "period": round(period, 5),
        "offset": round(offset, 4),
        "beats": beats,
        "duration": round(duration, 4),
        "onsets": int(env.size),
    }


def beat_grid_after(duration: float, bpm: float, offset: float = 0.0, step_beats: int = 1) -> list[float]:
    period = 60.0 / max(40.0, min(240.0, float(bpm)))
    step = period * max(1, int(step_beats))
    first = offset
    if first < 0:
        first += period * math.ceil(-first / period)
    out: list[float] = []
    value = first
    while value <= duration + 0.01:
        out.append(round(value, 4))
        value += step
    return out
