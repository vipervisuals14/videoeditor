from __future__ import annotations

from pathlib import Path

import pytest
from opentimelineio import adapters, schema

from cutline.config import normalize_config
from cutline.planner import EditPlan, PlannedClip, build_edit_plan
from cutline.timeline import build_timeline, write_otio


def _plan():
    config = normalize_config({"mode": "social"}, "social")
    sources = [{
        "id": "s1", "name": "take.mp4", "path": "/media/take.mp4", "duration": 20.0,
        "width": 1080, "height": 1920, "fps": 30.0, "has_audio": True, "has_video": True,
    }]
    analysis = {"s1": {"segments": [{"start": 0.0, "end": 4.0}, {"start": 6.0, "end": 9.0}], "kept_seconds": 7.0}}
    return build_edit_plan(config, sources, analysis, fps=30), config


def test_track_order_is_audio_then_video_layers(tmp_path):
    plan, config = _plan()
    caption = tmp_path / "cap.mov"
    caption.write_bytes(b"stub")
    title = tmp_path / "title.mov"
    title.write_bytes(b"stub")
    transition = tmp_path / "trans.mov"
    transition.write_bytes(b"stub")
    timeline = build_timeline(
        plan, config,
        caption_clips=[{"name": "Caption 001", "path": str(caption), "start": 10, "end": 40}],
        transition_clips=[{"name": "Flash", "path": str(transition), "start": 200, "end": 215}],
        title_clips=[{"name": "Title", "path": str(title), "start": 0, "end": 60}],
        name="Test cut",
    )
    names = [track.name for track in timeline.tracks]
    assert names[0].startswith("A1")
    assert names[1].startswith("V1")
    assert names[2].startswith("V2")
    assert names[3].startswith("V3")
    assert names[4].startswith("V4")
    kinds = [track.kind for track in timeline.tracks]
    assert kinds[0] == schema.TrackKind.Audio
    assert all(kind == schema.TrackKind.Video for kind in kinds[1:])


def test_every_track_is_contiguous_and_ends_together(tmp_path):
    plan, config = _plan()
    timeline = build_timeline(plan, config, name="Contiguous")
    for track in timeline.tracks:
        cursor = 0
        for item in track:
            start = item.range_in_parent().start_time
            assert start.value == pytest.approx(cursor, abs=1e-6), f"{track.name} has a hole or overlap"
            cursor += item.duration().value
        assert cursor == pytest.approx(plan.duration_frames, abs=2), f"{track.name} ends early"


def test_program_clips_keep_source_ranges(tmp_path):
    plan, config = _plan()
    timeline = build_timeline(plan, config, name="Ranges")
    program = timeline.tracks[1]
    clips = [item for item in program if isinstance(item, schema.Clip)]
    assert [round(clip.source_range.start_time.value) for clip in clips] == [0, 180]
    for clip in clips:
        assert Path(clip.media_reference.target_url).is_absolute()


def test_otio_round_trip(tmp_path):
    plan, config = _plan()
    timeline = build_timeline(plan, config, name="Round trip")
    path = write_otio(timeline, tmp_path / "timeline.otio")
    assert path.exists()
    loaded = adapters.read_from_file(str(path))
    assert loaded.name == "Round trip"
    assert loaded.duration().value == pytest.approx(plan.duration_frames, abs=2)
    assert loaded.metadata["cutline"]["mode"] == "social"


def test_music_plan_puts_one_audio_clip_on_a1(tmp_path):
    plan = EditPlan(mode="music", fps=30, width=1920, height=1080, duration_frames=900)
    plan.clips = [PlannedClip("s1", "a.mp4", "/media/a.mp4", 0, 900, 0, 900)]
    plan.music_audio = {"path": "/media/song.wav", "frames": 900}
    config = normalize_config({"mode": "music"}, "music")
    timeline = build_timeline(plan, config, name="Music")
    audio = timeline.tracks[0]
    assert audio.kind == schema.TrackKind.Audio
    assert len(audio) == 1
    assert audio[0].media_reference.target_url == "/media/song.wav"
