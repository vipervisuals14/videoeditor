from __future__ import annotations

import pytest

from cutline.config import normalize_config
from cutline.planner import EditPlan, build_edit_plan


def _source(source_id="s1", duration=20.0, has_audio=True, name="take.mp4"):
    return {
        "id": source_id, "name": name, "path": f"/media/{name}",
        "duration": duration, "width": 1080, "height": 1920, "fps": 30.0,
        "has_audio": has_audio, "has_video": True,
    }


def _analysis(segments, duration=20.0):
    return {
        "duration": duration,
        "segments": [{"start": a, "end": b} for a, b in segments],
        "kept_seconds": sum(b - a for a, b in segments),
        "removed_seconds": duration - sum(b - a for a, b in segments),
    }


def test_social_plan_concatenates_kept_segments():
    config = normalize_config({"mode": "social", "aspect": "9:16"}, "social")
    plan = build_edit_plan(
        config, [_source()],
        {"s1": _analysis([(0.0, 3.0), (5.0, 9.0), (12.0, 20.0)])},
        fps=30,
    )
    assert plan.mode == "social"
    assert len(plan.clips) == 3
    assert plan.clips[0].src_in == 0
    assert plan.clips[1].rec_in == plan.clips[0].rec_out
    assert plan.duration_frames == sum(clip.frames for clip in plan.clips)
    assert plan.stats["removed_seconds"] == pytest.approx(5.0, abs=0.2)
    assert plan.width == 1080 and plan.height == 1920


def test_silence_off_keeps_whole_clip():
    config = normalize_config({"mode": "social", "silence": {"enabled": False}}, "social")
    plan = build_edit_plan(config, [_source()], {"s1": _analysis([(0.0, 3.0)])}, fps=30)
    assert len(plan.clips) == 1
    assert plan.clips[0].frames == 600


def test_vlog_builds_title_and_chapter_cards():
    config = normalize_config({
        "mode": "vlog", "aspect": "16:9",
        "vlog": {"title": "The long way north", "location": "Lisbon", "chapter_cards": True},
    }, "vlog")
    sources = [_source("s1", 20, name="lisbon.mp4"), _source("s2", 20, name="coast_road.mp4")]
    plan = build_edit_plan(
        config, sources,
        {"s1": _analysis([(0.0, 18.0)]), "s2": _analysis([(0.0, 18.0)])},
        fps=30,
    )
    assert plan.titles, "a vlog should open with a title card"
    assert plan.titles[0].kind == "title"
    assert plan.titles[0].title == "The long way north"
    assert any(cue.kind == "chapter" for cue in plan.titles)
    assert plan.width == 1920 and plan.height == 1080


def test_transitions_respect_frequency_and_bounds():
    config = normalize_config({
        "mode": "social",
        "transitions": {"enabled": True, "preset": "flash", "frequency": 2, "duration": 0.4, "scope": "cuts"},
    }, "social")
    plan = build_edit_plan(
        config, [_source()],
        {"s1": _analysis([(0.0, 2.0), (3.0, 5.0), (6.0, 8.0), (9.0, 11.0), (12.0, 14.0)])},
        fps=30,
    )
    assert 0 < len(plan.transitions) <= 2
    for cue in plan.transitions:
        assert 0 < cue.start_frame < cue.end_frame <= plan.duration_frames


def test_music_plan_snaps_to_beats():
    config = normalize_config({
        "mode": "music", "fps": 30,
        "music": {"beats_per_cut": 4, "transition_every": 4, "order": "sequence"},
        "transitions": {"enabled": True, "preset": "flash", "scope": "beats", "duration": 0.3},
    }, "music")
    beat = {
        "bpm": 120.0, "detected_bpm": 120.0, "confidence": 0.9, "offset": 0.0,
        "beats": [i * 0.5 for i in range(65)],
    }
    sources = [_source("s1", 18, has_audio=False, name="a.mp4"), _source("s2", 18, has_audio=False, name="b.mp4")]
    plan = build_edit_plan(
        config, sources, {}, fps=30,
        beat=beat, music_path="/media/song.wav", music_duration=30.0,
    )
    assert plan.mode == "music"
    assert plan.duration_frames == 900
    assert plan.music_audio and plan.music_audio["frames"] == 900
    # Most cuts land every 4 beats (2.0 s → 60 frames at 30 fps); a source
    # running dry can add an extra take change inside a bar.
    cuts = plan.cut_frames
    assert cuts
    on_grid = [cut for cut in cuts if cut % 60 == 0]
    assert len(on_grid) >= len(cuts) - 2
    assert plan.transitions
    for cue in plan.transitions:
        assert abs(cue.frame / 30 - round(cue.frame / 30 * 2) / 2) < 0.02


def test_degenerate_music_sources_do_not_crash():
    config = normalize_config({"mode": "music", "music": {"beats_per_cut": 8}}, "music")
    beat = {"bpm": 90.0, "beats": [i * (60 / 90) for i in range(200)], "offset": 0.0, "confidence": 0.4}
    sources = [_source("s1", 0.4, has_audio=False, name="tiny.mp4")]
    plan = build_edit_plan(config, sources, {}, fps=30, beat=beat, music_path=None, music_duration=12.0)
    assert plan.clips
    for clip in plan.clips:
        assert clip.src_out > clip.src_in
        assert clip.rec_out > clip.rec_in


def test_plan_round_trips_through_json():
    config = normalize_config({"mode": "social"}, "social")
    plan = build_edit_plan(config, [_source()], {"s1": _analysis([(0.0, 4.0), (6.0, 9.0)])}, fps=25)
    restored = EditPlan.from_dict(plan.to_dict())
    assert restored.duration_frames == plan.duration_frames
    assert [clip.src_in for clip in restored.clips] == [clip.src_in for clip in plan.clips]
    assert restored.fps == 25
