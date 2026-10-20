from __future__ import annotations

import html
import re
from pathlib import Path

_TAG_RE = re.compile(r"<[^>]+>")
_ASS_RE = re.compile(r"\{\\[^}]+\}")
_SRT_TIME_RE = re.compile(
    r"(?P<h>\d{1,2}):(?P<m>\d{2}):(?P<s>\d{2})[,.](?P<ms>\d{1,3})\s*-->\s*(?P<h2>\d{1,2}):(?P<m2>\d{2}):(?P<s2>\d{2})[,.](?P<ms2>\d{1,3})"
)
_VTT_SHORT_RE = re.compile(
    r"(?P<m>\d{2}):(?P<s>\d{2})\.(?P<ms>\d{3})\s*-->\s*(?P<m2>\d{2}):(?P<s2>\d{2})\.(?P<ms2>\d{3})"
)
_LRC_TIME_RE = re.compile(r"\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]")


def _clean(text: str) -> str:
    text = _ASS_RE.sub("", text)
    text = _TAG_RE.sub("", text)
    text = html.unescape(text)
    text = text.replace("\u200b", "").replace("\ufeff", "")
    return " ".join(text.split()).strip()


def _parse_srt_time(match: re.Match) -> tuple[float, float]:
    def one(h, m, s, ms):
        ms = (ms + "00")[:3] if len(ms) < 3 else ms[:3]
        return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0

    return (
        one(match.group("h"), match.group("m"), match.group("s"), match.group("ms")),
        one(match.group("h2"), match.group("m2"), match.group("s2"), match.group("ms2")),
    )


def _parse_vtt_short(match: re.Match) -> tuple[float, float]:
    return (
        int(match.group("m")) * 60 + int(match.group("s")) + int(match.group("ms")) / 1000.0,
        int(match.group("m2")) * 60 + int(match.group("s2")) + int(match.group("ms2")) / 1000.0,
    )


def _clean_cues(cues: list[dict]) -> list[dict]:
    cleaned = []
    for cue in cues:
        text = _clean(str(cue.get("text", "")))
        try:
            start = max(0.0, float(cue["start"]))
            end = max(start + 0.08, float(cue["end"]))
        except (TypeError, ValueError):
            continue
        if text:
            cleaned.append({"start": round(start, 3), "end": round(end, 3), "text": text})
    cleaned.sort(key=lambda c: c["start"])
    return cleaned


