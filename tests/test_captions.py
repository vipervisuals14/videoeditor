from __future__ import annotations

import pytest

from cutline.captions import render_caption_frame, words_for_cue
from cutline.captioning import apply_edits, build_cues, tokens_from_source_cues, tokens_from_timeline_cues
from cutline.planner import EditPlan, PlannedClip
from cutline.styles import get_preset, normalize_style


def test_words_are_spread_when_no_word_timings_exist():
    cue = {"start": 1.0, "end": 2.0, "text": "two words"}
    words = words_for_cue(cue)
    assert [word["word"] for word in words] == ["two", "words"]
    assert words[0]["start"] == pytest.approx(1.0)
    assert words[-1]["end"] == pytest.approx(2.0, abs=0.05)


def test_cues_respect_style_limits():
    style = get_preset("creator")
    tokens = tokens_from_timeline_cues([
        {"start": 0.0, "end": 4.0, "text": "This is a long line that should be split into several caption cards"}
    ])
    cues = build_cues(tokens, style)
    assert len(cues) >= 3
    for cue in cues:
        assert len(cue["words"]) <= style["max_words"]
        assert len(cue["text"]) <= style["max_chars"]
        assert cue["end"] > cue["start"]


def test_cues_never_overlap():
    style = get_preset("clean")
    tokens = tokens_from_timeline_cues([
        {"start": 0.0, "end": 1.2, "text": "one two three"},
        {"start": 1.0, "end": 2.4, "text": "four five six"},
    ])
    cues = build_cues(tokens, style)
    for left, right in zip(cues, cues[1:]):
        assert left["end"] <= right["start"] + 0.001


def test_source_timing_follows_silence_cuts():
    plan = EditPlan(mode="social", fps=30, width=1080, height=1920, duration_frames=120)
    plan.clips = [
        PlannedClip("s1", "a.mp4", "/a.mp4", 0, 60, 0, 60),
        PlannedClip("s1", "a.mp4", "/a.mp4", 120, 180, 60, 120),
    ]
    plan.source_map = {"s1": [
        {"src_in": 0, "src_out": 60, "rec_in": 0, "rec_out": 60},
        {"src_in": 120, "src_out": 180, "rec_in": 60, "rec_out": 120},
    ]}
    cues = [{"start": 2.0, "end": 2.6, "text": "in the second segment"}]
    tokens = tokens_from_source_cues(cues, plan, "s1")
    assert tokens[0]["start"] == pytest.approx(2.0)  # 2s source == 2s timeline here
    cues_late = [{"start": 3.0, "end": 3.4, "text": "inside the removed gap"}]
    tokens_late = tokens_from_source_cues(cues_late, plan, "s1")
    # 3.0s of source sits in the removed gap → snaps to the next segment start (2s).
    assert tokens_late[0]["start"] == pytest.approx(2.0)


def test_apply_edits_rebuilds_words_and_respects_duration():
    style = get_preset("creator")
    original = build_cues(tokens_from_timeline_cues([
        {"start": 0.0, "end": 3.0, "text": "the original line of words"}
    ]), style)
    edits = [
        {"start": 0.0, "end": 1.5, "text": "the fixed line"},
        {"start": 1.6, "end": 9.0, "text": "clamped to the end"},
        {"start": 2.0, "end": 2.0, "text": "   "},
    ]
    cues = apply_edits(original, edits, duration=4.0)
    assert [cue["text"] for cue in cues] == ["the fixed line", "clamped to the end"]
    assert cues[1]["end"] == pytest.approx(4.0)
    assert cues[0]["end"] > cues[0]["start"]


def test_caption_frame_is_transparent_and_contains_type():
    style = normalize_style({}, "creator")
    cue = {"start": 0.0, "end": 2.0, "text": "stop scrolling", "words": [
        {"word": "stop", "start": 0.0, "end": 0.8},
        {"word": "scrolling", "start": 0.8, "end": 2.0},
    ]}
    frame = render_caption_frame(cue, style, 540, 960, 1.0)
    assert frame.size == (540, 960)
    alpha = frame.getchannel("A")
    assert alpha.getextrema()[1] == 255
    bbox = alpha.getbbox()
    assert bbox is not None
    # Captions sit in the lower third for the vertical creator style.
    assert bbox[1] > 960 * 0.55


def test_unknown_style_values_are_sanitised():
    style = normalize_style({"size": 9999, "color": "not-a-colour", "position": "moon"}, "creator")
    assert style["size"] <= 150
    assert style["color"] == "#FFFFFF"
    assert style["position"] == "bottom"


def test_title_text_falls_back_for_glyphs_the_fonts_lack():
    from cutline.captions import _display_text

    assert _display_text("Toronto ⇄ Lisbon") == "Toronto <-> Lisbon"
    assert _display_text("A → B ★") == "A -> B *"
    assert _display_text("The long way north") == "The long way north"
