from __future__ import annotations

import io
import shutil
import threading
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from PIL import Image

from . import __version__
from .beats import detect_beats
from .captioning import cues_to_public
from .captions import draw_gradient_background, preview_title, render_caption_frame
from .demo import ensure_demo
from .config import (
    MODES,
    SILENCE_PACING,
    TRANSITION_PRESETS,
    mode_defaults,
    normalize_config,
)
from .ffmpeg import (
    decode_pcm,
    extract_frame,
    ffmpeg_version,
    probe,
    thumbnail,
    waveform_image,
)
from .kit import build_kit
from .pipeline import run_build, run_recaption
from .settings import (
    ALLOWED_AUDIO,
    ALLOWED_CAPTION,
    ALLOWED_OVERLAY,
    ALLOWED_VIDEO,
    ASPECTS,
    DATA_DIR,
    FONTS_DIR,
    FPS_CHOICES,
    PROJECTS_DIR,
    STATIC_DIR,
    ensure_dirs,
)
from .silence import analyze_silence
from .store import ProjectStore, new_id, safe_filename
from .styles import FONT_LIBRARY, get_presets, normalize_style
from .subtitles import parse_subtitle_file
from .transcribe import capabilities as asr_capabilities
from .transitions import transition_frames

ensure_dirs()


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_dirs()
    store.mark_interrupted()
    yield


app = FastAPI(title="Cutline", version=__version__, docs_url=None, redoc_url=None, lifespan=lifespan)
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


@app.middleware("http")
async def add_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        return Response(status_code=204, headers=CORS)
    response = await call_next(request)
    for key, value in CORS.items():
        response.headers.setdefault(key, value)
    response.headers.setdefault("X-Frame-Options", "ALLOWALL")
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    # Never let a stale UI fight a newer backend.
    if request.url.path in ("/", "/static/index.html"):
        response.headers["Cache-Control"] = "no-store"
    return response


store = ProjectStore(PROJECTS_DIR)
UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
EXECUTOR = ThreadPoolExecutor(max_workers=2, thread_name_prefix="cutline-job")
_JOBS: dict[str, str] = {}
_JOB_LOCK = threading.Lock()


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    page = STATIC_DIR / "index.html"
    if not page.exists():
        return HTMLResponse("<h1>Cutline</h1><p>The interface file is missing.</p>", status_code=500)
    return HTMLResponse(page.read_text(encoding="utf-8"))


@app.get("/fonts/{name}")
def font(name: str):
    if "/" in name or ".." in name:
        raise HTTPException(404)
    path = FONTS_DIR / name
    if not path.exists():
        raise HTTPException(404)
    return FileResponse(path, media_type="font/ttf", headers={"Cache-Control": "public, max-age=31536000"})


def _ok(data: Any) -> JSONResponse:
    return JSONResponse({"ok": True, "data": data})


def _fail(message: str, status: int = 400) -> JSONResponse:
    return JSONResponse({"ok": False, "error": message}, status_code=status)


@app.get("/api/health")
def health() -> JSONResponse:
    return _ok({
        "app": "Cutline",
        "version": __version__,
        "resolve_ready": True,
        "ffmpeg": ffmpeg_version(),
        "asr": asr_capabilities(),
        "data_dir": str(DATA_DIR),
        "projects": len(store.list()),
    })


@app.get("/api/config")
def config() -> JSONResponse:
    return _ok({
        "version": __version__,
        "modes": [
            {
                "id": key,
                "label": value["label"],
                "eyebrow": value["eyebrow"],
                "description": value["description"],
                "defaults": value["defaults"],
            }
            for key, value in MODES.items()
        ],
        "styles": get_presets(),
        "transitions": [{"id": key, **value} for key, value in TRANSITION_PRESETS.items()],
        "pacing": [{"id": key, **value} for key, value in SILENCE_PACING.items()],
        "aspects": [{"id": key, "width": value[0], "height": value[1]} for key, value in ASPECTS.items()],
        "fps": list(FPS_CHOICES),
        "fonts": [
            {"id": key, "label": value["label"], "css": value["css"], "weights": sorted(value["weights"])}
            for key, value in FONT_LIBRARY.items()
        ],
        "defaults": {mode: mode_defaults(mode) for mode in MODES},
    })


