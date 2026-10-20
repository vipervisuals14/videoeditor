from __future__ import annotations

import re
from typing import Iterable

from .captions import split_words, words_for_cue
from .planner import EditPlan

_PUNCT_HARD = re.compile(r"[.!?…]$")
_PUNCT_SOFT = re.compile(r"[,;:]$")


def _map_one(plan: EditPlan, source_id: str, seconds: float) -> float:
    segments = plan.source_map.get(source_id) or []
    if not segments:
        return max(0.0, seconds)
    fps = plan.fps
    t = max(0.0, float(seconds))
    best_before = None
    for seg in segments:
        start = seg["src_in"] / fps
        end = seg["src_out"] / fps
        if start <= t <= end:
            return (seg["rec_in"] / fps) + (t - start)
        if end < t:
            best_before = seg
        if start > t:
            return seg["rec_in"] / fps
    if best_before:
        return best_before["rec_out"] / fps
    return 0.0


def _map_word(plan: EditPlan, source_id: str, word: dict) -> dict:
    start = _map_one(plan, source_id, float(word.get("start", 0)))
    end = _map_one(plan, source_id, float(word.get("end", word.get("start", 0))))
    if end < start:
        end = start
    return {
        "word": str(word.get("word", "")).strip(),
        "start": round(start, 4),
        "end": round(end, 4),
        "cue_id": word.get("cue_id"),
    }


def tokens_from_transcripts(transcripts: dict[str, dict], plan: EditPlan) -> list[dict]:
    tokens: list[dict] = []
    for source_id, data in transcripts.items():
        for seg_index, segment in enumerate(data.get("segments", [])):
            cue_id = f"{source_id}:{seg_index}"
            for word in segment.get("words") or []:
                if not str(word.get("word", "")).strip():
                    continue
                token = _map_word(plan, source_id, {**word, "cue_id": cue_id})
                if token["word"]:
                    tokens.append(token)
    return _clean_tokens(tokens, plan)


def tokens_from_source_cues(cues: list[dict], plan: EditPlan, source_id: str) -> list[dict]:
    tokens: list[dict] = []
    for cue_index, cue in enumerate(cues):
        words = words_for_cue({
            "start": cue["start"], "end": cue["end"], "text": cue.get("text", ""),
            "words": cue.get("words") or [],
        })
        cue_id = f"srt:{cue_index}"
        for word in words:
            token = _map_word(plan, source_id, {**word, "cue_id": cue_id})
            if token["word"]:
                tokens.append(token)
    return _clean_tokens(tokens, plan)


def tokens_from_timeline_cues(cues: list[dict]) -> list[dict]:
    tokens: list[dict] = []
    for cue_index, cue in enumerate(cues):
        words = words_for_cue({
            "start": cue["start"], "end": cue["end"], "text": cue.get("text", ""),
            "words": cue.get("words") or [],
        })
        cue_id = f"lyric:{cue_index}"
        for word in words:
            tokens.append({
                "word": str(word["word"]).strip(),
                "start": round(float(word["start"]), 4),
                "end": round(float(word["end"]), 4),
                "cue_id": cue_id,
            })
    return _clean_tokens(tokens, None)


def _clean_tokens(tokens: Iterable[dict], plan: EditPlan | None) -> list[dict]:
    cleaned: list[dict] = []
    for token in tokens:
        word = str(token.get("word", "")).strip()
        if not word:
            continue
        try:
            start = max(0.0, float(token.get("start", 0)))
            end = max(start + 0.02, float(token.get("end", start + 0.12)))
        except (TypeError, ValueError):
            continue
        if plan and start >= plan.duration + 0.2:
            continue
        if plan:
            end = min(end, plan.duration)
            start = min(start, max(0.0, plan.duration - 0.02))
        cleaned.append({"word": word, "start": round(start, 4), "end": round(end, 4), "cue_id": token.get("cue_id")})
    cleaned.sort(key=lambda item: (item["start"], item["end"]))
    return cleaned


