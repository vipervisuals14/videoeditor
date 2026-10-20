from __future__ import annotations

import math
import random
import subprocess
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .ffmpeg import FFmpegError, encode_video_frames, ffmpeg_exe
from .settings import DEMO_DIR

WIDTH, HEIGHT = 540, 960
FPS = 30
DURATION = 24.0

SCENES = [
    (0.0, 8.0, "lisbon"),
    (8.0, 16.0, "coast"),
    (16.0, 24.0, "market"),
]

SPEECH = [(0.4, 3.2), (3.9, 7.0), (8.0, 11.5), (12.6, 16.0), (17.0, 20.2), (21.0, 23.4)]

DEMO_CAPTIONS = """1
00:00:00,500 --> 00:00:03,100
We just landed in Lisbon and the light is unreal.

2
00:00:03,900 --> 00:00:06,900
I want to show you this tiny street before the sun drops.

3
00:00:08,100 --> 00:00:11,400
Then we drove the coast road with the windows down.

4
00:00:12,700 --> 00:00:15,900
Every corner looked like a postcard, honestly.

5
00:00:17,100 --> 00:00:20,100
The night market smells like charcoal and orange peel.

6
00:00:21,100 --> 00:00:23,300
Come with me, we are almost at the viewpoint.
"""


def _lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _scene_lisbon(t: float) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(image)
    top = (255, 176, 92)
    bottom = (58, 33, 48)
    for y in range(HEIGHT):
        draw.line((0, y, WIDTH, y), fill=_lerp(top, bottom, (y / HEIGHT) ** 0.8))
    rng = random.Random(11)
    for _ in range(9):
        x = rng.uniform(-40, WIDTH)
        w = rng.uniform(50, 130)
        h = rng.uniform(180, 460)
        color = rng.choice([(196, 118, 92), (170, 92, 74), (214, 148, 112), (140, 78, 70)])
        draw.rectangle((x, HEIGHT - h, x + w, HEIGHT), fill=color)
        for row in range(3):
            for col in range(2):
                wx = x + 14 + col * (w / 2.4)
                wy = HEIGHT - h + 40 + row * 58
                if wx + 16 < x + w:
                    draw.rectangle((wx, wy, wx + 16, wy + 22), fill=(255, 214, 138))
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx = WIDTH * (0.7 + 0.03 * math.sin(t * 0.6))
    cy = HEIGHT * 0.28
    for radius, alpha in ((260, 60), (170, 80), (95, 140)):
        gd.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(255, 214, 150, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(46))
    return Image.alpha_composite(image.convert("RGBA"), glow).convert("RGB")


def _scene_coast(t: float) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(image)
    horizon = int(HEIGHT * 0.52)
    for y in range(horizon):
        draw.line((0, y, WIDTH, y), fill=_lerp((255, 196, 132), (96, 150, 196), (y / horizon) ** 1.2))
    for y in range(horizon, HEIGHT):
        depth = (y - horizon) / (HEIGHT - horizon)
        draw.line((0, y, WIDTH, y), fill=_lerp((36, 104, 132), (12, 34, 58), depth))
    draw.ellipse((WIDTH * 0.58, horizon - 92, WIDTH * 0.58 + 96, horizon + 4), fill=(255, 236, 184))
    offset = int((t * 60) % 160)
    for i in range(-2, 9):
        y = horizon + 26 + i * 34 + offset % 34
        if y < HEIGHT:
            draw.line((0, y, WIDTH, y), fill=(150, 210, 220), width=2)
    draw.polygon([(0, horizon + 120), (WIDTH * 0.26, horizon - 20), (WIDTH * 0.52, horizon + 90), (WIDTH, horizon - 10), (WIDTH, HEIGHT), (0, HEIGHT)], fill=(18, 44, 48))
    return image


def _scene_market(t: float) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(image)
    for y in range(HEIGHT):
        draw.line((0, y, WIDTH, y), fill=_lerp((46, 12, 42), (10, 8, 18), y / HEIGHT))
    rng = random.Random(7)
    for _ in range(34):
        x = rng.uniform(0, WIDTH)
        y = rng.uniform(0, HEIGHT)
        radius = rng.uniform(6, 46)
        color = rng.choice([(255, 170, 74), (255, 96, 72), (255, 220, 150), (130, 210, 255)])
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
    image = image.filter(ImageFilter.GaussianBlur(9))
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, int(HEIGHT * 0.72), WIDTH, HEIGHT), fill=(8, 4, 12, 190))
    for x in range(-40, WIDTH + 80, 90):
        od.polygon([(x, int(HEIGHT * 0.72)), (x + 60, int(HEIGHT * 0.72)), (x + 20, int(HEIGHT * 0.72) + 40), (x - 40, int(HEIGHT * 0.72) + 40)], fill=(220, 132, 80, 90))
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def _frame(t: float) -> Image.Image:
    for start, end, name in SCENES:
        if start <= t < end:
            if name == "lisbon":
                return _scene_lisbon(t)
            if name == "coast":
                return _scene_coast(t)
            return _scene_market(t)
    return _scene_market(t)