# ---------------------------------------------------------------------------
# Media inspection and uploads
# ---------------------------------------------------------------------------

def _save_upload(upload: UploadFile, allowed: set[str], kind: str) -> dict:
    suffix = Path(upload.filename or "").suffix.lower()
    if suffix not in allowed:
        raise HTTPException(415, f"That file type is not supported for {kind}. Allowed: {', '.join(sorted(allowed))}")
    upload_id = new_id()
    filename = safe_filename(upload.filename or f"upload{suffix}", kind)
    folder = UPLOADS_DIR / upload_id
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / filename
    size = 0
    with target.open("wb") as handle:
        while chunk := upload.file.read(1024 * 1024 * 4):
            handle.write(chunk)
            size += len(chunk)
    if size == 0:
        target.unlink(missing_ok=True)
        raise HTTPException(400, "That file is empty.")
    return {"id": upload_id, "path": str(target), "name": filename, "size": size, "kind": kind}


def _probe_upload(saved: dict, kind: str) -> dict:
    folder = Path(saved["path"]).parent
    data: dict[str, Any] = {
        "id": saved["id"], "name": saved["name"], "size": saved["size"],
        "kind": kind, "path": saved["path"],
    }
    if kind in ("video", "audio"):
        try:
            info = probe(saved["path"])
        except Exception as exc:
            raise HTTPException(422, f"That file could not be read: {exc}")
        data.update({
            "duration": info.duration, "width": info.width, "height": info.height,
            "fps": info.fps, "has_audio": info.has_audio, "has_video": info.has_video,
            "codec": info.video_codec or info.audio_codec,
        })
        if kind == "video" and info.has_video:
            at = min(max(0.2, info.duration * 0.25), 6.0)
            thumb = folder / "thumb.jpg"
            thumbnail(saved["path"], thumb, at, (480, 320))
            data["thumb"] = f"/api/upload/{saved['id']}/thumb.jpg"
        if info.has_audio:
            wave_png = folder / "wave.png"
            try:
                samples = decode_pcm(saved["path"], 16000)[: 16000 * 60 * 30]
                waveform_image(samples).save(wave_png)
                data["wave"] = f"/api/upload/{saved['id']}/wave.png"
            except Exception:
                data["wave"] = None
    if kind == "captions":
        try:
            parsed = parse_subtitle_file(saved["path"])
            data.update({
                "cues": len(parsed["cues"]), "format": parsed["format"],
                "sample": parsed["cues"][0]["text"][:90] if parsed["cues"] else None,
            })
        except Exception as exc:
            shutil.rmtree(folder, ignore_errors=True)
            raise HTTPException(422, str(exc))
    if kind == "overlay":
        try:
            info = probe(saved["path"])
            data.update({
                "duration": info.duration, "width": info.width, "height": info.height,
                "has_audio": info.has_audio, "codec": info.video_codec,
            })
        except Exception:
            pass
    return data


@app.post("/api/upload")
def upload(file: UploadFile = File(...), kind: str = Form("video")) -> JSONResponse:
    allowed = {
        "video": ALLOWED_VIDEO, "audio": ALLOWED_AUDIO,
        "captions": ALLOWED_CAPTION, "overlay": ALLOWED_OVERLAY,
    }.get(kind, ALLOWED_VIDEO)
    try:
        saved = _save_upload(file, allowed, kind)
        return _ok(_probe_upload(saved, kind))
    except HTTPException as exc:
        return _fail(str(exc.detail), exc.status_code)
    except Exception as exc:
        return _fail(f"The upload failed: {exc}", 422)


@app.get("/api/upload/{upload_id}/{name}")
def upload_asset(upload_id: str, name: str):
    if not upload_id.isalnum() or "/" in name or ".." in name:
        raise HTTPException(404)
    path = UPLOADS_DIR / upload_id / name
    if not path.exists():
        raise HTTPException(404)
    media = "image/png" if path.suffix == ".png" else "image/jpeg"
    return FileResponse(path, media_type=media, headers={"Cache-Control": "public, max-age=86400"})