def build_cues(tokens: list[dict], style: dict, plan: EditPlan | None = None) -> list[dict]:
    if not tokens:
        return []
    max_words = max(1, int(style.get("max_words", 3)))
    max_chars = max(8, int(style.get("max_chars", 22)))
    max_duration = max(0.55, float(style.get("max_duration", 2.6)))
    cues: list[dict] = []
    current: list[dict] = []
    cue_count = 0

    def flush() -> None:
        nonlocal current, cue_count
        if not current:
            return
        text = " ".join(word["word"] for word in current).strip()
        if not text:
            current = []
            return
        start = current[0]["start"]
        end = max(start + 0.18, current[-1]["end"])
        cues.append({
            "id": f"c{cue_count + 1:04d}",
            "start": round(start, 4),
            "end": round(end, 4),
            "text": text,
            "words": [
                {"word": word["word"], "start": word["start"], "end": word["end"]}
                for word in current
            ],
        })
        cue_count += 1
        current = []

    for token in tokens:
        if not token["word"]:
            continue
        if current:
            previous = current[-1]
            projected = " ".join([word["word"] for word in current] + [token["word"]])
            gap = token["start"] - previous["end"]
            duration = token["end"] - current[0]["start"]
            hard_break = (
                token.get("cue_id") != previous.get("cue_id")
                or gap > 0.75
                or len(current) >= max_words
                or len(projected) > max_chars
                or duration > max_duration
            )
            if hard_break:
                flush()
        current.append(token)
        if _PUNCT_HARD.search(token["word"]) and len(current) >= 2:
            flush()

    flush()

    # Keep cues from overlapping on the same OTIO track.
    for index in range(len(cues) - 1):
        next_start = cues[index + 1]["start"]
        if cues[index]["end"] > next_start - 0.005:
            cues[index]["end"] = max(cues[index]["start"] + 0.08, next_start - 0.04)
            cues[index]["words"] = [
                word for word in cues[index]["words"] if word["start"] < cues[index]["end"]
            ] or cues[index]["words"]
    if plan:
        for cue in cues:
            cue["end"] = min(cue["end"], plan.duration)
    return [cue for cue in cues if cue["end"] - cue["start"] >= 0.06 and cue["words"]]


def cues_to_public(cues: list[dict]) -> list[dict]:
    return [
        {
            "id": cue.get("id", ""),
            "start": round(float(cue["start"]), 3),
            "end": round(float(cue["end"]), 3),
            "text": str(cue.get("text", "")),
        }
        for cue in cues
    ]


def apply_edits(original: list[dict], edits: list[dict], duration: float) -> list[dict]:
    """Rebuild words for manually edited captions, keeping valid timings."""
    out: list[dict] = []
    for index, item in enumerate(edits):
        text = " ".join(str(item.get("text", "")).split())
        if not text:
            continue
        try:
            start = max(0.0, float(item.get("start", 0)))
            end = min(float(duration), float(item.get("end", start + 1)))
        except (TypeError, ValueError):
            continue
        if end <= start:
            end = min(duration, start + 0.4)
        if end - start < 0.04:
            continue
        if index < len(original) and original[index].get("text", "").strip() == text:
            words = original[index].get("words") or []
            if words:
                # Retiming unchanged text: distribute the original words over the new span.
                words = _even_words(text, start, end)
            else:
                words = _even_words(text, start, end)
        else:
            words = _even_words(text, start, end)
        out.append({
            "id": f"c{index + 1:04d}",
            "start": round(start, 3),
            "end": round(end, 3),
            "text": text,
            "words": words,
        })
    out.sort(key=lambda cue: cue["start"])
    # Resolve accidental overlaps.
    for index in range(len(out) - 1):
        if out[index]["end"] > out[index + 1]["start"] - 0.01:
            out[index]["end"] = max(out[index]["start"] + 0.08, out[index + 1]["start"] - 0.03)
            out[index]["words"] = [w for w in out[index]["words"] if w["start"] < out[index]["end"]] or out[index]["words"]
    return out


def _even_words(text: str, start: float, end: float) -> list[dict]:
    words = split_words(text)
    if not words:
        return []
    weights = [max(1, len(re.sub(r"\W", "", word))) for word in words]
    total = sum(weights)
    span = max(0.1, end - start)
    cursor = start
    out = []
    for word, weight in zip(words, weights):
        length = span * weight / total
        out.append({
            "word": word,
            "start": round(cursor, 3),
            "end": round(cursor + length, 3),
        })
        cursor += length
    return out
