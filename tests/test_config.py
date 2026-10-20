from __future__ import annotations

from cutline.captioning import cues_to_public
from cutline.config import mode_defaults, normalize_config, output_dimensions


def test_mode_defaults_are_sane():
    social = mode_defaults("social")
    assert social["aspect"] == "9:16"
    assert social["silence"]["pacing"] == "balanced"
    assert social["captions"]["preset"] == "creator"
    music = mode_defaults("music")
    assert music["transitions"]["scope"] == "beats"
    assert music["silence"]["enabled"] is False
    vlog = mode_defaults("vlog")
    assert vlog["aspect"] == "16:9"
    assert vlog["captions"]["preset"] == "journal"


def test_normalize_clamps_bad_values():
    cfg = normalize_config({
        "mode": "vlog",
        "aspect": "3:7",
        "fps": 999,
        "silence": {"pacing": "insane", "padding": 12},
        "transitions": {"duration": 99, "intensity": -5, "frequency": 900},
        "captions": {"quality": "nonsense", "style": {"size": 9000}},
    }, "vlog")
    assert cfg["mode"] == "vlog"
    assert cfg["aspect"] == "16:9"
    assert cfg["fps"] <= 60
    assert cfg["silence"]["pacing"] == "gentle"
    assert cfg["silence"]["padding"] <= 1.0
    assert cfg["transitions"]["duration"] <= 2.0
    assert cfg["transitions"]["intensity"] >= 0.05
    assert cfg["transitions"]["frequency"] <= 64
    assert cfg["captions"]["quality"] == "balanced"
    assert cfg["captions"]["style"]["size"] <= 150


def test_captions_none_switches_captions_off():
    cfg = normalize_config({"captions": {"source": "none"}}, "social")
    assert cfg["captions"]["enabled"] is False


def test_resolution_output_dimensions():
    cfg = normalize_config({"aspect": "9:16", "output": {"resolution": "1080"}}, "social")
    assert output_dimensions(cfg) == (1080, 1920)
    cfg = normalize_config({"aspect": "16:9", "output": {"resolution": "720"}}, "vlog")
    assert output_dimensions(cfg) == (1280, 720)


def test_cues_to_public_strips_words():
    public = cues_to_public([{"id": "c1", "start": 0.4, "end": 1.2, "text": "hi", "words": [{"word": "hi"}]}])
    assert public == [{"id": "c1", "start": 0.4, "end": 1.2, "text": "hi"}]
