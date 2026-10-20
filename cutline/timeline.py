from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from opentimelineio import adapters, schema
from opentimelineio import opentime as ot

from . import __version__
from .planner import EditPlan


def _rt(frames: int, fps: float) -> ot.RationalTime:
    return ot.RationalTime(int(frames), float(fps))


def _range(start: int, end: int, fps: float) -> ot.TimeRange:
    return ot.TimeRange(_rt(start, fps), _rt(max(0, end - start), fps))


def _media_clip(name: str, path: str | Path, start: int, end: int, fps: float, metadata: dict | None = None) -> schema.Clip:
    return schema.Clip(
        name=name,
        media_reference=schema.ExternalReference(target_url=str(Path(path).expanduser().resolve())),
        source_range=_range(0, end - start, fps),
        metadata=metadata or {},
    )


def _add_entries(track: schema.Track, entries: list[dict], fps: float) -> None:
    if not entries:
        return
    entries = sorted(entries, key=lambda entry: (entry["start"], entry["end"]))
    cursor = 0
    for entry in entries:
        start = int(entry["start"])
        end = int(entry["end"])
        if end <= start:
            continue
        if start < cursor:
            # Never make an overlapping track; trim the tail of the neighbour instead
            # of letting the file encode impossible editorial.
            start = cursor
        if start > cursor:
            track.append(schema.Gap(duration=_rt(start - cursor, fps)))
            cursor = start
        if end <= start:
            continue
        track.append(_media_clip(entry["name"], entry["path"], start, end, fps, entry.get("metadata")))
        cursor = end


def build_timeline(
    plan: EditPlan,
    config: dict,
    caption_clips: list[dict] | None = None,
    transition_clips: list[dict] | None = None,
    title_clips: list[dict] | None = None,
    name: str = "Cutline edit",
) -> schema.Timeline:
    fps = plan.fps
    timeline = schema.Timeline(name=name)
    timeline.global_start_time = _rt(0, fps)
    tracks: list[schema.Track] = []

    # Audio first, then video bottom-to-top. This is the ordering that imports
    # faithfully into Resolve (title on V2 above V1, music on A1).
    audio = schema.Track(name="A1 — Music" if plan.mode == "music" else "A1 — Dialogue", kind=schema.TrackKind.Audio)
    if plan.mode == "music" and plan.music_audio:
        entry = plan.music_audio
        end = min(plan.duration_frames, int(entry.get("frames") or plan.duration_frames))
        audio.append(_media_clip("Music bed", entry["path"], 0, end, fps, {"cutline": {"role": "music"}}))
    else:
        entries: list[dict] = []
        cursor = 0
        for clip in plan.clips:
            if clip.has_audio:
                entries.append({
                    "name": clip.source_name, "path": clip.source_path,
                    "start": clip.rec_in, "end": clip.rec_out,
                    "metadata": {"cutline": {"role": "dialogue", "source_in": clip.src_in, "source_out": clip.src_out}},
                })
        if entries:
            # _add_entries writes opaque clips at the correct gaps, but we need
            # source-range trims rather than 0-based line-up here.
            audio_entries = []
            for index, clip in enumerate(plan.clips):
                if not clip.has_audio:
                    continue
                audio_entries.append({"clip": clip, "start": clip.rec_in, "end": clip.rec_out})
            cursor = 0
            for item in audio_entries:
                clip = item["clip"]
                if clip.rec_in > cursor:
                    audio.append(schema.Gap(duration=_rt(clip.rec_in - cursor, fps)))
                    cursor = clip.rec_in
                audio.append(schema.Clip(
                    name=clip.source_name,
                    media_reference=schema.ExternalReference(target_url=str(Path(clip.source_path).expanduser().resolve())),
                    source_range=_range(clip.src_in, clip.src_out, fps),
                    metadata={"cutline": {"role": "dialogue"}},
                ))
                cursor = clip.rec_out
    if len(audio) > 0:
        tracks.append(audio)

    program = schema.Track(name="V1 — Program", kind=schema.TrackKind.Video)
    previous_source = None
    for index, clip in enumerate(plan.clips):
        source_range = _range(clip.src_in, clip.src_out, fps)
        metadata = {
            "cutline": {
                "role": "program",
                "source": clip.source_name,
                "source_in": round(clip.src_in / fps, 3),
                "source_out": round(clip.src_out / fps, 3),
                "note": "Cutline first cut — trim freely.",
            }
        }
        program.append(schema.Clip(
            name=f"{Path(clip.source_name).stem} · {index + 1:03d}",
            media_reference=schema.ExternalReference(target_url=str(Path(clip.source_path).expanduser().resolve())),
            source_range=source_range,
            metadata=metadata,
        ))
        if previous_source is not None and clip.source_id != previous_source:
            try:
                program[-1].markers.append(schema.Marker(
                    name=f"New source · {Path(clip.source_name).stem}",
                    marked_range=ot.TimeRange(source_range.start_time, _rt(0, fps)),
                    color=schema.MarkerColor.CYAN,
                ))
            except Exception:
                pass
        previous_source = clip.source_id
    tracks.append(program)

    transition_track = schema.Track(name="V2 — Transitions", kind=schema.TrackKind.Video)
    if transition_clips:
        _add_entries(transition_track, transition_clips, fps)
        tracks.append(transition_track)

    caption_track = schema.Track(name="V3 — Captions", kind=schema.TrackKind.Video)
    if caption_clips:
        _add_entries(caption_track, caption_clips, fps)
        tracks.append(caption_track)

    title_track = schema.Track(name="V4 — Titles", kind=schema.TrackKind.Video)
    if title_clips:
        _add_entries(title_track, title_clips, fps)
        tracks.append(title_track)

    for track in tracks:
        timeline.tracks.append(track)

    timeline.metadata["cutline"] = {
        "version": __version__,
        "mode": plan.mode,
        "fps": float(fps),
        "duration_seconds": plan.duration,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "app": "Cutline",
        "note": "Generated for DaVinci Resolve. Import with File > Import > Timeline.",
    }
    return timeline


def write_otio(timeline: schema.Timeline, path: str | Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    adapters.write_to_file(timeline, str(path), "otio_json")
    return path
