from __future__ import annotations

import io
import os
import subprocess
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

TEMP_DATA = tempfile.mkdtemp(prefix="cutline-api-")
os.environ["CUTLINE_DATA"] = TEMP_DATA

from cutline.app import app  # noqa: E402  (import after env is set)
from cutline.ffmpeg import ffmpeg_exe  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_and_config(client):
    health = client.get("/api/health").json()
    assert health["ok"] is True
    assert health["data"]["app"] == "Cutline"
    config = client.get("/api/config").json()["data"]
    assert {mode["id"] for mode in config["modes"]} == {"social", "vlog", "music"}
    assert len(config["styles"]) >= 5
    assert any(item["id"] == "custom" for item in config["transitions"])


def test_index_and_fonts(client):
    page = client.get("/")
    assert page.status_code == 200
    assert "Cutline" in page.text
    font = client.get("/fonts/Inter-Bold.ttf")
    assert font.status_code == 200
    assert font.headers["content-type"] == "font/ttf"
    assert client.get("/fonts/nope.ttf").status_code == 404


def test_caption_preview_is_an_image(client):
    response = client.post("/api/caption-preview", json={
        "preset": "creator", "aspect": "9:16", "text": "Test the caption", "style": {"size": 70},
    })
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    image = Image.open(io.BytesIO(response.content))
    assert image.width > 200


def test_transition_preview_is_animated(client):
    response = client.get("/api/transition-preview/light_leak?intensity=0.7&aspect=9:16")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/webp"
    assert len(response.content) > 1000


def test_transition_preview_unknown_preset_falls_back(client):
    response = client.get("/api/transition-preview/does-not-exist")
    assert response.status_code == 200


def test_upload_rejects_wrong_file_type(client):
    response = client.post(
        "/api/upload",
        files={"file": ("notes.pdf", b"%PDF-1.4", "application/pdf")},
        data={"kind": "video"},
    )
    assert response.status_code == 415
    assert response.json()["ok"] is False


def test_caption_upload_and_analyze(client):
    srt = b"1\n00:00:00,500 --> 00:00:02,000\nHello from the test.\n"
    upload = client.post(
        "/api/upload",
        files={"file": ("test.srt", srt, "text/plain")},
        data={"kind": "captions"},
    )
    assert upload.status_code == 200, upload.text
    payload = upload.json()["data"]
    assert payload["cues"] == 1
    assert payload["format"] == "srt"
    assert payload["sample"].startswith("Hello")

    folder = Path(tempfile.mkdtemp(prefix="cutline-clip-"))
    clip = folder / "clip.mp4"
    proc = subprocess.run([
        ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-y",
        "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=30:duration=3",
        "-f", "lavfi", "-i", "sine=frequency=220:duration=3",
        "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-shortest", str(clip),
    ], capture_output=True)
    assert proc.returncode == 0, proc.stderr.decode()[-500:]

    analyzed = client.post("/api/analyze", json={
        "pacing": "balanced",
        "sources": [{"id": "s1", "path": str(clip)}],
    })
    assert analyzed.status_code == 200
    result = analyzed.json()["data"]["sources"][0]
    assert result["duration"] == pytest.approx(3.0, abs=0.2)
    assert result["silence"]["segments"]
    assert result["wave"].startswith("data:image/png;base64,")

    inspected = client.post("/api/inspect", json={"paths": [str(clip)]})
    item = inspected.json()["data"]["items"][0]
    assert item["has_video"] and item["has_audio"]


def test_create_project_validation(client):
    response = client.post("/api/projects", json={"mode": "social", "sources": []})
    assert response.status_code == 400
    missing = client.post("/api/projects", json={
        "mode": "social",
        "sources": [{"path": "/does/not/exist.mp4"}],
    })
    assert missing.status_code == 400
    assert "offline" in missing.json()["error"].lower()


def test_unknown_project_returns_404(client):
    assert client.get("/api/projects/abcdef123456").status_code == 404
    assert client.get("/api/projects/../../etc").status_code in (400, 404)
