from __future__ import annotations

import io
import os
import re
import shutil
import subprocess
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageDraw

_CACHE_FFMPEG: str | None = None


class FFmpegError(RuntimeError):
    pass


def ffmpeg_exe() -> str:
    global _CACHE_FFMPEG
    if _CACHE_FFMPEG:
        return _CACHE_FFMPEG
    candidates = []
    if os.environ.get("CUTLINE_FFMPEG"):
        candidates.append(os.environ["CUTLINE_FFMPEG"])
    system = shutil.which("ffmpeg")
    if system:
        candidates.append(system)
    try:
        import imageio_ffmpeg

        candidates.append(imageio_ffmpeg.get_ffmpeg_exe())
    except Exception:
        pass
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            _CACHE_FFMPEG = str(candidate)
            return _CACHE_FFMPEG
    raise FFmpegError(
        "FFmpeg was not found. Install the app with `./install.sh` (it bundles FFmpeg), "
        "or install FFmpeg and add it to PATH."
    )


def ffmpeg_version() -> str:
    try:
        proc = subprocess.run([ffmpeg_exe(), "-version"], capture_output=True, text=True, timeout=15)
        first = (proc.stdout or proc.stderr).splitlines()[0]
        return first.replace("ffmpeg version ", "").split(" Copyright")[0].strip()
    except Exception:
        return "not found"


def _run(args: list[str], timeout: float | None = None, input_bytes: bytes | None = None) -> subprocess.CompletedProcess:
    cmd = [ffmpeg_exe(), "-hide_banner", "-nostdin", *args]
    proc = subprocess.run(cmd, input=input_bytes, capture_output=True, timeout=timeout)
    if proc.returncode != 0:
        detail = (proc.stderr or b"").decode("utf-8", "replace").strip().splitlines()
        tail = "\n".join(detail[-12:]) if detail else "No details were returned."
        raise FFmpegError(f"FFmpeg failed while preparing media.\n{tail}")
    return proc


@dataclass
class MediaInfo:
    path: str
    duration: float
    width: int
    height: int
    fps: float
    has_video: bool
    has_audio: bool
    video_codec: str = ""
    audio_codec: str = ""
    rotation: int = 0
    size: int = 0

    def to_dict(self) -> dict:
        return asdict(self)


_DURATION_RE = re.compile(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)")
_DIMENSIONS_RE = re.compile(r"(?<![\d.])(\d{2,5})x(\d{2,5})(?![\d.])")
_FPS_RE = re.compile(r"([\d.]+)\s+fps")
_ROTATE_RE = re.compile(r"rotate\s*:\s*(-?\d+)")
_VIDEO_CODEC_RE = re.compile(r"Video:\s*([a-zA-Z0-9_\-]+)")
_AUDIO_CODEC_RE = re.compile(r"Audio:\s*([a-zA-Z0-9_\-]+)")


