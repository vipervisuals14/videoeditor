from __future__ import annotations

import pytest

from cutline.subtitles import parse_lrc, parse_srt, parse_vtt, write_srt, write_vtt, transcript_text

SRT = """1
00:00:01,000 --> 00:00:03,500
Hello <i>there</i>, this is a test

2
00:00:04,000 --> 00:00:06,250
Second line with <font color="#fff">markup</font>
across two rows.

3
00:00:07,000 --> 00:00:08,000
Done.
"""

VTT = """WEBVTT
Kind: captions

00:01.000 --> 00:03.000
First cue

00:04.500 --> 00:06.000
Second cue
"""

LRC = """[ar:Demo]
[offset:+500]
[00:03.00]First lyric line
[00:07.50][00:12.00]Chorus line
"""


def test_srt_parsing_strips_markup_and_joins_lines():
    cues = parse_srt(SRT)
    assert len(cues) == 3
    assert cues[0]["text"] == "Hello there, this is a test"
    assert cues[1]["text"] == "Second line with markup across two rows."
    assert cues[0]["start"] == pytest.approx(1.0)
    assert cues[0]["end"] == pytest.approx(3.5)


def test_vtt_parsing_handles_short_timestamps():
    cues = parse_vtt(VTT)
    assert [cue["text"] for cue in cues] == ["First cue", "Second cue"]
    assert cues[1]["start"] == pytest.approx(4.5)


def test_lrc_parsing_applies_offset_and_repeats():
    cues = parse_lrc(LRC)
    assert cues[0]["start"] == pytest.approx(3.5)
    assert cues[0]["text"] == "First lyric line"
    assert [cue["start"] for cue in cues] == pytest.approx([3.5, 8.0, 12.5])


@pytest.mark.parametrize("stamp, expected", [
    ("[00:06.5]", 6.5),
    ("[00:06.50]", 6.5),
    ("[00:06.500]", 6.5),
    ("[00:06]", 6.0),
    ("[01:02.25]", 62.25),
])
def test_lrc_fraction_widths_are_milliseconds(stamp, expected):
    cues = parse_lrc(f"{stamp}line")
    assert cues[0]["start"] == pytest.approx(expected)


def test_write_srt_round_trip(tmp_path):
    cues = parse_srt(SRT)
    path = write_srt(cues, tmp_path / "captions.srt")
    again = parse_srt(path.read_text(encoding="utf-8"))
    assert [cue["text"] for cue in again] == [cue["text"] for cue in cues]
    assert again[1]["end"] == pytest.approx(cues[1]["end"], abs=0.001)


def test_write_vtt_has_header(tmp_path):
    path = write_vtt(parse_srt(SRT), tmp_path / "captions.vtt")
    text = path.read_text(encoding="utf-8")
    assert text.startswith("WEBVTT")
    assert "-->" in text


def test_transcript_text_has_timecodes():
    text = transcript_text(parse_srt(SRT))
    assert "[00:00:01] Hello there" in text
