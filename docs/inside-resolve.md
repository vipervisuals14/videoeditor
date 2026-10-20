# Cutline inside DaVinci Resolve

Cutline now has a menu entry in Resolve's own **Workspace → Scripts** list. You
drop footage into a folder, Cutline builds the cut in the background, and one
click in Resolve pulls the finished timeline into the project you already have
open. No browser tab, no File → Import dialog, no re-import shuffle.

**Verified on Resolve 21.1.1 Free:** the Lua entry appears and runs, but the
project API is gated to Studio, so clicking it cannot import anything. On that
build the finished cut is imported with **File → Import → Timeline** — the engine,
drop folder, watcher, config, and OTIO output all work unchanged. On 21.0.x Free
and Studio the menu import works.

This design exists because of the **free** edition's limits, so it is worth two
minutes to explain what Resolve allows.

## What the free edition actually permits

| Capability | Free 21.1 | Consequence for Cutline |
|---|---|---|
| Lua files in `Workspace → Scripts` | **Runs** | This is the door we use |
| Python files in `Workspace → Scripts` | Silently ignored | The Python entry is Studio-only |
| `UIManager` (native windows from a script) | `nil` | No sliders, no floating panel |
| `print()` in a menu script | Muted | Status is reported through timeline names |
| External scripting / Workflow Integrations / MCP | Studio-only | The engine cannot live *inside* Resolve's process |
| OTIO / XML / EDL timeline import | Free, both editions | The timeline file is still the transport |

So "a script inside Resolve" cannot mean the whole editor runs inside Resolve on
Free. On 21.1 even the import half is blocked; on 21.0.x it works. What this
ships is:

1. **The engine runs outside**, headless, watching a drop folder. It never needs
   a browser window or a click.
2. **One Lua menu entry runs inside** Resolve and imports whatever the engine
   last built, through Resolve's own media pool API.

You still press one menu item. You no longer leave the app to get a cut.

```
~/Movies/Cutline/
  inbox/            ← drop footage here (and an optional .srt)
  latest/           ← engine publishes timeline.otio + media/ here
    timeline.otio
    media/
    state.json
  engine/           ← analysis, renders, project history
  logs/watch.log
  READ-ME.txt       ← the same three steps, in the folder
```

## Setup (macOS, once)

From the Cutline folder (full walkthrough: [../INSTALL.md](../INSTALL.md)):

```bash
./install.sh                       # first time only: creates .venv, checks tools
./bin/cutline resolve-install    # writes the Workspace > Scripts entries
./bin/cutline resolve-agent      # installs and starts the background watcher
```

`resolve-install` writes three small files into Resolve's user scripts folder:

```
~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility/
  Cutline - import latest.lua          ← the one Free uses
  Cutline - check bridge.lua            ← proves the menu entry can reach the API
  Cutline - import latest (Studio).py   ← the same import for Studio, ignored by Free
```

`resolve-agent` writes a login item that keeps the watcher alive and starts it
immediately, so the engine is already running when you sit down. If you would rather not have a background
item, run `./bin/cutline resolve-watch` in a terminal instead.

**Restart Resolve once.** It reads the Scripts folder at launch, not while
running. After that the entries appear under **Workspace → Scripts**:

- `Cutline - import latest`
- `Cutline - check bridge`

Run **check bridge** first. It creates a timeline named `Cutline: bridge ready
(Cutline import)`. That is deliberately a timeline name, not a dialog: the free
edition mutes `print()`, so a name in the media pool is the one status channel a
menu script can rely on. If you see that timeline, the bridge works.

## Daily loop

1. Drop clips into `~/Movies/Cutline/inbox`.
   Add an `.srt` with the same name as a clip to use your own captions instead of
   transcription.
2. The watcher notices within a few seconds and builds. Progress lands in
   `~/Movies/Cutline/logs/watch.log`.
3. In Resolve: **Workspace → Scripts → Cutline - import latest**.
   Outside Resolve, `cutline resolve-status` prints what the last build made.
4. A new timeline appears in the media pool and opens in the Edit page. Grade it,
   trim it, export it — it is a normal timeline with normal clips.

