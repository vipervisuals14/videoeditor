from __future__ import annotations

import random
import re
from dataclasses import dataclass, field, asdict
from pathlib import Path

from .config import output_dimensions


def human_name(path: str | Path) -> str:
    stem = Path(path).stem
    stem = re.sub(r"[_\-]+", " ", stem).strip()
    stem = re.sub(r"\s+", " ", stem)
    if re.fullmatch(r"[\d\s._-]+", stem or ""):
        return "Untitled clip"
    return stem[:70] or "Untitled clip"


def _frames(seconds: float, fps: float) -> int:
    return max(0, int(round(float(seconds) * float(fps))))


@dataclass
class PlannedClip:
    source_id: str
    source_name: str
    source_path: str
    src_in: int
    src_out: int
    rec_in: int
    rec_out: int
    segment_index: int = 0
    file_index: int = 0
    chapter: str = ""
    is_visual_fill: bool = False
    has_audio: bool = False

    @property
    def frames(self) -> int:
        return max(0, self.rec_out - self.rec_in)

    def to_dict(self, fps: float) -> dict:
        return {
            **asdict(self),
            "source_in": round(self.src_in / fps, 4),
            "source_out": round(self.src_out / fps, 4),
            "rec_in": round(self.rec_in / fps, 4),
            "rec_out": round(self.rec_out / fps, 4),
            "duration": round(self.frames / fps, 4),
        }


@dataclass
class TransitionCue:
    frame: int
    start_frame: int
    end_frame: int
    preset: str
    intensity: float
    reason: str = "cut"

    def to_dict(self, fps: float) -> dict:
        return {
            "time": round(self.frame / fps, 4),
            "start": round(self.start_frame / fps, 4),
            "end": round(self.end_frame / fps, 4),
            "duration": round((self.end_frame - self.start_frame) / fps, 4),
            "preset": self.preset,
            "intensity": self.intensity,
            "reason": self.reason,
        }


@dataclass
class TitleCue:
    start_frame: int
    end_frame: int
    kind: str
    title: str
    kicker: str = ""
    meta: str = ""

    def to_dict(self, fps: float) -> dict:
        return {
            "start": round(self.start_frame / fps, 4),
            "end": round(self.end_frame / fps, 4),
            "kind": self.kind,
            "title": self.title,
            "kicker": self.kicker,
            "meta": self.meta,
        }


