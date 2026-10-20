from __future__ import annotations

import json
import shutil
import time
import traceback
import wave
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image

from . import __version__
from .beats import detect_beats
from .captioning import (
    apply_edits,
    build_cues,
    tokens_from_source_cues,
    tokens_from_timeline_cues,
    tokens_from_transcripts,
)
from .captions import caption_frames, render_caption_frame, title_frames
from .collage import render_collage_movie
from .config import MODES, TRANSITION_PRESETS, normalize_fps, output_dimensions
from .ffmpeg import (
    decode_pcm,
    encode_overlay_frames,
    encode_still_overlay,
    extract_audio,
    extract_frame,
    probe,
    waveform_image,
)
from .hud import render_hud
from .planner import EditPlan, build_edit_plan
from .silence import analyze_silence, silent_full_track
from .store import ProjectStore
from .styles import get_preset
from .subtitles import parse_subtitle_file, transcript_text, write_srt, write_vtt
from .timeline import build_timeline, write_otio
from .transcribe import TranscriptionUnavailable, transcribe_audio
from .transition_render import render_custom_overlay, render_transition_clip


class PipelineError(RuntimeError):
    pass


class Progress:
    def __init__(self, store: ProjectStore, project_id: str):
        self.store = store
        self.project_id = project_id
        self.last = -1
        self.last_write = 0.0

    def __call__(self, percent: float, message: str, stage: str | None = None) -> None:
        percent = max(0, min(100, float(percent)))
        if percent < self.last:
            percent = self.last
        self.last = percent
        now = time.monotonic()
        if now - self.last_write < 0.35 and percent < 100:
            return
        self.last_write = now
        changes = {
            "progress": round(percent, 1),
            "message": message,
        }
        if stage:
            changes["stage"] = stage
        try:
            self.store.update(self.project_id, **changes)
        except Exception:
            pass


