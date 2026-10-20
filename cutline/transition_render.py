from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image

from .ffmpeg import encode_video_frames, ffmpeg_exe
from .planner import EditPlan, PlannedClip, TransitionCue
from .transitions import GENERATORS


def _fit_window(plan: EditPlan, cue: TransitionCue) -> tuple[int, int, PlannedClip, PlannedClip] | None:
    clips = plan.clips
    left_index = None
    for index, clip in enumerate(clips):
        if clip.rec_in < cue.frame <= clip.rec_out:
            left_index = index
            break
    if left_index is None or left_index + 1 >= len(clips):
        return None
    left = clips[left_index]
    right = clips[left_index + 1]
    half_before = max(1, cue.frame - cue.start_frame)
    half_after = max(1, cue.end_frame - cue.frame)
    half_before = min(half_before, left.frames)
    half_after = min(half_after, right.frames)
    if half_before < 1 or half_after < 1:
        return None
    start = cue.frame - half_before
    end = cue.frame + half_after
    if end <= start:
        return None
    return start, end, left, right


def _extract_sequence(
    source: str,
    start_seconds: float,
    count: int,
    width: int,
    height: int,
    fps: float,
    folder: Path,
    tag: str,
) -> list[Path]:
    folder.mkdir(parents=True, exist_ok=True)
    for old in folder.glob(f"{tag}_*.png"):
        old.unlink(missing_ok=True)
    pattern = folder / f"{tag}_%04d.png"
    vf = (
        f"scale={width}:{height}:force_original_aspect_ratio=increase,"
        f"crop={width}:{height},setsar=1,fps={fps}"
    )
    cmd = [
        ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
        "-ss", f"{max(0.0, start_seconds):.4f}", "-i", source,
        "-frames:v", str(max(1, int(count))), "-vf", vf, "-start_number", "0", str(pattern),
    ]
    proc = subprocess.run(cmd, capture_output=True)
    files = sorted(folder.glob(f"{tag}_*.png"))
    if proc.returncode != 0 and not files:
        raise RuntimeError((proc.stderr or b"").decode("utf-8", "replace")[-800:])
    if not files:
        raise RuntimeError("No picture frames could be extracted for a transition.")
    while len(files) < count:
        files.append(files[-1])
    return files[:count]


def render_transition_clip(
    cue: TransitionCue,
    plan: EditPlan,
    width: int,
    height: int,
    fps: float,
    dst: str | Path,
    work_dir: str | Path,
) -> tuple[Path, int, int] | None:
    fitted = _fit_window(plan, cue)
    if not fitted:
        return None
    start, end, left, right = fitted
    count = end - start
    if count < 2:
        return None
    half_before = cue.frame - start
    half_after = end - cue.frame
    if half_before < 1 or half_after < 1:
        return None
    work = Path(work_dir)
    work.mkdir(parents=True, exist_ok=True)

    left_start = max(0.0, (left.src_out - half_before) / fps)
    right_start = max(0.0, right.src_in / fps)
    left_files = _extract_sequence(left.source_path, left_start, half_before, width, height, fps, work, "left")
    right_files = _extract_sequence(right.source_path, right_start, half_after, width, height, fps, work, "right")

    preset = cue.preset if cue.preset in GENERATORS else "light_leak"
    generator = GENERATORS[preset]
    rng = np.random.default_rng(abs(hash((preset, cue.frame, width, height))) % (2**32))
    low_w = min(width, 540 if width > height else 360)
    low_h = max(2, int(low_w * height / width))

    def frames() -> Iterable[Image.Image]:
        for index in range(count):
            u = index / max(1, count - 1)
            source_path = left_files[index] if index < half_before else right_files[index - half_before]
            base = Image.open(source_path).convert("RGBA")
            if index >= half_before and index - half_before == 0 and half_before > 0:
                # Do a two-frame softening at the join so the source switch is invisible.
                pass
            effect = generator(low_w, low_h, u, cue.intensity, rng)
            if effect.size != (width, height):
                effect = effect.resize((width, height), Image.Resampling.LANCZOS)
            yield Image.alpha_composite(base, effect).convert("RGB")

    dst = Path(dst)
    encode_video_frames(frames(), dst, width, height, fps)
    return dst, start, end


def render_custom_overlay(src: str, dst: str | Path, width: int, height: int, fps: float, duration: float) -> Path:
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    vf = (
        f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
        f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color=black@0,fps={fps}"
    )
    cmd = [
        ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y",
        "-stream_loop", "-1", "-i", src, "-t", f"{max(0.12, duration):.3f}", "-an",
        "-vf", vf, "-c:v", "qtrle", "-pix_fmt", "argb", str(dst),
    ]
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or b"").decode("utf-8", "replace")[-800:])
    return dst
