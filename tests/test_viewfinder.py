from __future__ import annotations

import json
import subprocess

import pytest
from opentimelineio import adapters, schema
from PIL import Image, ImageStat

from cutline.collage import render_collage_movie
from cutline.config import normalize_config
from cutline.ffmpeg import ffmpeg_exe, probe
from cutline.hud import _location_lines, render_hud
from cutline.planner import build_edit_plan
from cutline.timeline import build_timeline


def _config(**vlog):
    return normalize_config({"mode": "vlog", "vlog": vlog, "silence": {"enabled": False}}, "vlog")


def _sources(count=2):
    return [
        {
            "id": f"s{index}", "name": f"clip_{index}.mp4", "path": f"/media/clip_{index}.mp4",
            "duration": 20.0, "width": 1920, "height": 1080, "fps": 30.0,
            "has_audio": True, "has_video": True,
        }
        for index in range(count)
    ]


def test_viewfinder_turns_on_collage_and_hud():
    config = _config(look="viewfinder", location="Honolulu, Hawaii")
    plan = build_edit_plan(config, _sources(), {}, fps=30)
    assert plan.hud == {"location": "Honolulu, Hawaii", "label": "REC", "grid": True}
    assert plan.collage is not None
    assert len(plan.collage["tiles"]) == 5
    assert plan.collage["end_frame"] > 0
    assert plan.titles == []


def test_viewfinder_switches_can_be_turned_off():
    config = _config(look="viewfinder", collage=False, hud=False)
    plan = build_edit_plan(config, _sources(), {}, fps=30)
    assert plan.hud is None
    assert plan.collage is None


def test_journal_look_keeps_title_cards_and_no_overlays():
    config = _config(look="journal", title="The long way north", location="Lisbon")
    plan = build_edit_plan(config, _sources(), {}, fps=30)
    assert plan.hud is None and plan.collage is None
    assert plan.titles and plan.titles[0].kind == "title"


def test_hud_grid_and_type_render_at_every_aspect():
    for width, height in ((1080, 1920), (1920, 1080), (1080, 1080), (1080, 1350)):
        hud = render_hud(width, height, {"grid": True, "location": "Honolulu, Hawaii"})
        assert hud.size == (width, height)
        assert hud.mode == "RGBA"
        alpha = hud.getchannel("A")
        coverage = ImageStat.Stat(alpha).sum[0] / 255
        # Grid lines and type are both drawn, and the frame stays mostly clear.
        assert 0 < coverage < width * height * 0.35


def test_location_splits_into_two_stacked_lines():
    assert _location_lines("Honolulu, Hawaii") == ["HONOLULU", "HAWAII"]
    assert _location_lines("Lisbon, Portugal") == ["LISBON", "PORTUGAL"]
    assert _location_lines("Iceland") == ["ICELAND"]
    assert _location_lines("Toronto to Vancouver") == ["TORONTO TO", "VANCOUVER"]
    assert _location_lines("") == []


def test_timeline_stacks_collage_above_hud_above_cut(tmp_path):
    config = _config(look="viewfinder")
    plan = build_edit_plan(config, _sources(), {}, fps=30)
    stub = tmp_path / "stub.mov"
    stub.write_bytes(b"stub")
    timeline = build_timeline(
        plan, config,
        collage_clips=[{"name": "Collage intro", "path": str(stub), "start": 0, "end": 120}],
        graphics_clips=[{"name": "Viewfinder HUD", "path": str(stub), "start": 0, "end": plan.duration_frames}],
        name="Viewfinder",
    )
    names = [track.name for track in timeline.tracks]
    assert names[0].startswith("A1")
    assert names[1].startswith("V1")
    assert names[-2].startswith("V5")
    assert names[-1].startswith("V6")
    assert timeline.tracks[-1].name == "V6 — Viewfinder"
    assert isinstance(timeline.tracks[-1][0], schema.Clip)


@pytest.fixture(scope="module")
def media(tmp_path_factory):
    folder = tmp_path_factory.mktemp("collage")
    clips = []
    for index in range(5):
        clip = folder / f"clip_{index}.mp4"
        proc = subprocess.run([
            ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
            "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=30:duration=3",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-pix_fmt", "yuv420p", str(clip),
        ], capture_output=True)
        assert proc.returncode == 0, proc.stderr.decode()[-500:]
        clips.append(clip)
    return clips


def test_collage_movie_is_five_tiles_of_the_right_size(media, tmp_path):
    tiles = [{"path": str(path), "start_frame": 0, "frames": 30} for path in media]
    dst = tmp_path / "collage.mp4"
    render_collage_movie({"start_frame": 0, "end_frame": 30, "tiles": tiles}, 640, 360, 30, dst)
    assert dst.exists() and dst.stat().st_size > 1000
    info = probe(dst)
    assert (info.width, info.height) == (640, 360)
    assert info.duration == pytest.approx(1.0, abs=0.12)
    assert info.has_video and not info.has_audio


def test_viewfinder_build_writes_the_two_overlay_tracks(tmp_path, media):
    """Full pipeline: the HUD and collage land as real media on V5/V6."""
    from cutline.pipeline import run_build
    from cutline.store import ProjectStore

    data = tmp_path / "data"
    store = ProjectStore(data)
    config = _config(look="viewfinder", location="Honolulu, Hawaii")
    project = store.create(
        config,
        [
            {"id": "s01", "path": str(media[0]), "name": "clip_0.mp4", "duration": 3.0,
             "width": 320, "height": 180, "fps": 30.0, "has_audio": False, "has_video": True},
            {"id": "s02", "path": str(media[1]), "name": "clip_1.mp4", "duration": 3.0,
             "width": 320, "height": 180, "fps": 30.0, "has_audio": False, "has_video": True},
        ],
        name="Viewfinder build",
    )
    run_build(store, project["id"])
    folder = store.folder(project["id"]) / "output"

    timeline = adapters.read_from_file(str(folder / "timeline.otio"))
    names = [track.name for track in timeline.tracks]
    assert names[-2] == "V5 — Collage" and len(timeline.tracks[-2]) == 1
    assert names[-1] == "V6 — Viewfinder" and len(timeline.tracks[-1]) == 1

    graphics = folder / "media" / "graphics"
    assert (graphics / "hud.mov").exists()
    assert (graphics / "collage_intro.mp4").exists()
    assert Image.open(folder / "preview.jpg").size == (1920, 1080)

    summary = json.loads((folder / "manifest.json").read_text())["summary"]
    assert summary["mode"] == "vlog"
    assert not summary["titles"]
