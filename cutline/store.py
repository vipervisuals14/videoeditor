from __future__ import annotations

import json
import os
import re
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .settings import PROJECTS_DIR

_LOCK = threading.RLock()
_ID_RE = re.compile(r"^[a-f0-9]{10,32}$")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def safe_filename(name: str, fallback: str = "media") -> str:
    stem = Path(name).stem
    suffix = Path(name).suffix.lower()
    stem = re.sub(r"[^A-Za-z0-9._ -]+", "", stem).strip(" .")
    stem = re.sub(r"\s+", " ", stem)[:80] or fallback
    if suffix and not re.fullmatch(r"\.[a-z0-9]{1,6}", suffix):
        suffix = ""
    return stem + suffix


def new_id() -> str:
    return uuid.uuid4().hex[:14]


def _atomic_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(temp, path)


class ProjectStore:
    def __init__(self, root: Path = PROJECTS_DIR):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def folder(self, project_id: str) -> Path:
        if not _ID_RE.match(project_id or ""):
            raise ValueError("Invalid project id.")
        return self.root / project_id

    def exists(self, project_id: str) -> bool:
        try:
            return (self.folder(project_id) / "project.json").exists()
        except ValueError:
            return False

    def create(
        self,
        config: dict,
        sources: list[dict],
        name: str | None = None,
        srt_path: str | None = None,
        music_path: str | None = None,
        custom_transition_path: str | None = None,
    ) -> dict:
        project_id = new_id()
        folder = self.root / project_id
        for sub in ("uploads", "analysis", "output", "work", "output/media/captions", "output/media/transitions", "output/media/titles"):
            (folder / sub).mkdir(parents=True, exist_ok=True)
        created = now_iso()
        project = {
            "id": project_id,
            "name": name or config.get("name") or "Untitled cut",
            "mode": config.get("mode", "social"),
            "created": created,
            "updated": created,
            "status": "queued",
            "stage": "Queued",
            "progress": 0,
            "message": "Waiting for the cutting room…",
            "error": None,
            "config": config,
            "sources": sources,
            "srt_path": srt_path,
            "music_path": music_path,
            "custom_transition_path": custom_transition_path,
            "summary": {},
            "warnings": [],
            "output": {},
            "cover": None,
            "job": None,
        }
        with _LOCK:
            _atomic_json(folder / "project.json", project)
        return project

    def load(self, project_id: str) -> dict:
        folder = self.folder(project_id)
        path = folder / "project.json"
        if not path.exists():
            raise FileNotFoundError("Project not found.")
        with _LOCK:
            data = json.loads(path.read_text(encoding="utf-8"))
        return data

    def save(self, project: dict) -> dict:
        project["updated"] = now_iso()
        with _LOCK:
            _atomic_json(self.folder(project["id"]) / "project.json", project)
        return project

    def update(self, project_id: str, **changes) -> dict:
        with _LOCK:
            project = self.load(project_id)
            project.update(changes)
            return self.save(project)

    def write_json(self, project_id: str, name: str, data: Any, subfolder: str = "analysis") -> Path:
        path = self.folder(project_id) / subfolder / name
        _atomic_json(path, data if isinstance(data, dict) else {"data": data})
        return path

    def read_json(self, project_id: str, name: str, subfolder: str = "analysis", default=None):
        path = self.folder(project_id) / subfolder / name
        if not path.exists():
            return default
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return default

    def list(self) -> list[dict]:
        projects = []
        for folder in sorted(self.root.iterdir(), key=lambda p: p.stat().st_mtime if p.exists() else 0, reverse=True):
            if not folder.is_dir():
                continue
            path = folder / "project.json"
            if not path.exists():
                continue
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                projects.append({
                    "id": data.get("id"),
                    "name": data.get("name"),
                    "mode": data.get("mode"),
                    "status": data.get("status"),
                    "progress": data.get("progress", 0),
                    "created": data.get("created"),
                    "updated": data.get("updated"),
                    "summary": data.get("summary", {}),
                    "cover": bool(data.get("cover")),
                    "error": data.get("error"),
                    "stage": data.get("stage"),
                })
            except Exception:
                continue
        return projects

    def delete(self, project_id: str) -> None:
        import shutil

        folder = self.folder(project_id)
        if folder.exists():
            shutil.rmtree(folder, ignore_errors=True)

    def mark_interrupted(self) -> None:
        for item in self.list():
            if item.get("status") in ("running", "queued"):
                try:
                    self.update(item["id"], status="failed", stage="Interrupted",
                                message="The app restarted before this job finished.",
                                error="Cutline was closed while this job was running. Build it again.")
                except Exception:
                    pass

    def output_path(self, project_id: str, *parts: str) -> Path:
        return self.folder(project_id).joinpath("output", *parts)