def probe(path: str | Path) -> MediaInfo:
    path = Path(path).expanduser().resolve()
    if not path.exists():
        raise FileNotFoundError(f"Media file not found: {path}")
    cmd = [ffmpeg_exe(), "-hide_banner", "-nostdin", "-i", str(path)]
    proc = subprocess.run(cmd, capture_output=True)
    stderr = (proc.stderr or b"").decode("utf-8", "replace")
    if "Invalid data found" in stderr and not _DURATION_RE.search(stderr):
        raise FFmpegError(f"FFmpeg could not read this file: {path.name}")

    duration = 0.0
    match = _DURATION_RE.search(stderr)
    if match:
        h, m, s = match.groups()
        duration = int(h) * 3600 + int(m) * 60 + float(s)

    has_video = "Video:" in stderr
    has_audio = "Audio:" in stderr
    width = height = 0
    fps = 0.0
    rotation = 0
    video_codec = audio_codec = ""

    for line in stderr.splitlines():
        if "Video:" in line and not video_codec:
            vc = _VIDEO_CODEC_RE.search(line)
            video_codec = vc.group(1) if vc else ""
            dims = _DIMENSIONS_RE.search(line)
            if dims:
                width, height = int(dims.group(1)), int(dims.group(2))
            fm = _FPS_RE.search(line)
            if fm:
                fps = float(fm.group(1))
        if "Audio:" in line and not audio_codec:
            ac = _AUDIO_CODEC_RE.search(line)
            audio_codec = ac.group(1) if ac else ""
        rot = _ROTATE_RE.search(line)
        if rot:
            rotation = int(rot.group(1))

    if rotation in (90, 270, -90):
        width, height = height, width
    if not duration and has_audio and has_video:
        # A malformed header: let FFmpeg try to decode the end for a duration.
        pass
    return MediaInfo(
        path=str(path),
        duration=round(duration, 4),
        width=width,
        height=height,
        fps=round(fps, 4) if fps else 30.0,
        has_video=has_video,
        has_audio=has_audio,
        video_codec=video_codec,
        audio_codec=audio_codec,
        rotation=rotation,
        size=path.stat().st_size,
    )


def extract_audio(src: str | Path, dst: str | Path, sample_rate: int = 16000) -> Path:
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    _run([
        "-y", "-i", str(src), "-vn", "-ac", "1", "-ar", str(sample_rate),
        "-c:a", "pcm_s16le", str(dst),
    ])
    return dst


def decode_pcm(src: str | Path, sample_rate: int = 16000) -> np.ndarray:
    cmd = [
        ffmpeg_exe(), "-hide_banner", "-nostdin", "-v", "error", "-i", str(src),
        "-vn", "-ac", "1", "-ar", str(sample_rate), "-f", "s16le", "pipe:1",
    ]
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0:
        detail = (proc.stderr or b"").decode("utf-8", "replace").strip().splitlines()
        raise FFmpegError("No usable audio track was found in this file.\n" + "\n".join(detail[-6:]))
    if not proc.stdout:
        raise FFmpegError("This file has no audio track to analyse.")
    audio = np.frombuffer(proc.stdout, dtype=np.int16).astype(np.float32) / 32768.0
    return audio


def extract_frame(src: str | Path, at_seconds: float, size: tuple[int, int] | None = None) -> Image.Image:
    filter_args = []
    if size:
        width, height = size
        filter_args = ["-vf", f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}"]
    cmd = [
        ffmpeg_exe(), "-hide_banner", "-nostdin", "-v", "error",
        "-ss", f"{max(0.0, at_seconds):.3f}", "-i", str(src), "-frames:v", "1",
        *filter_args, "-f", "image2pipe", "-vcodec", "png", "pipe:1",
    ]
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0 or not proc.stdout:
        raise FFmpegError("Could not extract a preview frame from this media.")
    return Image.open(io.BytesIO(proc.stdout)).convert("RGBA")