def parse_srt(content: str) -> list[dict]:
    content = content.replace("\r\n", "\n").replace("\r", "\n").strip()
    blocks = re.split(r"\n{2,}", content)
    cues: list[dict] = []
    for block in blocks:
        lines = [line for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        time_line = next((line for line in lines if "-->" in line), None)
        if not time_line:
            continue
        match = _SRT_TIME_RE.search(time_line)
        if not match:
            continue
        start, end = _parse_srt_time(match)
        text_start = lines.index(time_line) + 1
        text = "\n".join(lines[text_start:])
        cues.append({"start": start, "end": end, "text": text})
    return _clean_cues(cues)


def parse_vtt(content: str) -> list[dict]:
    content = content.replace("\r\n", "\n").replace("\r", "\n").strip()
    content = re.sub(r"^WEBVTT[^\n]*\n?", "", content, flags=re.IGNORECASE)
    blocks = re.split(r"\n{2,}", content)
    cues: list[dict] = []
    for block in blocks:
        lines = [line for line in block.splitlines() if line.strip() and not line.startswith(("NOTE", "STYLE", "REGION"))]
        if not lines:
            continue
        time_line = next((line for line in lines if "-->" in line), None)
        if not time_line:
            continue
        match = _SRT_TIME_RE.search(time_line)
        if match:
            start, end = _parse_srt_time(match)
        else:
            match = _VTT_SHORT_RE.search(time_line)
            if not match:
                continue
            start, end = _parse_vtt_short(match)
        text_start = lines.index(time_line) + 1
        cues.append({"start": start, "end": end, "text": "\n".join(lines[text_start:])})
    return _clean_cues(cues)


def parse_lrc(content: str) -> list[dict]:
    offset_ms = 0
    raw: list[tuple[float, str]] = []
    for line in content.replace("\r\n", "\n").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.lower().startswith("[offset:"):
            try:
                offset_ms = int(re.search(r"-?\d+", stripped).group(0))
            except Exception:
                offset_ms = 0
            continue
        times = _LRC_TIME_RE.findall(stripped)
        if not times:
            continue
        text = _LRC_TIME_RE.sub("", stripped).strip()
        if not text:
            continue
        for minutes, seconds, fraction in times:
            # LRC fractions are decimal parts of a second at any width: ".5" is
            # 500 ms, ".50" is 500 ms, ".500" is 500 ms — pad right, never scale.
            ms = int((fraction + "000")[:3]) if fraction else 0
            at = max(0.0, int(minutes) * 60 + int(seconds) + ms / 1000.0 + offset_ms / 1000.0)
            raw.append((at, text))
    raw.sort(key=lambda item: item[0])
    cues: list[dict] = []
    for index, (start, text) in enumerate(raw):
        next_start = raw[index + 1][0] if index + 1 < len(raw) else start + max(2.4, len(text) * 0.075)
        end = max(start + 0.5, min(next_start - 0.05, start + 8.0))
        cues.append({"start": start, "end": end, "text": text})
    return _clean_cues(cues)


def parse_subtitle_file(path: str | Path) -> dict:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Caption file not found: {path}")
    content = _read_text(path)
    suffix = path.suffix.lower()
    if suffix == ".vtt":
        cues, fmt = parse_vtt(content), "vtt"
    elif suffix == ".lrc":
        cues, fmt = parse_lrc(content), "lrc"
    else:
        cues = parse_srt(content)
        fmt = "srt"
        if not cues:
            cues, fmt = parse_vtt(content), "vtt"
        if not cues:
            cues, fmt = parse_lrc(content), "lrc"
    if not cues:
        raise ValueError(
            "No timed captions were found. Upload a standard .srt, .vtt, or .lrc file."
        )
    return {"cues": cues, "format": fmt, "path": str(path), "count": len(cues)}


def parse_subtitle_text(content: str) -> list[dict]:
    for parser in (parse_srt, parse_vtt, parse_lrc):
        cues = parser(content)
        if cues:
            return cues
    return []


def _read_text(path: Path) -> str:
    data = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", "replace")


def _stamp_srt(seconds: float) -> str:
    seconds = max(0.0, float(seconds))
    ms = int(round(seconds * 1000))
    h, rem = divmod(ms, 3600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _stamp_vtt(seconds: float) -> str:
    return _stamp_srt(seconds).replace(",", ".")


def write_srt(cues: list[dict], dst: str | Path) -> Path:
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    blocks = []
    for index, cue in enumerate(cues, start=1):
        text = str(cue.get("text", "")).strip()
        if not text:
            continue
        blocks.append(f"{index}\n{_stamp_srt(cue['start'])} --> {_stamp_srt(cue['end'])}\n{text}\n")
    dst.write_text("\n".join(blocks), encoding="utf-8")
    return dst


def write_vtt(cues: list[dict], dst: str | Path) -> Path:
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    blocks = ["WEBVTT", ""]
    for cue in cues:
        text = str(cue.get("text", "")).strip()
        if not text:
            continue
        blocks.append(f"{_stamp_vtt(cue['start'])} --> {_stamp_vtt(cue['end'])}\n{text}\n")
    dst.write_text("\n".join(blocks), encoding="utf-8")
    return dst


def transcript_text(cues: list[dict]) -> str:
    lines = []
    for cue in cues:
        text = str(cue.get("text", "")).strip()
        if not text:
            continue
        lines.append(f"[{_stamp_srt(cue['start'])[:8]}] {text}")
    return "\n".join(lines) + ("\n" if lines else "")
