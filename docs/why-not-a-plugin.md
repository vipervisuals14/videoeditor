# Why Cutline is a companion studio, not a native Resolve plugin

Short answer: on the free edition, a native plugin cannot do this job — and the
route Cutline takes is the one Blackmagic left open.

## What "plugin" can mean in Resolve

| Kind | Runs in Free? | Can it remove silences, write captions, build a timeline? |
|---|---|---|
| OpenFX effect | sometimes, often watermarked | No. It processes one clip's pixels on a node. It cannot read a whole take, cut it, or create tracks. |
| Fusion macro / `.setting` template | yes | No. It is a compositing graph inside one clip or title. |
| DCTL | Studio only | No. Pixel maths on a single clip. |
| Native scripting (`resolve` API) | **partly** — Lua menu scripts still run; Python menu scripts were removed in 21.1; external scripting, Workflow Integrations, and MCP are Studio-only | Yes — but gated, and no UI. |
| **Timeline interchange** (OTIO / FCPXML / EDL) | **yes**, both editions, all platforms | Yes. This is a document import, not an API call. |

So the only interface on the free edition that can *create an edit* is the timeline
file. Cutline is built on exactly that: it does the analysis and rendering outside
Resolve, then writes a timeline Resolve imports natively.

### What does run inside Free Resolve

Since 21.1 the free edition still lists and runs **Lua** files from
`Workspace → Scripts`; only Python was removed. Cutline uses that for one thing:
calling `MediaPool.ImportTimelineFromFile` on the timeline the engine just built,
so the finished cut appears without a file dialog. It is a menu entry, not an
editor — the Lua sandbox has no `io`, no directory listing, no UI toolkit, and
`print()` is muted. Everything that thinks stays in the local engine.

That is also why there is still no panel: `UIManager` returns `nil` on the free
edition, so any dockable GUI would be Studio-only by definition.

## Why that is actually the better design

- **Nothing to break with an update.** No injected hooks, no symlinked scripting
  libraries, no version-specific API calls. If Resolve can import OTIO — and it has
  since 18.5 — Cutline's output opens.
- **The output is inspectable.** `timeline.otio` is JSON: diffable, versionable,
  readable before it touches your project. A script that mutates live state can't
  give you that.
- **The hand-off is the deliverable, not a lock-in.** Every element Cutline makes is
  a normal clip on a normal track: program on V1, transitions on V2, captions on V3,
  titles on V4, audio on A1. Nothing is a frozen render you cannot edit.
- **It works the same if you upgrade.** Buy Studio later and nothing changes except
  that you also gain Resolve's own transcription.

## What Cutline deliberately does not do

- It does not fake Studio features inside Free.
- It does not rely on custom OTIO schemas (a known cause of fatal imports).
- It does not touch your source media: files are read, never rewritten or moved.

## The one platform caveat

Free **on Linux** cannot decode H.264/H.265 — that is a codec licence boundary, not
something a tool can work around. Use DNxHR/ProRes media there, or run on macOS or
Windows where the free edition decodes camera files normally. Cutline itself decodes
through FFmpeg, so its analysis is unaffected; only Resolve's playback of the imported
media is.