If the import cannot run, Cutline creates a timeline called
`Cutline: nothing imported (run resolve-status)` rather than failing silently.
That marker means one of two things: nothing has been built yet, or this Resolve
build refused the API call. `cutline resolve-status` tells you which one — if the
build exists, use **File → Import → Timeline** on `latest/timeline.otio`.

### The one thing that is not live yet

The Lua sandbox on Free has no filesystem access, so the menu entry cannot read
`state.json` or tell you *what* it imported. Open `latest/state.json` (or the
timeline name in Resolve) when you want the details: clips, caption count,
duration, warnings.

## Choosing a mode and look

Settings live in `~/Movies/Cutline/config.json`, created on first run. Edit it in
any text editor; the watcher picks up changes on the next build. The keys that
matter:

| Key | Values | Default |
|---|---|---|
| `mode` | `social`, `vlog`, `music` | `vlog` |
| `vlog.look` | `journal`, `viewfinder` | `viewfinder` |
| `vlog.title` / `vlog.location` | any text | empty |
| `captions.enabled` | `true` / `false` | `true` |
| `captions.source` | `auto` (transcribe), `file` (sidecar) | `file` when an SRT is present |
| `transitions.scope` | `cuts`, `source_changes`, `beats` | `cuts` |
| `transitions.frequency` | `0`–`64` (every Nth cut) | `2` |
| `music.bpm` | number or `null` (detect) | `null` |
| `aspect` | `9:16`, `16:9`, `1:1`, `4:5` | ratio of the mode |

A full social/talking-head drop looks like this:

```json
{
  "mode": "social",
  "aspect": "9:16",
  "captions": { "enabled": true, "source": "auto", "preset": "creator" },
  "transitions": { "preset": "light_leak", "scope": "cuts", "frequency": 3 }
}
```

For a music-video drop, put the song in the inbox too and set `"mode": "music"`;
the single audio file becomes the score and the picture is cut to its beat.

If you would rather click than type, the studio is still there for configuring a
look: `./run.sh`, pick the look, then copy the resulting settings into
`config.json`. Studio builds and the drop folder use the same config schema.

## Studio users

If you own Studio, **Workspace → Scripts** also lists
`Cutline - import latest (Studio)`. It does the same import and additionally
prints a report to the console. Nothing else changes: same drop folder, same
watcher, same config file.

On Free **21.0.x** the Python entry runs too — 21.1 is the build that removed it.
Either entry does the same import; the Lua one is the safe default.

The real Studio advantage is that the API is reachable from outside the app, so
an external process could drive Resolve directly. Cutline deliberately keeps the
file hand-off: it survives Resolve updates, it is inspectable, and it produces
the same timeline you could import by hand if the API ever breaks.

## Troubleshooting

**No `Cutline` entries in the Scripts menu.** Resolve reads that folder only at
launch — quit and reopen it. Confirm the files are in
`~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility/`.

**`Cutline: nothing imported (run resolve-status)`.** Either the drop folder is
empty (check `logs/watch.log`; `resolve-build` builds once on demand) or the menu
entry could not call Resolve's importer. `resolve-status` distinguishes the two.

**The imported timeline has red, unlinked clips.** Resolve matches media by path.
The engine copies the exact files it referenced into `latest/media/` and the Lua
entry passes that folder as `sourceClipsPath`. If a clip was too large to copy
(the kit switches to *linked* mode above 2 GB) keep the originals online at their
recorded paths, or import `latest/timeline.otio` by hand with **File → Import →
Timeline** and relink.

**The import returns nothing.** Some free builds gate more of the API than the
docs suggest. The output is still valid: use **File → Import → Timeline** on
`~/Movies/Cutline/latest/timeline.otio`. Tell me your Resolve build number and
I will narrow it down.

**Stopping the watcher.** `launchctl unload ~/Library/LaunchAgents/com.cutline.watch.plist`.

## Why not a real in-app panel?

Because the free edition has no UI toolkit for scripts: `UIManager` returns `nil`,
and 21.1 removed Python from the menu entirely. A dockable panel would be a
Studio-only product, which is the one thing this project refuses to be. The
drop-folder plus one-click-import loop is the smallest honest interface that
works on both editions.
