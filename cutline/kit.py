"""Portable test kits: a timeline plus everything it points at, in one zip.

The point is a Resolve import that works on a machine that has never seen this
Cutline install. Media is copied into ``media/`` and the OTIO is rewritten with
relative target URLs, so the kit can be unzipped anywhere.

If a project links large camera originals, the kit falls back to *linked* mode:
the timeline keeps its absolute paths and the zip carries a manifest of what has
to be online instead of copying gigabytes.
"""

from __future__ import annotations

import shutil
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

from opentimelineio import adapters, schema

from .store import ProjectStore

# Copy media only up to this much; beyond it the kit links instead.
COPY_LIMIT_BYTES = 2 * 1024 * 1024 * 1024

_SIDECARS = (
    ("output/captions.srt", "captions.srt"),
    ("output/captions.vtt", "captions.vtt"),
    ("output/transcript.txt", "transcript.txt"),
    ("output/cut_notes.md", "cut_notes.md"),
    ("output/preview.jpg", "preview.jpg"),
    ("output/manifest.json", "manifest.json"),
)


@dataclass
class KitResult:
    folder: Path
    zip_path: Path
    copied: list[str] = field(default_factory=list)
    linked: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)

    @property
    def portable(self) -> bool:
        return not self.linked

    def summary(self) -> dict:
        return {
            "folder": str(self.folder),
            "zip": str(self.zip_path),
            "bytes": self.zip_path.stat().st_size if self.zip_path.exists() else 0,
            "copied": len(self.copied),
            "linked": len(self.linked),
            "missing": self.missing,
            "portable": self.portable,
        }


def _all_clips(timeline: schema.Timeline):
    for track in timeline.tracks:
        for item in track:
            if isinstance(item, schema.Clip):
                yield item


def _target(item: schema.Clip) -> str:
    reference = item.media_reference
    if isinstance(reference, schema.ExternalReference):
        return str(reference.target_url or "")
    return ""


def _unique(name: str, taken: set[str]) -> str:
    stem, suffix = Path(name).stem, Path(name).suffix
    candidate, index = name, 2
    while candidate.lower() in taken:
        candidate = f"{stem}-{index}{suffix}"
        index += 1
    taken.add(candidate.lower())
    return candidate


def _test_readme(project: dict, result: KitResult, timeline_name: str) -> str:
    mode = (project.get("summary") or {}).get("mode_label") or project.get("mode", "cut")
    lines = [
        f"# {project.get('name', 'Cutline cut')} — Resolve test kit",
        "",
        f"A {mode} edit from Cutline, packaged to import on another machine.",
        "",
        "## Import",
        "",
        "1. Unzip this folder anywhere. Keep `timeline.otio` next to the `media/` folder.",
        "2. Open DaVinci Resolve (Free is fine) and create or open a project.",
        "3. **File → Import → Timeline**, choose `timeline.otio`.",
        "4. If Resolve asks, point the media at this folder's `media/` directory.",
        "",
        "## What to look at",
        "",
        "- Tracks, top to bottom, should read: "
        "`V1 Program`, `V2 Transitions`, `V3 Captions`, `V4 Titles`, "
        "`V5 Collage`, `V6 Viewfinder`, `A1 Audio` (only the tracks this cut uses are present).",
        "- The captions/overlays are alpha movies. They should composite with transparency, "
        "not as black boxes.",
        "- Every clip should be trimmable, and the source timecodes in each clip's "
        "Properties should match the original footage.",
        "- Scrubbing the cut should not leave a gap between clips on V1.",
        "",
        "## Files",
        "",
        "- `timeline.otio` — the edit",
        "- `media/` — the exact files the timeline references"
        + (" (all copied, this kit is portable)" if result.portable else " (some files were linked, see below)"),
    ]
    if result.linked:
        lines += [
            "",
            "## Linked media (not copied, too large)",
            "",
            "These files must be online at their original locations:",
        ]
        lines += [f"- `{path}`" for path in result.linked]
    if result.missing:
        lines += ["", "## Missing at pack time", ""]
        lines += [f"- `{path}`" for path in result.missing]
    lines += [
        "",
        "## If the import looks wrong, send back",
        "",
        "- Resolve version, edition (Free/Studio), and OS",
        "- A screenshot of the timeline page right after import",
        "- Anything Resolve printed in the import dialog",
        "",
        "Those three answer almost every import question.",
        "",
    ]
    return "\n".join(lines)


def bundle(store: ProjectStore, project_id: str, dst_dir: str | Path | None = None,
           copy_limit: int = COPY_LIMIT_BYTES) -> KitResult:
    """Write an import-ready folder: timeline plus the media it points at.

    This is the same rewrite ``build_kit`` does, minus the zip. Resolve can open
    the result in place, which is what the in-app import script does.
    """
    project = store.load(project_id)
    folder = store.folder(project_id)
    source_otio = folder / "output" / "timeline.otio"
    if not source_otio.exists():
        raise FileNotFoundError("This project has no timeline yet. Build it first.")

    timeline = adapters.read_from_file(str(source_otio))
    slug = "cutline-test-kit"
    dst_dir = Path(dst_dir) if dst_dir else folder / "kit" / slug
    if dst_dir.exists():
        shutil.rmtree(dst_dir)
    media_dir = dst_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)

    result = KitResult(folder=dst_dir, zip_path=dst_dir.with_suffix(".zip"))

    total = 0
    taken: set[str] = set()
    seen: dict[str, str] = {}
    for clip in _all_clips(timeline):
        target = _target(clip)
        if not target:
            continue
        path = Path(target)
        if target in seen:
            clip.media_reference.target_url = seen[target]
            continue
        if not path.exists():
            result.missing.append(target)
            continue
        size = path.stat().st_size
        if total + size > copy_limit:
            result.linked.append(target)
            continue
        name = _unique(path.name, taken)
        shutil.copy2(path, media_dir / name)
        relative = f"media/{name}"
        seen[target] = relative
        clip.media_reference.target_url = relative
        result.copied.append(name)
        total += size

    kit_otio = dst_dir / "timeline.otio"
    adapters.write_to_file(timeline, str(kit_otio), "otio_json")

    for relative, name in _SIDECARS:
        candidate = folder / relative
        if candidate.exists():
            shutil.copy2(candidate, dst_dir / name)

    (dst_dir / "READ-ME-FIRST.md").write_text(
        _test_readme(project, result, timeline.name or "Cutline edit"), encoding="utf-8"
    )

    return result


def build_kit(store: ProjectStore, project_id: str, dst_dir: str | Path | None = None,
              copy_limit: int = COPY_LIMIT_BYTES) -> KitResult:
    """Package a finished project for a Resolve import on another machine."""
    result = bundle(store, project_id, dst_dir=dst_dir, copy_limit=copy_limit)
    dst_dir = result.folder
    slug = "cutline-test-kit"
    with zipfile.ZipFile(result.zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(dst_dir.rglob("*")):
            if path.is_file():
                archive.write(path, arcname=str(Path(slug) / path.relative_to(dst_dir)))
    return result