def _speech_audio(sample_rate: int = 44100) -> np.ndarray:
    total = int(sample_rate * DURATION)
    audio = np.zeros(total, dtype=np.float64)
    rng = np.random.default_rng(12)
    for index, (start, end) in enumerate(SPEECH):
        a = int(start * sample_rate)
        b = int(end * sample_rate)
        length = b - a
        tt = np.arange(length) / sample_rate
        base = 118 + 9 * math.sin(index * 1.7)
        voice = (
            0.5 * np.sin(2 * np.pi * base * tt)
            + 0.26 * np.sin(2 * np.pi * base * 2.02 * tt + 0.3)
            + 0.14 * np.sin(2 * np.pi * base * 3.05 * tt + 1.1)
            + 0.07 * rng.normal(0, 1, length)
        )
        syllables = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 3.4 * tt + index))
        audio[a:b] += voice * syllables * 0.36
    # Room tone so the silence detector has a floor to learn.
    audio += rng.normal(0, 0.0022, total)
    audio = np.clip(audio, -1, 1)
    return (audio * 32767).astype(np.int16)


def _write_wav(path: Path, audio: np.ndarray, sample_rate: int = 44100) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(audio.tobytes())
    return path


def _music_audio(bpm: float = 100.0, duration: float = 32.0, sample_rate: int = 44100) -> np.ndarray:
    total = int(sample_rate * duration)
    audio = np.zeros(total, dtype=np.float64)
    beat = 60.0 / bpm
    t = 0.0
    index = 0
    while t < duration:
        at = int(t * sample_rate)
        n = int(0.24 * sample_rate)
        tt = np.arange(n) / sample_rate
        kick = np.sin(2 * np.pi * (58 - 18 * tt) * tt) * np.exp(-tt * 16) * 0.9
        end = min(total, at + n)
        audio[at:end] += kick[: end - at]
        if index % 2 == 1:
            hat_at = int((t + beat / 2) * sample_rate)
            hn = int(0.05 * sample_rate)
            ht = np.arange(hn) / sample_rate
            hat = np.random.default_rng(index).normal(0, 1, hn) * np.exp(-ht * 90) * 0.12
            hend = min(total, hat_at + hn)
            audio[hat_at:hend] += hat[: hend - hat_at]
        t += beat
        index += 1
    # Warm pad + bass.
    tt = np.arange(total) / sample_rate
    chords = [(110, 164.81, 220), (98, 146.83, 196), (123.47, 185, 246.94), (87.31, 130.81, 174.61)]
    for chord_index, freqs in enumerate(chords * 8):
        start = int(chord_index * 4 * 60 / bpm * sample_rate)
        end = min(total, start + int(4 * 60 / bpm * sample_rate))
        if start >= total:
            break
        local = np.arange(end - start) / sample_rate
        env = np.minimum(1.0, local / 0.12) * np.minimum(1.0, (local[-1] - local) / 0.3 + 0.0001)
        pad = sum(np.sin(2 * np.pi * f * local + i) for i, f in enumerate(freqs)) / 3
        audio[start:end] += pad * env * 0.10
    audio /= max(1.0, float(np.max(np.abs(audio))) / 0.92)
    return (audio * 32767).astype(np.int16)


def _mux(video: Path, audio: Path, dst: Path) -> Path:
    cmd = [
        ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
        "-i", str(video), "-i", str(audio), "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
        "-shortest", "-movflags", "+faststart", str(dst),
    ]
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0:
        raise FFmpegError((proc.stderr or b"").decode("utf-8", "replace")[-1200:])
    return dst


def ensure_demo(force: bool = False) -> dict:
    folder = DEMO_DIR
    folder.mkdir(parents=True, exist_ok=True)
    clip = folder / "lisbon_demo.mp4"
    music = folder / "night_drive_demo.m4a"
    srt = folder / "lisbon_demo.srt"
    if srt.exists() is False:
        srt.write_text(DEMO_CAPTIONS, encoding="utf-8")
    if force or not clip.exists():
        video_only = folder / "_video.mp4"
        audio_path = folder / "_voice.wav"
        frames = (_frame(i / FPS) for i in range(int(DURATION * FPS)))
        encode_video_frames(frames, video_only, WIDTH, HEIGHT, FPS, crf=20)
        _write_wav(audio_path, _speech_audio())
        _mux(video_only, audio_path, clip)
        video_only.unlink(missing_ok=True)
        audio_path.unlink(missing_ok=True)
    if force or not music.exists():
        wav_path = folder / "_music.wav"
        _write_wav(wav_path, _music_audio())
        cmd = [
            ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
            "-i", str(wav_path), "-c:a", "aac", "-b:a", "192k", str(music),
        ]
        proc = subprocess.run(cmd, capture_output=True)
        wav_path.unlink(missing_ok=True)
        if proc.returncode != 0:
            raise FFmpegError((proc.stderr or b"").decode("utf-8", "replace")[-1200:])
    return {"clip": str(clip), "music": str(music), "srt": str(srt), "duration": DURATION, "music_duration": 32.0}