@dataclass
class EditPlan:
    mode: str
    fps: float
    width: int
    height: int
    duration_frames: int
    clips: list[PlannedClip] = field(default_factory=list)
    transitions: list[TransitionCue] = field(default_factory=list)
    titles: list[TitleCue] = field(default_factory=list)
    music_audio: dict | None = None
    beat: dict | None = None
    stats: dict = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)
    source_map: dict[str, list[dict]] = field(default_factory=dict)

    @property
    def duration(self) -> float:
        return round(self.duration_frames / self.fps, 4)

    @property
    def cut_frames(self) -> list[int]:
        return [clip.rec_out for clip in self.clips[:-1]]

    def to_dict(self) -> dict:
        return {
            "version": 1,
            "mode": self.mode,
            "fps": self.fps,
            "width": self.width,
            "height": self.height,
            "duration_frames": self.duration_frames,
            "duration": self.duration,
            "clips": [clip.to_dict(self.fps) for clip in self.clips],
            "transitions": [cue.to_dict(self.fps) for cue in self.transitions],
            "titles": [cue.to_dict(self.fps) for cue in self.titles],
            "music_audio": self.music_audio,
            "beat": self.beat,
            "stats": self.stats,
            "warnings": self.warnings,
            "source_map": self.source_map,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "EditPlan":
        plan = cls(
            mode=data.get("mode", "social"),
            fps=float(data.get("fps", 30)),
            width=int(data.get("width", 1080)),
            height=int(data.get("height", 1920)),
            duration_frames=int(data.get("duration_frames", 0)),
            music_audio=data.get("music_audio"),
            beat=data.get("beat"),
            stats=data.get("stats", {}),
            warnings=data.get("warnings", []),
            source_map=data.get("source_map", {}),
        )
        for clip in data.get("clips", []):
            plan.clips.append(PlannedClip(
                source_id=clip["source_id"], source_name=clip.get("source_name", ""),
                source_path=clip["source_path"], src_in=int(clip["src_in"]), src_out=int(clip["src_out"]),
                rec_in=int(clip["rec_in"]), rec_out=int(clip["rec_out"]),
                segment_index=int(clip.get("segment_index", 0)), file_index=int(clip.get("file_index", 0)),
                chapter=clip.get("chapter", ""), is_visual_fill=bool(clip.get("is_visual_fill", False)),
                has_audio=bool(clip.get("has_audio", False)),
            ))
        for cue in data.get("transitions", []):
            plan.transitions.append(TransitionCue(
                frame=int(round(float(cue["time"]) * plan.fps)),
                start_frame=int(round(float(cue["start"]) * plan.fps)),
                end_frame=int(round(float(cue["end"]) * plan.fps)),
                preset=cue.get("preset", "light_leak"), intensity=float(cue.get("intensity", 0.7)),
                reason=cue.get("reason", "cut"),
            ))
        for cue in data.get("titles", []):
            plan.titles.append(TitleCue(
                start_frame=int(round(float(cue["start"]) * plan.fps)),
                end_frame=int(round(float(cue["end"]) * plan.fps)),
                kind=cue.get("kind", "title"), title=cue.get("title", ""),
                kicker=cue.get("kicker", ""), meta=cue.get("meta", ""),
            ))
        return plan


def _source_map(clips: list[PlannedClip]) -> dict[str, list[dict]]:
    mapping: dict[str, list[dict]] = {}
    for clip in clips:
        mapping.setdefault(clip.source_id, []).append({
            "src_in": clip.src_in, "src_out": clip.src_out, "rec_in": clip.rec_in, "rec_out": clip.rec_out,
        })
    return mapping


def _transition_candidates(
    clips: list[PlannedClip],
    scope: str,
) -> list[tuple[int, str]]:
    candidates: list[tuple[int, str]] = []
    for index in range(len(clips) - 1):
        left, right = clips[index], clips[index + 1]
        source_change = left.source_id != right.source_id
        if scope == "source_changes" and not source_change:
            continue
        reason = "source change" if source_change else "cut"
        candidates.append((left.rec_out, reason))
    return candidates


def _add_transitions(
    plan: EditPlan,
    config: dict,
) -> None:
    tr = config["transitions"]
    if not tr.get("enabled") or plan.mode == "music":
        return
    scope = tr.get("scope", "cuts")
    candidates = _transition_candidates(plan.clips, scope)
    if not candidates:
        return
    frequency = int(tr.get("frequency") or 0)
    if frequency <= 0:
        return
    selected = candidates[frequency - 1::frequency] if frequency > 1 else candidates
    duration_frames = max(2, _frames(float(tr.get("duration", 0.5)), plan.fps))
    added = 0
    for cut_frame, reason in selected:
        start = max(0, cut_frame - duration_frames // 2)
        end = min(plan.duration_frames, start + duration_frames)
        start = max(0, end - duration_frames)
        if end - start < max(3, int(plan.fps * 0.12)):
            continue
        # Avoid stacking a transition on the very first or last frames.
        if cut_frame < plan.fps * 0.2 or cut_frame > plan.duration_frames - plan.fps * 0.2:
            continue
        plan.transitions.append(TransitionCue(
            frame=cut_frame, start_frame=start, end_frame=end,
            preset=tr.get("preset", "light_leak"), intensity=float(tr.get("intensity", 0.7)),
            reason=reason,
        ))
        added += 1
    plan.stats["transitions"] = added
    if not added:
        plan.warnings.append("No transition was placed: the edit has no eligible cuts.")


def _add_vlog_titles(plan: EditPlan, config: dict, sources: list[dict]) -> None:
    vlog = config.get("vlog", {})
    if plan.mode != "vlog":
        return
    source_stem = human_name(plan.clips[0].source_name) if plan.clips else "A travel film"
    title = (vlog.get("title") or source_stem).strip()
    location = (vlog.get("location") or "").strip()
    date = (vlog.get("date") or "").strip()
    if vlog.get("title_card", True):
        seconds = float(vlog.get("title_seconds", 4.0))
        end = min(plan.duration_frames, max(1, _frames(seconds, plan.fps)))
        if end > 2:
            plan.titles.append(TitleCue(
                start_frame=0, end_frame=end, kind="title",
                title=title, kicker=location or "A CUTLINE FILM", meta=date,
            ))
    if vlog.get("chapter_cards", True) and len(sources) > 1:
        seen: set[str] = set()
        chapter_no = 0
        for index, clip in enumerate(plan.clips):
            if clip.source_id in seen:
                continue
            seen.add(clip.source_id)
            chapter_no += 1
            if chapter_no == 1:
                continue
            end = min(plan.duration_frames, clip.rec_in + _frames(2.8, plan.fps))
            if end - clip.rec_in < int(plan.fps * 1.2):
                continue
            plan.titles.append(TitleCue(
                start_frame=clip.rec_in, end_frame=end, kind="chapter",
                title=human_name(clip.source_name), kicker=f"CHAPTER {chapter_no:02d}", meta=location,
            ))
    plan.stats["titles"] = len(plan.titles)


def build_edit_plan(
    config: dict,
    sources: list[dict],
    analyses: dict[str, dict],
    fps: float,
    beat: dict | None = None,
    music_path: str | None = None,
    music_duration: float | None = None,
    seed: str = "cutline",
) -> EditPlan:
    mode = config.get("mode", "social")
    width, height = output_dimensions(config)
    if mode == "music":
        return _build_music_plan(config, sources, fps, width, height, beat or {}, music_path, music_duration, seed)
    return _build_speech_plan(config, sources, analyses, fps, width, height)


def _build_speech_plan(
    config: dict,
    sources: list[dict],
    analyses: dict[str, dict],
    fps: float,
    width: int,
    height: int,
) -> EditPlan:
    plan = EditPlan(mode=config.get("mode", "social"), fps=fps, width=width, height=height, duration_frames=0)
    cursor = 0
    total_source_frames = 0
    removed_frames = 0
    for file_index, source in enumerate(sources):
        duration_frames = max(1, _frames(float(source.get("duration", 0)), fps))
        total_source_frames += duration_frames
        analysis = analyses.get(source["id"]) or {}
        segments = analysis.get("segments") if config["silence"].get("enabled") else None
        if not segments:
            segments = [{"start": 0.0, "end": float(source.get("duration", 0))}]
        chapter = human_name(source.get("name") or source.get("path", ""))
        seg_index = 0
        for segment in segments:
            start_f = max(0, min(duration_frames - 1, _frames(segment["start"], fps)))
            end_f = max(start_f + 1, min(duration_frames, _frames(segment["end"], fps)))
            length = end_f - start_f
            if length < max(1, int(round(fps * 0.08))):
                continue
            # Prevent an accidental duplicate or out-of-range segment.
            if start_f >= duration_frames or end_f <= start_f:
                continue
            plan.clips.append(PlannedClip(
                source_id=source["id"],
                source_name=source.get("name") or Path(source["path"]).name,
                source_path=source["path"],
                src_in=start_f,
                src_out=end_f,
                rec_in=cursor,
                rec_out=cursor + length,
                segment_index=seg_index,
                file_index=file_index,
                chapter=chapter,
                has_audio=bool(source.get("has_audio")),
            ))
            cursor += length
            seg_index += 1
        kept = sum(clip.frames for clip in plan.clips if clip.source_id == source["id"])
        removed_frames += max(0, duration_frames - kept)

    if not plan.clips:
        raise ValueError("The silence pass left nothing to edit. Try the Natural pacing preset or turn silence removal off.")

    plan.duration_frames = cursor
    plan.source_map = _source_map(plan.clips)
    total_seconds = cursor / fps
    plan.stats.update({
        "clips": len(plan.clips),
        "source_seconds": round(total_source_frames / fps, 2),
        "removed_seconds": round(removed_frames / fps, 2),
        "removed_ratio": round(removed_frames / max(1, total_source_frames), 3),
        "silence_cuts": max(0, len(plan.clips) - len(sources)),
        "cuts": max(0, len(plan.clips) - 1),
        "timeline_seconds": round(total_seconds, 2),
    })
    if config.get("silence", {}).get("enabled") and len(plan.clips) <= len(sources):
        plan.warnings.append("No usable silence was detected — the edit uses the full clips. Try Tight or Surgical pacing.")
    _add_transitions(plan, config)
    _add_vlog_titles(plan, config, sources)
    return plan


def _round_beat_time(value: float, fps: float) -> int:
    return max(0, int(round(value * fps)))


def _build_music_plan(
    config: dict,
    sources: list[dict],
    fps: float,
    width: int,
    height: int,
    beat: dict,
    music_path: str | None,
    music_duration: float | None,
    seed: str,
) -> EditPlan:
    if not sources:
        raise ValueError("Add at least one video clip for the visuals.")
    visual_sources = [s for s in sources if s.get("has_video", True) and float(s.get("duration", 0)) > 0.3]
    if not visual_sources:
        raise ValueError("No video clips with usable footage were found.")
    duration = float(music_duration or (visual_sources[0].get("duration") or 0))
    if duration <= 0:
        raise ValueError("The music track has no duration.")
    bpm = float(beat.get("bpm") or config["music"].get("bpm") or 120)
    period = 60.0 / bpm
    beats_per_cut = max(1, int(config["music"].get("beats_per_cut", 4)))
    offset = float(beat.get("offset") or 0.0)

    beat_grid = [float(value) for value in (beat.get("beats") or [])]
    if not beat_grid:
        beat_grid = [offset + i * period for i in range(int(duration / period) + 2)]

    # Cut on every Nth beat, but do not put a 3-frame opener at the head.
    cut_points: list[tuple[float, int]] = []
    for beat_index in range(0, len(beat_grid), beats_per_cut):
        value = beat_grid[beat_index]
        if value <= 0.28:
            continue
        if value >= duration - 0.18:
            break
        cut_points.append((round(value, 4), beat_index))
    # A pickup shorter than ~0.7s reads as a glitch rather than a beat cut.
    while cut_points and cut_points[0][0] < 0.7 and len(cut_points) > 1:
        cut_points = cut_points[1:]
    boundaries: list[tuple[float, int]] = [(0.0, -1)] + cut_points + [(duration, len(beat_grid) - 1)]
    # Remove duplicate/too-close boundaries.
    deduped: list[tuple[float, int]] = []
    for value, beat_index in boundaries:
        if deduped and (value - deduped[-1][0]) * fps < 2:
            continue
        deduped.append((value, beat_index))
    boundaries = deduped
    if len(boundaries) < 2:
        boundaries = [(0.0, -1), (duration, 0)]

    plan = EditPlan(mode="music", fps=fps, width=width, height=height, duration_frames=max(1, _round_beat_time(duration, fps)))
    plan.beat = {
        "bpm": round(bpm, 2),
        "detected_bpm": beat.get("detected_bpm"),
        "confidence": beat.get("confidence"),
        "source": "manual" if config["music"].get("bpm") else "detected",
        "beats_per_cut": beats_per_cut,
        "transition_every": config["music"].get("transition_every"),
        "offset": round(offset, 4),
    }

    # Build a fair rotation of the source files (or a stable shuffle).
    order = list(range(len(visual_sources)))
    if config["music"].get("order") == "shuffle":
        rng_seed = int.from_bytes(seed.encode("utf-8")[:8].ljust(8, b"0"), "big")
        random.Random(rng_seed).shuffle(order)
    cursors = {}
    for idx, source in enumerate(visual_sources):
        rng = random.Random(f"{seed}:{source['id']}")
        cursors[idx] = 0.35 if config["music"].get("order") != "shuffle" else rng.uniform(0.2, max(0.4, min(2.5, float(source["duration"]) * 0.25)))

    rotation = 0
    previous_index = None
    for boundary_index in range(len(boundaries) - 1):
        start_time = boundaries[boundary_index][0]
        end_time = boundaries[boundary_index + 1][0]
        segment_start = _round_beat_time(start_time, fps)
        segment_end = _round_beat_time(end_time, fps)
        if segment_end <= segment_start:
            continue
        playhead = segment_start
        guard = 0
        while playhead < segment_end and guard < 32:
            guard += 1
            if len(order) > 1:
                # Avoid cutting twice to the same source file in a row.
                if order[rotation % len(order)] == previous_index:
                    rotation += 1
                source_index = order[rotation % len(order)]
            else:
                source_index = order[0]
            source = visual_sources[source_index]
            duration_s = max(0.2, float(source.get("duration", 0)))
            cursor_s = cursors.get(source_index, 0.0)
            if cursor_s + 0.5 >= duration_s:
                rng = random.Random(f"{seed}:{source['id']}:{boundary_index}:{playhead}")
                cursor_s = 0.15 if config["music"].get("order") != "shuffle" else rng.uniform(0.1, max(0.2, duration_s * 0.3))
            available = max(0, int((duration_s - cursor_s) * fps) - 1)
            if available <= 1:
                cursors[source_index] = 0.0
                rotation += 1
                continue
            take = min(segment_end - playhead, available)
            if take < 2:
                rotation += 1
                cursors[source_index] = 0.0
                continue
            src_in = max(0, int(round(cursor_s * fps)))
            src_out = min(int(round(duration_s * fps)) - 1, src_in + take)
            take = src_out - src_in
            if take <= 0:
                rotation += 1
                continue
            plan.clips.append(PlannedClip(
                source_id=source["id"], source_name=source.get("name") or Path(source["path"]).name,
                source_path=source["path"], src_in=src_in, src_out=src_out,
                rec_in=playhead, rec_out=playhead + take, segment_index=boundary_index,
                file_index=source_index, chapter="", is_visual_fill=True,
                has_audio=False,
            ))
            cursors[source_index] = src_out / fps + 0.32
            previous_index = source_index
            playhead += take
            rotation += 1
            if playhead < segment_end and segment_end - playhead < 2:
                playhead = segment_end
    if not plan.clips:
        raise ValueError("Could not lay any source footage on the music grid. Try a longer clip.")
    plan.source_map = _source_map(plan.clips)

    # Add the music bed as one audio clip.
    music_source = music_path
    if not music_source:
        with_audio = next((source for source in visual_sources if source.get("has_audio")), None)
        if with_audio:
            music_source = with_audio["path"]
            plan.warnings.append("No separate song was added — the first clip's audio is used as the music bed.")
    if music_source:
        plan.music_audio = {
            "path": music_source,
            "start": 0.0,
            "duration": round(plan.duration_frames / fps, 4),
            "frames": plan.duration_frames,
        }
    else:
        plan.warnings.append("No music audio was found. Picture is still cut to the detected grid.")

    # Beat selection for transitions.
    tr = config["transitions"]
    tr_enabled = bool(tr.get("enabled"))
    transition_every = int(config["music"].get("transition_every") or 0)
    duration_frames = max(2, _frames(float(tr.get("duration", 0.3)), fps))
    selected_transitions = 0
    if tr_enabled:
        if tr.get("scope") == "beats" and transition_every > 0:
            for value, beat_index in cut_points:
                if beat_index < 0 or beat_index % transition_every != 0:
                    continue
                cut_frame = _round_beat_time(value, fps)
                start = max(0, cut_frame - duration_frames // 2)
                end = min(plan.duration_frames, start + duration_frames)
                if end - start < 3:
                    continue
                plan.transitions.append(TransitionCue(
                    frame=cut_frame, start_frame=start, end_frame=end,
                    preset=tr.get("preset", "flash"), intensity=float(tr.get("intensity", 0.75)),
                    reason="beat",
                ))
                selected_transitions += 1
        else:
            frequency = max(1, int(tr.get("frequency") or 1))
            for beat_position, (value, beat_index) in enumerate(cut_points):
                if beat_position % frequency != 0:
                    continue
                cut_frame = _round_beat_time(value, fps)
                start = max(0, cut_frame - duration_frames // 2)
                end = min(plan.duration_frames, start + duration_frames)
                if end - start < 3:
                    continue
                plan.transitions.append(TransitionCue(
                    frame=cut_frame, start_frame=start, end_frame=end,
                    preset=tr.get("preset", "flash"), intensity=float(tr.get("intensity", 0.75)),
                    reason="beat",
                ))
                selected_transitions += 1

    plan.stats.update({
        "clips": len(plan.clips),
        "cuts": max(0, len(plan.clips) - 1),
        "beat_cuts": len(cut_points),
        "transitions": selected_transitions,
        "timeline_seconds": round(plan.duration_frames / fps, 2),
        "bpm": round(bpm, 2),
        "beat_confidence": beat.get("confidence"),
        "music_seconds": round(duration, 2),
    })
    if beat.get("confidence") is not None and float(beat.get("confidence") or 0) < 0.25:
        plan.warnings.append("Beat detection was unsure — check the BPM field and rebuild if the cuts feel off.")
    plan.warnings.append("Picture is on the beat grid; the original camera audio is muted in favour of the music bed.")
    return plan
