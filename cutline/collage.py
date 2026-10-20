"""Render the five-tile opening collage used by the Viewfinder vlog look.

Layout mirrors the reference: a full-height left panel, three stacked centre
tiles, and a full-height right panel. The result is an opaque full-frame movie
that sits above the program track, so the cut underneath stays editable while
the collage plays.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

from .ffmpeg import FFmpegError, ffmpeg_exe


def render_collage_movie(
    spec: dict,
    width: int,
    height: int,
    fps: float,
    dst: str | Path,
) -> Path:
    tiles = list(spec.get("tiles") or [])
    if len(tiles) != 5:
        raise ValueError("The collage needs exactly five tiles.")
    frames = int(spec.get("end_frame", 0)) - int(spec.get("start_frame", 0))
    if frames <= 0:
        raise ValueError("The collage has no duration.")
    duration = frames / float(fps)
    # Panels never round away from the frame: the outer columns take the
    # rounded third, the centre column absorbs the remainder.
    cell_w = max(2, int(round(width / 3.0)))
    centre_w = max(2, width - 2 * cell_w)
    cell_h = max(2, int(round(height / 3.0)))
    tall_h = max(2, height)

    cmd: list[str] = [ffmpeg_exe(), "-hide_banner", "-nostdin", "-loglevel", "error", "-y"]
    for tile in tiles:
        start = float(tile.get("start_frame", 0)) / float(fps)
        cmd += ["-ss", f"{start:.6f}", "-t", f"{duration:.6f}", "-i", str(tile["path"])]

    filters = []
    for index in range(5):
        tile_w = centre_w if index in (1, 2, 3) else cell_w
        tile_h = cell_h if index in (1, 2, 3) else tall_h
        filters.append(
            f"[{index}:v]scale={tile_w}:{tile_h}:force_original_aspect_ratio=increase,"
            f"crop={tile_w}:{tile_h},setsar=1,fps={fps},setpts=PTS-STARTPTS[v{index}]"
        )
    layout = f"0_0|{cell_w}_0|{cell_w}_{cell_h}|{cell_w}_{2 * cell_h}|{cell_w + centre_w}_0"
    filters.append(
        f"[v0][v1][v2][v3][v4]xstack=inputs=5:layout={layout}:fill=black:shortest=1[stack]"
    )
    # Belt and braces: odd thirds round unevenly, so pin the exact frame size.
    filters.append(f"[stack]pad={width}:{height}:0:0:black[out]")
    cmd += [
        "-filter_complex", ";".join(filters), "-map", "[out]", "-an",
        "-t", f"{duration:.6f}", "-r", f"{fps}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst),
    ]

    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0 or not dst.exists():
        raise FFmpegError((proc.stderr or b"").decode("utf-8", "replace")[-1400:])
    return dst