@app.post("/api/inspect")
async def inspect_paths(request: Request):
    """Probe media that already lives on this machine (desktop/no-upload flow)."""
    body = await request.json()
    paths = body.get("paths") or []
    results = []
    for raw in paths[:80]:
        path = Path(str(raw)).expanduser()
        if not path.exists():
            results.append({"path": str(path), "error": "That file is offline."})
            continue
        try:
            info = probe(path)
            results.append({
                "path": str(path.resolve()), "name": path.name, "duration": info.duration,
                "width": info.width, "height": info.height, "fps": info.fps,
                "has_audio": info.has_audio, "has_video": info.has_video,
                "size": info.size, "codec": info.video_codec or info.audio_codec,
            })
        except Exception as exc:
            results.append({"path": str(path), "error": str(exc)[:200]})
    return _ok({"items": results})


@app.post("/api/demo")
async def demo_media(request: Request):
    try:
        body = await request.json() if await request.body() else {}
    except Exception:
        body = {}
    try:
        demo = ensure_demo(force=bool(body.get("force")))
    except Exception as exc:
        return _fail(f"The demo footage could not be generated: {exc}", 500)
    return _ok(demo)


@app.post("/api/sources/scan")
async def scan_folder(request: Request):
    body = await request.json()
    folder = Path(str(body.get("path") or "")).expanduser()
    if not folder.is_dir():
        return _fail("That folder could not be opened on this machine.", 404)
    items = []
    for path in sorted(folder.iterdir()):
        if not path.is_file() or path.name.startswith("."):
            continue
        suffix = path.suffix.lower()
        if suffix in ALLOWED_VIDEO | ALLOWED_AUDIO | ALLOWED_CAPTION:
            kind = "video" if suffix in ALLOWED_VIDEO else ("audio" if suffix in ALLOWED_AUDIO else "captions")
            items.append({"name": path.name, "path": str(path.resolve()), "size": path.stat().st_size, "kind": kind})
        if len(items) >= 200:
            break
    return _ok({"folder": str(folder), "items": items})


# ---------------------------------------------------------------------------
# Analysis and previews
# ---------------------------------------------------------------------------

def _wave_data(png_bytes: bytes) -> str:
    import base64

    return "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")


@app.post("/api/analyze")
async def analyze_sources(request: Request):
    body = await request.json()
    sources = body.get("sources") or []
    pacing = body.get("pacing", "balanced")
    results = []
    for item in sources[:16]:
        path = item.get("path")
        if not path or not Path(path).exists():
            results.append({"id": item.get("id"), "error": "Media is offline."})
            continue
        try:
            info = probe(path)
            samples = decode_pcm(path, 16000)
            silence = analyze_silence(
                samples, 16000, info.duration, pacing=pacing,
                threshold_db=item.get("threshold_db"),
                min_silence=item.get("min_silence"),
                padding=item.get("padding"),
            )
            wave = waveform_image(samples[: 16000 * 60 * 30], 1200, 120)
            buffer = io.BytesIO()
            wave.save(buffer, format="PNG")
            results.append({"id": item.get("id"), "duration": info.duration, "silence": silence, "wave": _wave_data(buffer.getvalue())})
        except Exception as exc:
            results.append({"id": item.get("id"), "error": str(exc)[:200]})
    return _ok({"sources": results})


@app.post("/api/beats")
async def beats_endpoint(request: Request):
    body = await request.json()
    path = body.get("path")
    if not path or not Path(path).exists():
        return _fail("That audio file is offline. Re-upload it and try again.", 404)
    try:
        info = probe(path)
        samples = decode_pcm(path, 22050)
        result = detect_beats(samples, 22050, info.duration, hint_bpm=body.get("bpm"))
        wave = waveform_image(samples[: 22050 * 60 * 20], 1600, 140, color="#FF8B5E")
        buffer = io.BytesIO()
        wave.save(buffer, format="PNG")
        result["wave"] = _wave_data(buffer.getvalue())
        result["duration"] = info.duration
        return _ok(result)
    except Exception as exc:
        return _fail(f"Beat analysis failed: {exc}", 422)