def _read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as handle:
        sample_rate = handle.getframerate()
        frames = handle.getnframes()
        data = handle.readframes(frames)
        channels = handle.getnchannels()
        width = handle.getsampwidth()
    if width == 2:
        audio = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
    elif width == 1:
        audio = (np.frombuffer(data, dtype=np.uint8).astype(np.float32) - 128) / 128.0
    elif width == 4:
        audio = np.frombuffer(data, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        audio = np.zeros(0, dtype=np.float32)
    if channels > 1:
        audio = audio.reshape(-1, channels).mean(axis=1)
    return audio, sample_rate


def _resolve_fps(config: dict, sources: list[dict]) -> float:
    if config.get("fps") != "auto":
        return normalize_fps(config.get("fps"), 30)
    for source in sources:
        fps = normalize_fps(source.get("fps"), 0)
        if 12 <= fps <= 60:
            return fps
    return 30.0


def _source_stub(path: str, name: str | None = None) -> dict:
    info = probe(path)
    return {
        "path": str(Path(path).expanduser().resolve()),
        "name": name or Path(path).name,
        "duration": info.duration,
        "width": info.width,
        "height": info.height,
        "fps": info.fps,
        "has_audio": info.has_audio,
        "has_video": info.has_video,
        "size": info.size,
        "codec": info.video_codec or info.audio_codec,
    }


def run_build(store: ProjectStore, project_id: str) -> None:
    progress = Progress(store, project_id)
    project = store.load(project_id)
    folder = store.folder(project_id)
    analysis_dir = folder / "analysis"
    output_dir = folder / "output"
    work_dir = folder / "work"
    analysis_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    work_dir.mkdir(parents=True, exist_ok=True)

    try:
        config = project["config"]
        sources = project.get("sources") or []
        if not sources:
            raise PipelineError("No footage was added to this project.")
        for source in sources:
            if not Path(source["path"]).exists():
                raise PipelineError(
                    f"Source media is offline: {source['name']}. Reconnect the drive and build again."
                )
        fps = _resolve_fps(config, sources)
        width, height = output_dimensions(config)
        progress(2, "Checking the footage…", "Ingest")
        store.update(project_id, fps=fps, width=width, height=height, status="running", stage="Ingest")
        progress(4, "Rolling…", "Silence map")

        # ---- Audio analysis ---------------------------------------------------
        progress(5, "Listening for the gaps…", "Silence map")
        analyses: dict[str, dict] = {}
        waveform_samples = None
        for index, source in enumerate(sources):
            source_id = source["id"]
            start_pct = 6 + (index / max(1, len(sources))) * 17
            progress(start_pct, f"Mapping silence in {source['name']}…", "Silence map")
            duration = float(source["duration"])
            audio_path = analysis_dir / f"{source_id}.wav"
            audio = None
            if source.get("has_audio") and duration > 0.1:
                try:
                    extract_audio(source["path"], audio_path, 16000)
                    audio, _ = _read_wav(audio_path)
                except Exception as exc:
                    source["has_audio"] = False
                    analyses[source_id] = silent_full_track(duration)
                    analyses[source_id]["warning"] = f"Audio could not be read: {str(exc)[:140]}"
            if audio is not None and len(audio):
                if waveform_samples is None:
                    waveform_samples = audio
                if config["silence"].get("enabled"):
                    try:
                        result = analyze_silence(
                            audio, 16000, duration,
                            pacing=config["silence"].get("pacing", "balanced"),
                            threshold_db=config["silence"].get("threshold_db"),
                            min_silence=config["silence"].get("min_silence"),
                            padding=config["silence"].get("padding"),
                            min_keep=max(0.16, 1.4 / fps),
                        )
                    except Exception as exc:
                        result = silent_full_track(duration)
                        result["warning"] = f"Silence detection failed: {str(exc)[:140]}"
                else:
                    result = silent_full_track(duration)
            else:
                result = silent_full_track(duration)
            result["source_id"] = source_id
            result["source_name"] = source["name"]
            analyses[source_id] = result
        (analysis_dir / "silence.json").write_text(json.dumps(analyses, indent=2), encoding="utf-8")

        # ---- Speech to text ---------------------------------------------------
        transcripts: dict[str, dict] = {}
        caption_warnings: list[str] = []
        captions_cfg = config["captions"]
        caption_file_path = project.get("srt_path")
        progress(24, "Preparing captions…", "Captions")
        if captions_cfg.get("enabled") and captions_cfg.get("source") == "auto":
            if project["mode"] == "music":
                audio_source = project.get("music_path") or next(
                    (s["path"] for s in sources if s.get("has_audio")), None
                )
                if audio_source:
                    try:
                        audio_path = analysis_dir / "music.wav"
                        extract_audio(audio_source, audio_path, 16000)
                        def music_progress(frac: float, msg: str) -> None:
                            progress(24 + frac * 13, msg, "Captions")
                        info = probe(audio_source)
                        transcripts["__music__"] = transcribe_audio(
                            audio_path, info.duration,
                            language=captions_cfg.get("language", "auto"),
                            quality=captions_cfg.get("quality", "balanced"),
                            progress=music_progress,
                        )
                    except (TranscriptionUnavailable, Exception) as exc:
                        caption_warnings.append(str(exc)[:300])
                else:
                    caption_warnings.append("No audio was available for automatic lyrics.")
            else:
                transcribed_duration = 0.0
                total_audio_duration = sum(float(s["duration"]) for s in sources if s.get("has_audio")) or 1.0
                for index, source in enumerate(sources):
                    if not source.get("has_audio"):
                        continue
                    audio_path = analysis_dir / f"{source['id']}.wav"
                    if not audio_path.exists():
                        continue
                    def make_cb(offset: float, span: float, source_name: str):
                        def inner(frac: float, msg: str) -> None:
                            progress(24 + (offset + frac * span) * 13, f"{source_name}: {msg}", "Captions")
                        return inner
                    span = float(source["duration"]) / total_audio_duration
                    try:
                        data = transcribe_audio(
                            audio_path,
                            float(source["duration"]),
                            language=captions_cfg.get("language", "auto"),
                            quality=captions_cfg.get("quality", "balanced"),
                            progress=make_cb(transcribed_duration, span, source["name"]),
                        )
                        transcripts[source["id"]] = data
                    except TranscriptionUnavailable as exc:
                        caption_warnings.append(str(exc)[:300])
                        break
                    except Exception as exc:
                        caption_warnings.append(f"Captions for {source['name']}: {str(exc)[:240]}")
                    transcribed_duration += float(source["duration"])
                else:
                    pass
        if transcripts:
            (analysis_dir / "transcripts.json").write_text(json.dumps(transcripts, indent=2), encoding="utf-8")

        # ---- Beat grid / plan ------------------------------------------------
        beat = None
        music_path = project.get("music_path")
        music_duration = None
        if project["mode"] == "music":
            progress(34, "Finding the tempo…", "Beat grid")
            audio_source = music_path
            if not audio_source:
                audio_source = next((s["path"] for s in sources if s.get("has_audio")), None)
            if not audio_source:
                raise PipelineError(
                    "A music video needs a song. Add the music file (or a clip with audio) and build again."
                )
            if music_path:
                music_info = probe(music_path)
                music_duration = music_info.duration
            else:
                music_duration = next((float(s["duration"]) for s in sources if s.get("path") == audio_source), None)
            samples = decode_pcm(audio_source, 22050)
            beat = detect_beats(
                samples, 22050, float(music_duration or len(samples) / 22050),
                hint_bpm=config["music"].get("bpm"),
            )
            beat["audio_source"] = audio_source
            if waveform_samples is None:
                waveform_samples = samples

        progress(38, "Building the first cut…", "Assembly")
        plan = build_edit_plan(
            config, sources, analyses, fps,
            beat=beat, music_path=music_path, music_duration=music_duration,
            seed=project_id,
        )
        plan.stats.update({
            "fps": fps, "width": width, "height": height,
            "source_count": len(sources),
            "mode_label": MODES.get(project["mode"], {}).get("label", project["mode"]),
        })
        (analysis_dir / "plan.json").write_text(json.dumps(plan.to_dict(), indent=2), encoding="utf-8")
        store.write_json(project_id, "plan.json", plan.to_dict())

        # ---- Caption cues ----------------------------------------------------
        style = config["captions"].get("style") or get_preset("creator")
        style_preset = config["captions"].get("preset", "creator")
        cues: list[dict] = []
        tokens: list[dict] = []
        caption_source_label = "Off"
        if config["captions"].get("enabled"):
            if captions_cfg.get("source") == "file":
                if not caption_file_path or not Path(caption_file_path).exists():
                    caption_warnings.append("No caption file was provided.")
                else:
                    parsed = parse_subtitle_file(caption_file_path)
                    if project["mode"] == "music" or captions_cfg.get("timing") == "timeline":
                        tokens = tokens_from_timeline_cues(parsed["cues"])
                        caption_source_label = f"File · {parsed['format'].upper()}"
                    else:
                        if len(sources) == 1:
                            tokens = tokens_from_source_cues(parsed["cues"], plan, sources[0]["id"])
                            caption_source_label = f"File · {parsed['format'].upper()} · source timing"
                        else:
                            tokens = tokens_from_timeline_cues(parsed["cues"])
                            caption_source_label = f"File · {parsed['format'].upper()} · timeline timing"
                            caption_warnings.append(
                                "The caption file was timed on the finished timeline. If it drifts after silence cuts, "
                                "re-export it against the source clip or use automatic captions."
                            )
            elif captions_cfg.get("source") == "auto":
                if project["mode"] == "music":
                    data = transcripts.get("__music__")
                    if data:
                        cue_rows = []
                        for segment_index, segment in enumerate(data.get("segments", [])):
                            words = segment.get("words") or []
                            if words:
                                cue_rows.append({
                                    "start": words[0]["start"], "end": words[-1]["end"],
                                    "text": " ".join(word["word"] for word in words),
                                    "words": words,
                                })
                        tokens = tokens_from_timeline_cues(cue_rows)
                        caption_source_label = f"Auto · {data.get('model', 'Whisper')}"
                else:
                    tokens = tokens_from_transcripts(transcripts, plan)
                    if tokens:
                        model = next(iter(transcripts.values())).get("model", "Whisper")
                        caption_source_label = f"Auto · {model}"
            if tokens:
                cues = build_cues(tokens, style, plan)
                if not cues:
                    caption_warnings.append("Captions were generated but no phrases survived the style limits.")
            elif not caption_warnings:
                caption_warnings.append("No captions were generated. Add an SRT or enable automatic captions.")

        # ---- Overlay renders -------------------------------------------------
        cover_frame = 0.0
        if plan.clips:
            first = plan.clips[0]
            cover_frame = (first.src_in / fps) + min(1.0, plan.duration * 0.08)

        assets = {"captions": [], "transitions": [], "titles": [], "graphics": [], "preview": None}
        caption_dir = output_dir / "media" / "captions"
        transition_dir = output_dir / "media" / "transitions"
        title_dir = output_dir / "media" / "titles"
        graphics_dir = output_dir / "media" / "graphics"
        for directory in (caption_dir, transition_dir, title_dir, graphics_dir):
            directory.mkdir(parents=True, exist_ok=True)
        for directory in (caption_dir, transition_dir, title_dir, graphics_dir):
            for old in directory.glob("*.mov"):
                old.unlink(missing_ok=True)
            for old in directory.glob("*.mp4"):
                old.unlink(missing_ok=True)

        if cues and config["captions"].get("delivery") in ("overlay", "overlay_srt"):
            progress(46, "Setting the captions in motion…", "Captions")
            for index, cue in enumerate(cues):
                start_frame = max(0, int(round(cue["start"] * fps)))
                end_frame = max(start_frame + 1, int(round(cue["end"] * fps)))
                end_frame = min(end_frame, plan.duration_frames)
                if end_frame <= start_frame:
                    continue
                path = caption_dir / f"caption_{index + 1:04d}.mov"
                try:
                    encode_overlay_frames(
                        caption_frames(cue, style, width, height, fps, start_frame, end_frame),
                        path, width, height, fps, codec=config["output"].get("overlay_codec", "qtrle"),
                    )
                    assets["captions"].append({"name": f"Caption {index + 1:03d}", "path": str(path), "start": start_frame, "end": end_frame, "cue": index, "metadata": {"cutline": {"role": "caption", "cue": index + 1}}})
                except Exception as exc:
                    caption_warnings.append(f"Caption {index + 1} could not be rendered: {str(exc)[:180]}")
                if index % max(1, len(cues) // 12) == 0:
                    progress(46 + (index / max(1, len(cues))) * 10, f"Rendering caption {index + 1} of {len(cues)}…", "Captions")

        # ---- Titles ----------------------------------------------------------
        title_clips: list[dict] = []
        if plan.titles:
            progress(56, "Laying in the title cards…", "Titles")
            last_title_end = 0
            for index, cue in enumerate(plan.titles):
                start = int(cue.start_frame)
                end = int(cue.end_frame)
                if start < last_title_end or end <= start:
                    continue
                path = title_dir / f"title_{index + 1:02d}.mov"
                try:
                    encode_overlay_frames(
                        title_frames(cue.__dict__, width, height, fps, (end - start) / fps, start, end),
                        path, width, height, fps, codec=config["output"].get("overlay_codec", "qtrle"),
                    )
                    assets["titles"].append({"path": str(path), "start": start, "end": end, "title": cue.title})
                    title_clips.append({"name": f"Title · {cue.title}", "path": str(path), "start": start, "end": end})
                    last_title_end = end
                except Exception as exc:
                    plan.warnings.append(f"A title card could not be rendered: {str(exc)[:160]}")

        # ---- Transitions -----------------------------------------------------
        transition_clips: list[dict] = []
        if plan.transitions:
            progress(59, "Rendering the transitions…", "Transitions")
            custom_src = project.get("custom_transition_path")
            max_transitions = 80
            if config["transitions"].get("preset") == "custom" and custom_src and Path(custom_src).exists():
                try:
                    custom_path = transition_dir / "custom_transition.mov"
                    render_custom_overlay(
                        custom_src, custom_path, width, height, fps,
                        max(0.12, config["transitions"].get("duration", 0.6)),
                    )
                    last_end = 0
                    for cue in plan.transitions:
                        start = int(cue.start_frame)
                        end = int(cue.end_frame)
                        if start < last_end or end <= start:
                            continue
                        transition_clips.append({
                            "name": "Custom transition", "path": str(custom_path),
                            "start": start, "end": end,
                            "metadata": {"cutline": {"role": "transition", "preset": "custom"}},
                        })
                        last_end = end
                    assets["transitions"] = transition_clips
                    plan.stats["transitions"] = len(transition_clips)
                except Exception as exc:
                    plan.warnings.append(f"The custom transition could not be prepared: {str(exc)[:180]}")
            else:
                rendered = 0
                last_end = 0
                for index, cue in enumerate(plan.transitions):
                    progress(59 + (index / max(1, len(plan.transitions))) * 18,
                             f"Rendering transition {index + 1} of {len(plan.transitions)}…", "Transitions")
                    if rendered >= max_transitions:
                        plan.warnings.append(f"Only the first {max_transitions} transitions were rendered.")
                        break
                    try:
                        result = render_transition_clip(
                            cue, plan, width, height, fps,
                            transition_dir / f"transition_{index + 1:03d}.mp4",
                            work_dir / "transition_frames",
                        )
                    except Exception as exc:
                        plan.warnings.append(f"A transition was skipped: {str(exc)[:160]}")
                        continue
                    if not result:
                        continue
                    path, start, end = result
                    if start < last_end or end <= start:
                        path.unlink(missing_ok=True)
                        continue
                    transition_clips.append({
                        "name": f"Transition · {TRANSITION_PRESETS.get(cue.preset, {}).get('label', cue.preset)}",
                        "path": str(path), "start": start, "end": end,
                        "metadata": {"cutline": {"role": "transition", "preset": cue.preset, "cut": round(cue.frame / fps, 3)}},
                    })
                    last_end = end
                    rendered += 1
                assets["transitions"] = transition_clips
                plan.stats["transitions"] = len(transition_clips)

        # ---- Viewfinder graphics --------------------------------------------
        graphics_clips: list[dict] = []
        collage_clips: list[dict] = []
        if plan.hud:
            progress(76, "Hanging the viewfinder overlay…", "Graphics")
            try:
                overlay = render_hud(width, height, plan.hud)
                path = graphics_dir / "hud.mov"
                encode_still_overlay(
                    overlay, path, width, height, fps, plan.duration,
                    codec=config["output"].get("overlay_codec", "qtrle"),
                )
                graphics_clips.append({
                    "name": "Viewfinder HUD", "path": str(path), "start": 0, "end": plan.duration_frames,
                    "metadata": {"cutline": {"role": "hud", "grid": True}},
                })
                assets["graphics"].append({"path": str(path), "role": "hud", "start": 0, "end": plan.duration_frames})
            except Exception as exc:
                plan.warnings.append(f"The viewfinder overlay could not be rendered: {str(exc)[:180]}")
        if plan.collage:
            progress(77, "Building the opening collage…", "Graphics")
            try:
                path = graphics_dir / "collage_intro.mp4"
                render_collage_movie(plan.collage, width, height, fps, path)
                collage_clips.append({
                    "name": "Collage intro", "path": str(path),
                    "start": int(plan.collage.get("start_frame", 0)),
                    "end": int(plan.collage.get("end_frame", 0)),
                    "metadata": {"cutline": {"role": "collage"}},
                })
                assets["graphics"].append({
                    "path": str(path), "role": "collage",
                    "start": int(plan.collage.get("start_frame", 0)),
                    "end": int(plan.collage.get("end_frame", 0)),
                })
            except Exception as exc:
                plan.warnings.append(f"The opening collage could not be rendered: {str(exc)[:180]}")

        # ---- Timeline, sidecars, notes --------------------------------------
        progress(80, "Writing the Resolve timeline…", "Timeline")
        timeline = build_timeline(
            plan, config,
            caption_clips=assets["captions"],
            transition_clips=transition_clips,
            title_clips=title_clips,
            collage_clips=collage_clips,
            graphics_clips=graphics_clips,
            name=project["name"],
        )
        otio_path = output_dir / "timeline.otio"
        write_otio(timeline, otio_path)

        srt_path = output_dir / "captions.srt"
        vtt_path = output_dir / "captions.vtt"
        if cues:
            write_srt(cues, srt_path)
            write_vtt(cues, vtt_path)
        else:
            for path in (srt_path, vtt_path):
                path.unlink(missing_ok=True)

        transcript_path = output_dir / "transcript.txt"
        if cues:
            transcript_path.write_text(transcript_text(cues), encoding="utf-8")
        else:
            transcript_path.unlink(missing_ok=True)

        (analysis_dir / "captions.json").write_text(json.dumps({
            "style": style,
            "preset": style_preset,
            "source": caption_source_label,
            "cues": cues,
        }, indent=2), encoding="utf-8")

        # ---- Preview still ---------------------------------------------------
        progress(88, "Framing a preview…", "Preview")
        preview_path = output_dir / "preview.jpg"
        _write_preview(plan, style, cues, width, height, fps, preview_path)
        assets["preview"] = str(preview_path)
        cover = folder / "cover.jpg"
        if not cover.exists() and plan.clips:
            try:
                frame = extract_frame(plan.clips[0].source_path, cover_frame, (640, 640))
                frame.convert("RGB").save(cover, quality=86)
            except Exception:
                pass

        if waveform_samples is not None and waveform_samples.size:
            try:
                waveform_image(waveform_samples).save(output_dir / "audio.png")
            except Exception:
                pass

        # ---- Manifest / notes / summary -------------------------------------
        summary = _summary(plan, cues, config, caption_source_label, plan.warnings + caption_warnings)
        files = {
            "otio": str(otio_path),
            "srt": str(srt_path) if cues else None,
            "vtt": str(vtt_path) if cues else None,
            "transcript": str(transcript_path) if cues else None,
            "preview": str(preview_path) if preview_path.exists() else None,
            "audio": str(output_dir / "audio.png") if (output_dir / "audio.png").exists() else None,
            "folder": str(output_dir),
        }
        manifest = {
            "app": "Cutline",
            "version": __version__,
            "created": datetime.now(timezone.utc).isoformat(),
            "project": {"id": project_id, "name": project["name"], "mode": plan.mode},
            "timeline": {
                "otio": str(otio_path), "fps": fps, "width": width, "height": height,
                "duration": plan.duration, "frames": plan.duration_frames,
                "track_names": [track.name for track in timeline.tracks],
            },
            "sources": project["sources"],
            "settings": config,
            "summary": summary,
            "files": files,
            "warnings": plan.warnings + caption_warnings,
        }
        manifest_path = output_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        notes_path = output_dir / "cut_notes.md"
        notes_path.write_text(_notes(project, plan, summary, files), encoding="utf-8")
        assets["preview"] = str(preview_path)
        assets["manifest"] = str(manifest_path)
        (analysis_dir / "assets.json").write_text(json.dumps(assets, indent=2), encoding="utf-8")
        all_warnings = []
        for warning in plan.warnings + caption_warnings:
            if warning not in all_warnings:
                all_warnings.append(warning)
        summary["warnings"] = all_warnings
        summary["captions_source"] = caption_source_label
        summary["style"] = style_preset
        summary["thumbnail"] = str(cover) if cover.exists() else None

        store.update(
            project_id,
            status="done",
            stage="Ready",
            progress=100,
            message="Your first cut is ready for Resolve.",
            error=None,
            summary=summary,
            warnings=all_warnings,
            output=files,
            cover=str(cover) if cover.exists() else None,
            finished=datetime.now(timezone.utc).isoformat(),
        )
        shutil.rmtree(work_dir / "transition_frames", ignore_errors=True)
        progress(100, "Your first cut is ready for Resolve.", "Ready")
    except Exception as exc:
        message = _friendly_error(exc)
        try:
            (analysis_dir / "error.log").write_text(
                f"{datetime.now(timezone.utc).isoformat()}\n{message}\n\n{traceback.format_exc()}",
                encoding="utf-8",
            )
        except Exception:
            pass
        store.update(
            project_id,
            status="failed",
            stage="Couldn't finish",
            progress=min(99, max(0, int(store.load(project_id).get("progress", 0)))),
            message="The cut stopped before it reached the timeline.",
            error=message,
        )


def _friendly_error(exc: Exception) -> str:
    if isinstance(exc, PipelineError):
        return str(exc)
    if isinstance(exc, FileNotFoundError):
        return f"A file went offline: {exc}. Reconnect it and build again."
    if "No such file" in str(exc) or "not found" in str(exc).lower():
        return f"A media file is missing: {str(exc)[:300]}"
    if "Permission" in str(exc):
        return "Cutline could not write to its project folder. Check the data folder's permissions."
    return f"{type(exc).__name__}: {str(exc)[:500]}"


def _summary(plan: EditPlan, cues: list[dict], config: dict, caption_source: str, warnings: list[str]) -> dict:
    stats = plan.stats
    source_seconds = stats.get("source_seconds", stats.get("music_seconds", plan.duration))
    return {
        "mode": plan.mode,
        "mode_label": MODES.get(plan.mode, {}).get("label", plan.mode.title()),
        "timeline_seconds": round(plan.duration, 2),
        "source_seconds": round(float(source_seconds or plan.duration), 2),
        "clips": stats.get("clips", len(plan.clips)),
        "cuts": stats.get("cuts", max(0, len(plan.clips) - 1)),
        "removed_seconds": stats.get("removed_seconds", 0),
        "removed_ratio": stats.get("removed_ratio", 0),
        "silence_cuts": stats.get("silence_cuts", 0),
        "captions": len(cues),
        "transitions": stats.get("transitions", len(plan.transitions)),
        "titles": len(plan.titles),
        "bpm": stats.get("bpm"),
        "beat_confidence": stats.get("beat_confidence"),
        "fps": plan.fps,
        "width": plan.width,
        "height": plan.height,
        "aspect": config.get("aspect", "9:16"),
        "captions_source": caption_source,
        "transition_preset": config["transitions"].get("preset"),
        "warnings": warnings,
    }


def _write_preview(plan: EditPlan, style: dict, cues: list[dict], width: int, height: int, fps: float, path: Path) -> None:
    if not plan.clips:
        return
    target = plan.duration * 0.48
    cue = None
    if cues:
        ordered = sorted(cues, key=lambda c: abs(((c["start"] + c["end"]) / 2) - target))
        cue = ordered[0] if ordered else None
    if cue:
        at = min(plan.duration - 0.02, max(cue["start"] + 0.04, (cue["start"] + cue["end"]) / 2))
    else:
        at = min(plan.duration - 0.02, max(0.1, target))
    clip = next((c for c in plan.clips if c.rec_in / fps <= at < c.rec_out / fps), plan.clips[0])
    source_time = clip.src_in / fps + (at - clip.rec_in / fps)
    try:
        base = extract_frame(clip.source_path, source_time, (width, height)).convert("RGBA")
    except Exception:
        base = Image.new("RGBA", (width, height), (12, 12, 16, 255))
    if cue:
        try:
            overlay = render_caption_frame(cue, style, width, height, at)
            base = Image.alpha_composite(base, overlay)
        except Exception:
            pass
    if plan.hud:
        try:
            base = Image.alpha_composite(base, render_hud(width, height, plan.hud))
        except Exception:
            pass
    base.convert("RGB").save(path, quality=90)


def _track_guide(plan: EditPlan) -> str:
    guide = "The cut lands on V1, transitions on V2, captions on V3, titles on V4, audio on A1."
    extras = []
    if plan.collage:
        extras.append("the opening collage on V5")
    if plan.hud:
        extras.append("the viewfinder HUD on V6")
    if extras:
        guide += " " + " and ".join(extras).capitalize() + " sit above the cut."
    return guide.replace("on v5", "on V5").replace("on v6", "on V6").replace("viewfinder hud", "viewfinder HUD")


def _notes(project: dict, plan: EditPlan, summary: dict, files: dict) -> str:
    lines = [
        f"# {project['name']}",
        "",
        "Cut with **Cutline** for DaVinci Resolve Free.",
        "",
        f"- Mode: {summary['mode_label']}",
        f"- Timeline: {summary['timeline_seconds']:.1f}s at {plan.fps:g} fps · {plan.width}×{plan.height}",
        f"- Clips: {summary['clips']} · cuts: {summary['cuts']} · removed: {summary['removed_seconds']:.1f}s",
        f"- Captions: {summary['captions']} cues ({summary['captions_source']})",
        f"- Transitions: {summary['transitions']}",
    ]
    if summary.get("bpm"):
        lines.append(f"- Tempo: {summary['bpm']:.2f} BPM")
    lines += [
        "",
        "## Import into Resolve",
        "",
        "1. Open your project in DaVinci Resolve (Free is fine).",
        "2. Choose **File → Import → Timeline** (Shift+Command/Ctrl+I).",
        "3. Select `timeline.otio` from this folder.",
        f"4. {_track_guide(plan)}",
        "5. Captions are also exported as `captions.srt` if you want Resolve's subtitle track.",
        "",
        "Footage stays linked to its original location. Keep those drives mounted.",
        "",
        "## Warnings",
        "",
    ]
    if summary.get("warnings"):
        lines += [f"- {warning}" for warning in summary["warnings"]]
    else:
        lines.append("- None.")
    lines += [
        "",
        "Generated files:",
        "- `timeline.otio`",
        "- `captions.srt`" if files.get("srt") else "- (no captions)",
        "- `preview.jpg`",
        "",
    ]
    return "\n".join(lines)


def run_recaption(store: ProjectStore, project_id: str, edits: list[dict]) -> None:
    progress = Progress(store, project_id)
    project = store.load(project_id)
    folder = store.folder(project_id)
    analysis_dir = folder / "analysis"
    output_dir = folder / "output"
    try:
        plan_data = store.read_json(project_id, "plan.json", "analysis")
        if not plan_data:
            raise PipelineError("This project has no saved edit plan. Build it again.")
        plan = EditPlan.from_dict(plan_data)
        captions_data = store.read_json(project_id, "captions.json", "analysis", {})
        style = captions_data.get("style") or project["config"]["captions"]["style"]
        cues = apply_edits(captions_data.get("cues", []), edits, plan.duration)
        progress(12, "Updating the caption track…", "Captions")
        caption_dir = output_dir / "media" / "captions"
        caption_dir.mkdir(parents=True, exist_ok=True)
        for old in caption_dir.glob("*.mov"):
            old.unlink(missing_ok=True)
        assets = store.read_json(project_id, "assets.json", "analysis", {}) or {}
        assets["captions"] = []
        if cues and project["config"]["captions"].get("delivery") in ("overlay", "overlay_srt"):
            for index, cue in enumerate(cues):
                start_frame = max(0, int(round(cue["start"] * plan.fps)))
                end_frame = max(start_frame + 1, int(round(cue["end"] * plan.fps)))
                end_frame = min(end_frame, plan.duration_frames)
                if end_frame <= start_frame:
                    continue
                path = caption_dir / f"caption_{index + 1:04d}.mov"
                encode_overlay_frames(
                    caption_frames(cue, style, plan.width, plan.height, plan.fps, start_frame, end_frame),
                    path, plan.width, plan.height, plan.fps,
                    codec=project["config"]["output"].get("overlay_codec", "qtrle"),
                )
                assets["captions"].append({"name": f"Caption {index + 1:03d}", "path": str(path), "start": start_frame, "end": end_frame, "cue": index, "metadata": {"cutline": {"role": "caption", "cue": index + 1}}})
                progress(12 + (index / max(1, len(cues))) * 50, f"Rendering caption {index + 1}…", "Captions")
        # Rebuild a timeline reusing transition and title renders.
        transitions = assets.get("transitions", [])
        title_clips = [
            {"name": f"Title · {entry.get('title', 'Card')}", "path": entry["path"], "start": entry["start"], "end": entry["end"]}
            for entry in assets.get("titles", [])
            if entry.get("path")
        ]
        collage_clips, graphics_clips = [], []
        for entry in assets.get("graphics", []):
            if not entry.get("path"):
                continue
            clip = {
                "name": "Collage intro" if entry.get("role") == "collage" else "Viewfinder HUD",
                "path": entry["path"],
                "start": int(entry.get("start", 0)),
                "end": int(entry.get("end", plan.duration_frames)),
            }
            (collage_clips if entry.get("role") == "collage" else graphics_clips).append(clip)
        timeline = build_timeline(
            plan, project["config"],
            caption_clips=assets["captions"],
            transition_clips=transitions,
            title_clips=title_clips,
            collage_clips=collage_clips,
            graphics_clips=graphics_clips,
            name=project["name"],
        )
        otio_path = output_dir / "timeline.otio"
        write_otio(timeline, otio_path)
        srt_path = output_dir / "captions.srt"
        vtt_path = output_dir / "captions.vtt"
        if cues:
            write_srt(cues, srt_path)
            write_vtt(cues, vtt_path)
        else:
            for path in (srt_path, vtt_path):
                path.unlink(missing_ok=True)
        (analysis_dir / "captions.json").write_text(json.dumps({
            "style": style,
            "preset": captions_data.get("preset", project["config"]["captions"].get("preset")),
            "source": captions_data.get("source", "Manual edit"),
            "cues": cues,
        }, indent=2), encoding="utf-8")
        summary = project.get("summary", {})
        summary["captions"] = len(cues)
        summary["timeline_seconds"] = round(plan.duration, 2)
        preview_path = output_dir / "preview.jpg"
        _write_preview(plan, style, cues, plan.width, plan.height, plan.fps, preview_path)
        summary["thumbnail"] = project.get("cover")
        files = project.get("output", {})
        files.update({
            "otio": str(otio_path),
            "srt": str(srt_path) if cues else None,
            "vtt": str(vtt_path) if cues else None,
            "preview": str(preview_path),
            "folder": str(output_dir),
        })
        assets["preview"] = str(preview_path)
        (analysis_dir / "assets.json").write_text(json.dumps(assets, indent=2), encoding="utf-8")
        store.update(project_id, status="done", stage="Ready", progress=100,
                     message="Captions updated.", error=None, summary=summary, output=files)
    except Exception as exc:
        message = _friendly_error(exc)
        try:
            (analysis_dir / "error.log").write_text(
                f"{datetime.now(timezone.utc).isoformat()}\n{message}\n\n{traceback.format_exc()}",
                encoding="utf-8",
            )
        except Exception:
            pass
        store.update(project_id, status="failed", stage="Couldn't update captions",
                     message="The caption update stopped.", error=message)


def ingest_media(path: str, name: str | None = None) -> dict:
    return _source_stub(path, name)
