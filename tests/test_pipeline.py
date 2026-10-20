from __future__ import annotations

import json
import subprocess
import wave
from pathlib import Path

import numpy as np
import pytest
from opentimelineio import adapters

from cutline.config import normalize_config
from cutline.ffmpeg import ffmpeg_exe, probe
from cutline.pipeline import run_build, run_recaption
from cutline.store import ProjectStore


def _noisy_speech(path: Path, duration=9.0, sample_rate=44100):
    """Speech-like bursts with sleeps between them."""
    windows = [(0.2, 2.4), (3.2, 5.6), (7.0, 8.6)]
    t = np.arange(int(sample_rate * duration)) / sample_rate
    amplitude = np.zeros_like(t)
    for start, end in windows:
        mask = (t >= start) & (t < end)
        amplitude[mask] = 0.3 * (0.7 + 0.3 * np.sin(2 * np.pi * 3.4 * t[mask]))
    rng = np.random.default_rng(9)
    signal = amplitude * (np.sin(2 * np.pi * 150 * t) + 0.4 * np.sin(2 * np.pi * 300 * t))
    signal += rng.normal(0, 0.0015, t.size)
    signal = np.clip(signal, -1, 1)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes((signal * 32767).astype(np.int16).tobytes())
    return windows


@pytest.fixture(scope="module")
def media(tmp_path_factory):
    folder = tmp_path_factory.mktemp("media")
    wav = folder / "voice.wav"
    windows = _noisy_speech(wav)
    clip = folder / "take.mp4"
    proc = subprocess.run([
        ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
        "-f", "lavfi", "-i", "testsrc2=size=480x270:rate=30:duration=9",
        "-i", str(wav), "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-shortest", str(clip),
    ], capture_output=True)
    assert proc.returncode == 0, proc.stderr.decode()[-800:]
    srt = folder / "captions.srt"
    srt.write_text(
        "1\n00:00:00,400 --> 00:00:02,200\nWe just landed and the light is unreal.\n\n"
        "2\n00:00:03,400 --> 00:00:05,400\nI want to show you this tiny street.\n\n"
        "3\n00:00:07,200 --> 00:00:08,400\nCome with me.\n",
        encoding="utf-8",
    )
    return {"clip": clip, "srt": srt, "windows": windows}


def test_full_social_build(tmp_path, media):
    store = ProjectStore(tmp_path / "projects")
    info = probe(media["clip"])
    source = {
        "id": "s1", "name": "take.mp4", "path": str(media["clip"]),
        "duration": info.duration, "width": info.width, "height": info.height,
        "fps": info.fps, "has_audio": True, "has_video": True, "size": info.size,
    }
    config = normalize_config({
        "mode": "social", "aspect": "9:16", "fps": "auto",
        "silence": {"enabled": True, "pacing": "balanced"},
        "captions": {"enabled": True, "source": "file", "delivery": "overlay_srt", "preset": "creator"},
        "transitions": {"enabled": True, "preset": "light_flash" if False else "flash", "frequency": 1, "duration": 0.4, "intensity": 0.7},
        "output": {"resolution": "720"},
    }, "social")
    project = store.create(config, [source], name="Integration cut", srt_path=str(media["srt"]))
    run_build(store, project["id"])
    saved = store.load(project["id"])
    assert saved["status"] == "done", saved.get("error")
    assert saved["progress"] == 100

    output = store.folder(project["id"]) / "output"
    otio = output / "timeline.otio"
    assert otio.exists()
    timeline = adapters.read_from_file(str(otio))
    program = [track for track in timeline.tracks if track.name.startswith("V1")][0]
    clips = [item for item in program if item.source_range]
    assert 2 <= len(clips) <= 4, "the silence pass should split this take"
    assert any(track.name.startswith("V3") for track in timeline.tracks), "captions should be a track"
    assert saved["summary"]["captions"] > 0
    assert (output / "captions.srt").exists()
    assert (output / "preview.jpg").exists()
    assert saved["summary"]["width"] == 720
    manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["app"] == "Cutline"
    assert manifest["timeline"]["fps"] == pytest.approx(30, abs=0.01)

    # Re-render captions only, then confirm the timeline still loads.
    captions = json.loads((store.folder(project["id"]) / "analysis" / "captions.json").read_text())
    edits = [
        {"start": cue["start"], "end": cue["end"], "text": cue["text"].upper()}
        for cue in captions["cues"]
    ]
    store.update(project["id"], status="queued", progress=0)
    run_recaption(store, project["id"], edits)
    saved = store.load(project["id"])
    assert saved["status"] == "done", saved.get("error")
    adapters.read_from_file(str(output / "timeline.otio"))
    rewritten = json.loads((store.folder(project["id"]) / "analysis" / "captions.json").read_text())
    assert all(cue["text"] == cue["text"].upper() for cue in rewritten["cues"])


def test_build_reports_missing_media(tmp_path):
    store = ProjectStore(tmp_path / "projects")
    config = normalize_config({"mode": "social"}, "social")
    project = store.create(config, [{
        "id": "s1", "name": "gone.mp4", "path": str(tmp_path / "gone.mp4"),
        "duration": 5.0, "width": 1920, "height": 1080, "fps": 30,
        "has_audio": True, "has_video": True,
    }], name="Offline")
    run_build(store, project["id"])
    saved = store.load(project["id"])
    assert saved["status"] == "failed"
    assert "offline" in (saved["error"] or "").lower()