@app.post("/api/caption-preview")
async def caption_preview(request: Request):
    body = await request.json()
    style = normalize_style(body.get("style") or {}, body.get("preset"))
    aspect = body.get("aspect", "9:16")
    width, height = ASPECTS.get(aspect, ASPECTS["9:16"])
    small_w = 620
    small_h = int(small_w * height / width)
    text = str(body.get("text") or "Your words, cut to fit")[:180]
    background = None
    background_path = body.get("background")
    if background_path and Path(background_path).exists():
        try:
            background = extract_frame(background_path, float(body.get("background_time") or 0.6), (small_w, small_h))
        except Exception:
            background = None
    if background is None:
        background = draw_gradient_background(small_w, small_h, seed=str(body.get("seed") or "cutline"))
    words = text.split()
    span = min(3.0, max(1.1, len(words) * 0.44))
    total = max(1, sum(len(word) for word in words))
    cursor = 0.0
    cue_words = []
    for word in words:
        length = span * len(word) / total
        cue_words.append({"word": word, "start": cursor, "end": cursor + length})
        cursor += length
    cue = {"start": 0.0, "end": span, "text": text, "words": cue_words}
    at = body.get("at")
    t = float(at) if at is not None else span * 0.55
    layer = render_caption_frame(cue, style, small_w, small_h, t)
    image = Image.alpha_composite(background.convert("RGBA"), layer)
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=88)
    return Response(buffer.getvalue(), media_type="image/jpeg", headers={"Cache-Control": "no-store"})


@app.get("/api/preview/sample")
def sample_scene(aspect: str = "9:16", seed: str = "cutline"):
    width, height = ASPECTS.get(aspect, ASPECTS["9:16"])
    small_w = 620
    small_h = int(small_w * height / width)
    image = draw_gradient_background(small_w, small_h, seed=seed)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=88)
    return Response(buffer.getvalue(), media_type="image/jpeg", headers={"Cache-Control": "public, max-age=3600"})


@app.get("/api/preview/title")
def title_preview(width: int = 960, height: int = 540):
    width = max(320, min(1600, width))
    height = max(180, min(1200, height))
    image = preview_title(width, height)
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=88)
    return Response(buffer.getvalue(), media_type="image/jpeg", headers={"Cache-Control": "public, max-age=3600"})


_TRANSITION_CACHE: dict[str, bytes] = {}


@app.get("/api/transition-preview/{preset}")
def transition_preview(preset: str, intensity: float = 0.75, aspect: str = "16:9", frames: int = 12):
    if aspect == "9:16":
        width, height = 270, 480
    elif aspect == "1:1":
        width, height = 360, 360
    else:
        width, height = 480, 270
    intensity = max(0.05, min(1.0, intensity))
    frames = max(6, min(18, frames))
    key = f"{preset}:{intensity:.2f}:{aspect}:{frames}"
    if key in _TRANSITION_CACHE:
        return Response(_TRANSITION_CACHE[key], media_type="image/webp", headers={"Cache-Control": "public, max-age=86400"})
    scene = draw_gradient_background(width, height, seed=f"transition-{preset}").convert("RGBA")
    images = [
        Image.alpha_composite(scene, frame).convert("RGB")
        for frame in transition_frames(preset if preset in TRANSITION_PRESETS else "light_leak", width, height, 24, frames, intensity)
    ]
    buffer = io.BytesIO()
    images[0].save(buffer, format="WEBP", save_all=True, append_images=images[1:], duration=70, loop=0, quality=74)
    payload = buffer.getvalue()
    if len(_TRANSITION_CACHE) > 60:
        _TRANSITION_CACHE.clear()
    _TRANSITION_CACHE[key] = payload
    return Response(payload, media_type="image/webp", headers={"Cache-Control": "public, max-age=86400"})


@app.get("/api/title-preview.png")
def title_png(aspect: str = "16:9"):
    width, height = (960, 540) if aspect != "9:16" else (540, 960)
    image = preview_title(width, height)
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=88)
    return Response(buffer.getvalue(), media_type="image/jpeg", headers={"Cache-Control": "public, max-age=3600"})


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