def encode_overlay_frames(
    frames: Iterable[Image.Image],
    dst: str | Path,
    width: int,
    height: int,
    fps: float,
    codec: str = "qtrle",
) -> Path:
    """Encode RGBA frames to a QuickTime movie with an alpha channel.

    QTRLE (Animation) is intra-frame and compresses large transparent areas well.
    ProRes 4444 is kept as a compatibility fallback.
    """
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    codec = codec if codec in ("qtrle", "prores") else "qtrle"

    def command(which: str) -> list[str]:
        base = [
            ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
            "-f", "rawvideo", "-vcodec", "rawvideo", "-s", f"{width}x{height}",
            "-pix_fmt", "rgba", "-r", f"{fps}", "-i", "pipe:0", "-an",
        ]
        if which == "prores":
            return base + [
                "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le",
                "-alpha_bits", "16", "-vendor", "apl0", str(dst),
            ]
        return base + ["-c:v", "qtrle", "-pix_fmt", "argb", str(dst)]

    order = ["prores", "qtrle"] if codec == "prores" else ["qtrle", "prores"]
    last_error: Exception | None = None
    for candidate in order:
        proc = subprocess.Popen(command(candidate), stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        assert proc.stdin is not None
        try:
            for frame in frames:
                if frame.mode != "RGBA":
                    frame = frame.convert("RGBA")
                if frame.size != (width, height):
                    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
                    canvas.paste(frame, ((width - frame.width) // 2, (height - frame.height) // 2))
                    frame = canvas
                proc.stdin.write(frame.tobytes())
            proc.stdin.close()
            stderr = proc.stderr.read() if proc.stderr else b""
            code = proc.wait()
            if code == 0 and dst.exists() and dst.stat().st_size > 0:
                return dst
            last_error = FFmpegError((stderr or b"").decode("utf-8", "replace")[-1200:])
        except BrokenPipeError:
            stderr = proc.stderr.read() if proc.stderr else b""
            last_error = FFmpegError((stderr or b"").decode("utf-8", "replace")[-1200:])
        finally:
            if proc.poll() is None:
                proc.kill()
        dst.unlink(missing_ok=True)
    raise FFmpegError(f"Could not encode an alpha overlay clip. {last_error or ''}")


def transcode_overlay(src: str | Path, dst: str | Path, width: int, height: int, fps: float, max_duration: float) -> Path:
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    _run([
        "-y", "-i", str(src), "-t", f"{max_duration:.3f}", "-an",
        "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color=black@0,fps={fps}",
        "-c:v", "qtrle", "-pix_fmt", "argb", str(dst),
    ])
    return dst


def extract_poster(src: str | Path, at_seconds: float, dst: str | Path, width: int, height: int) -> Path:
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    image = extract_frame(src, at_seconds, (width, height)).convert("RGB")
    image.save(dst, quality=92)
    return dst


def waveform_image(samples: np.ndarray, width: int = 1200, height: int = 160, color: str = "#D8FF3E") -> Image.Image:
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if samples.size == 0:
        return image
    buckets = np.array_split(np.abs(samples), width)
    peaks = np.array([float(np.max(bucket)) if bucket.size else 0.0 for bucket in buckets])
    peak = max(peaks.max(), 1e-6)
    peaks = peaks / peak
    mid = height / 2
    for x, value in enumerate(peaks):
        line = max(1.0, value * height * 0.46)
        alpha = int(150 + 105 * min(1.0, value * 2))
        draw.line((x, mid - line, x, mid + line), fill=color + f"{alpha:02X}", width=1)
    draw.line((0, mid, width, mid), fill=color + "40", width=1)
    return image


def thumbnail(src: str | Path, dst: str | Path, at_seconds: float = 0.4, size: tuple[int, int] = (360, 240)) -> Path:
    image = extract_frame(src, at_seconds, size).convert("RGB")
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    image.save(dst, quality=88)
    return dst


def encode_video_frames(
    frames: Iterable[Image.Image],
    dst: str | Path,
    width: int,
    height: int,
    fps: float,
    crf: int = 16,
) -> Path:
    """Encode opaque RGB frames as an H.264 movie for use as a baked transition."""
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-vcodec", "rawvideo", "-s", f"{width}x{height}",
        "-pix_fmt", "rgb24", "-r", f"{fps}", "-i", "pipe:0", "-an",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf),
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    assert proc.stdin is not None
    try:
        for frame in frames:
            frame = frame.convert("RGB")
            if frame.size != (width, height):
                frame = frame.resize((width, height), Image.Resampling.LANCZOS)
            proc.stdin.write(frame.tobytes())
        proc.stdin.close()
        stderr = proc.stderr.read() if proc.stderr else b""
        code = proc.wait()
        if code != 0 or not dst.exists():
            raise FFmpegError((stderr or b"").decode("utf-8", "replace")[-1200:])
        return dst
    finally:
        if proc.poll() is None:
            proc.kill()