def _launch(project_id: str, fn, *args) -> bool:
    with _JOB_LOCK:
        if _JOBS.get(project_id):
            return False
        _JOBS[project_id] = "running"

    def runner():
        try:
            fn(store, project_id, *args)
        finally:
            with _JOB_LOCK:
                _JOBS.pop(project_id, None)

    EXECUTOR.submit(runner)
    return True


def _sources_from_payload(raw_sources: Any) -> list[dict]:
    if not isinstance(raw_sources, list) or not raw_sources:
        raise HTTPException(400, "Add at least one video clip first.")
    sources = []
    for index, item in enumerate(raw_sources):
        if not isinstance(item, dict):
            continue
        path = str(item.get("path") or "").strip()
        if not path:
            continue
        resolved = Path(path).expanduser()
        if not resolved.exists():
            raise HTTPException(400, f"Media is offline: {item.get('name') or resolved.name}")
        try:
            info = probe(resolved)
        except Exception as exc:
            raise HTTPException(422, f"Could not read {resolved.name}: {exc}")
        sources.append({
            "id": f"src{index + 1:02d}{new_id()[:4]}",
            "path": str(resolved.resolve()),
            "name": str(item.get("name") or resolved.name),
            "duration": info.duration,
            "width": info.width,
            "height": info.height,
            "fps": info.fps,
            "has_audio": info.has_audio,
            "has_video": info.has_video,
            "size": info.size,
            "codec": info.video_codec or info.audio_codec,
        })
    if not sources:
        raise HTTPException(400, "Add at least one readable video clip.")
    return sources


@app.post("/api/projects")
async def create_project(request: Request):
    body = await request.json()
    mode = body.get("mode", "social")
    try:
        config = normalize_config(body.get("config") or {}, mode)
        config["mode"] = mode if mode in MODES else config["mode"]
        sources = _sources_from_payload(body.get("sources"))
    except HTTPException as exc:
        return _fail(str(exc.detail), exc.status_code)

    srt_path = body.get("srt_path")
    music_path = body.get("music_path")
    custom_transition_path = body.get("custom_transition_path")
    for label, path in (("caption file", srt_path), ("music file", music_path), ("transition overlay", custom_transition_path)):
        if path and not Path(path).exists():
            return _fail(f"The {label} went offline. Re-upload it and try again.", 422)
    if config["captions"].get("source") == "file" and not srt_path:
        return _fail("Add a caption file, or switch captions to Automatic or Off.", 422)
    if config["transitions"].get("preset") == "custom" and not custom_transition_path:
        return _fail("Upload an overlay movie for the custom transition, or pick a built-in one.", 422)
    if mode == "music" and not (music_path or any(source.get("has_audio") for source in sources)):
        return _fail("Music mode needs a song. Add an audio file (or a clip with audio).", 422)

    if not (body.get("name") or config.get("name")):
        stem = Path(sources[0]["name"]).stem.replace("_", " ").replace("-", " ").strip()
        config["name"] = (stem.title() or "Untitled cut")[:90]
    project = store.create(
        config, sources,
        name=body.get("name") or config.get("name") or None,
        srt_path=srt_path, music_path=music_path, custom_transition_path=custom_transition_path,
    )
    _launch(project["id"], run_build)
    return _ok({"id": project["id"]})


@app.get("/api/projects")
def list_projects() -> JSONResponse:
    items = store.list()
    with _JOB_LOCK:
        running = set(_JOBS.keys())
    for item in items:
        if item["id"] in running:
            item["status"] = "running"
            item["running"] = True
        else:
            item["running"] = False
    return _ok(items)


def _project_payload(project_id: str) -> dict:
    project = store.load(project_id)
    folder = store.folder(project_id)
    plan = store.read_json(project_id, "plan.json", "analysis")
    captions = store.read_json(project_id, "captions.json", "analysis", {}) or {}
    analysis = store.read_json(project_id, "silence.json", "analysis", {}) or {}
    payload = {
        **project,
        "plan": plan,
        "captions": {
            "style": captions.get("style"),
            "preset": captions.get("preset"),
            "source": captions.get("source"),
            "cues": cues_to_public(captions.get("cues", [])),
        },
        "silence": analysis,
        "running": bool(_JOBS.get(project_id)),
        "paths": {
            "otio": str(folder / "output" / "timeline.otio"),
            "srt": str(folder / "output" / "captions.srt"),
            "manifest": str(folder / "output" / "manifest.json"),
            "notes": str(folder / "output" / "cut_notes.md"),
            "folder": str(folder / "output"),
        },
    }
    payload.pop("srt_path", None)
    payload.pop("music_path", None)
    payload.pop("custom_transition_path", None)
    for source in payload.get("sources", []):
        pass
    return payload


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    try:
        return _ok(_project_payload(project_id))
    except FileNotFoundError:
        return _fail("Project not found.", 404)
    except ValueError:
        return _fail("Invalid project id.", 400)


@app.post("/api/projects/{project_id}/rebuild")
def rebuild(project_id: str):
    try:
        store.load(project_id)
    except Exception:
        return _fail("Project not found.", 404)
    with _JOB_LOCK:
        if _JOBS.get(project_id):
            return _fail("This project is already building.", 409)
    store.update(project_id, status="queued", stage="Queued", progress=0, message="Rebuilding…", error=None)
    _launch(project_id, run_build)
    return _ok({"id": project_id})


@app.post("/api/projects/{project_id}/recaption")
async def recaption(project_id: str, request: Request):
    body = await request.json()
    edits = body.get("cues")
    if not isinstance(edits, list):
        return _fail("Send the caption cues to apply.", 400)
    if len(edits) > 600:
        return _fail("That is more than 600 captions. Split the edit into parts.", 400)
    try:
        store.load(project_id)
    except Exception:
        return _fail("Project not found.", 404)
    with _JOB_LOCK:
        if _JOBS.get(project_id):
            return _fail("This project is still building.", 409)
    store.update(project_id, status="queued", stage="Queued", progress=0, message="Updating captions…", error=None)
    _launch(project_id, run_recaption, edits)
    return _ok({"id": project_id})


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    try:
        store.load(project_id)
    except Exception:
        return _fail("Project not found.", 404)
    with _JOB_LOCK:
        if _JOBS.get(project_id):
            return _fail("This project is still building. Wait for it to finish.", 409)
    store.delete(project_id)
    return _ok({"id": project_id})


@app.get("/api/projects/{project_id}/asset/{name}")
def project_asset(project_id: str, name: str, download: bool = False):
    try:
        folder = store.folder(project_id)
    except ValueError:
        raise HTTPException(400)
    if "/" in name or ".." in name:
        raise HTTPException(404)
    candidate = folder / "output" / name
    if not candidate.exists():
        candidate = folder / name
    try:
        inside = str(candidate.resolve()).startswith(str(folder.resolve()))
    except Exception:
        inside = False
    if not candidate.exists() or not inside:
        raise HTTPException(404)
    media_types = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".otio": "application/json", ".srt": "text/plain; charset=utf-8",
        ".vtt": "text/vtt; charset=utf-8", ".md": "text/markdown; charset=utf-8",
        ".json": "application/json", ".txt": "text/plain; charset=utf-8",
        ".mov": "video/quicktime", ".mp4": "video/mp4",
    }
    headers = {}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="cutline-{safe_filename(candidate.name)}"'
    return FileResponse(candidate, media_type=media_types.get(candidate.suffix.lower(), "application/octet-stream"), headers=headers)


@app.get("/api/projects/{project_id}/kit")
def project_kit(project_id: str):
    try:
        store.load(project_id)
    except Exception:
        raise HTTPException(404)
    try:
        result = build_kit(store, project_id)
    except FileNotFoundError as exc:
        return _fail(str(exc), 404)
    except Exception as exc:
        return _fail(f"The test kit could not be built: {str(exc)[:300]}", 500)
    project_name = store.load(project_id).get("name") or "cutline"
    if "test kit" in project_name.lower():
        name = safe_filename(project_name) + ".zip"
    else:
        name = safe_filename(f"{project_name} test kit") + ".zip"
    return FileResponse(
        result.zip_path,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )


@app.get("/api/projects/{project_id}/manifest")
def manifest(project_id: str):
    data = store.read_json(project_id, "manifest.json", "output")
    if not data:
        return _fail("No manifest yet.", 404)
    return _ok(data)
