# Cutline

**A first-cut studio for DaVinci Resolve.** Auto-remove silences, add captions, add
titles, and lay in transitions — then hand the timeline to Resolve and keep editing.

Built for the free edition on purpose. Resolve Free has no scripting bridge, so
Cutline doesn't use one: it renders its overlays and writes an **OpenTimelineIO**
timeline that Resolve imports natively, the same way it imports an XML or EDL.

![Creator captions](docs/images/captions-creator.jpg)

Three passes, three workflows:

| Pass | What it is for | It does |
|---|---|---|
| **Talking head** | Client social, vertical | Silence cuts, bold word-timed captions, light-leak/flash accents |
| **Travel vlog** | Long-form, 16:9 | Gentle silence trims, opening title card, chapter cards, journal captions |
| **Music video** | Beat-driven | Tempo detection, shot grid on the bar, beat accents, lyric captions |

Everything runs on your machine. No account, no upload, no cloud render.

---

## What you get

- `timeline.otio` — video on V1, transitions on V2, captions on V3, title cards on V4, audio on A1
- `captions.srt` / `captions.vtt` — a subtitle sidecar if you would rather use Resolve's subtitle track
- `transcript.txt` — timed transcript of the cut
- `preview.jpg`, `manifest.json`, `cut_notes.md` — a still, the recipe, and import notes

Captions and titles are real QuickTime movies with an alpha channel, so they behave
like any clip you would drop on a track. You can slip a single card, retype it, or
delete the whole track without touching the picture.

## Quick start

```bash
git clone <your-repo> cutline && cd cutline
./install.sh          # macOS / Linux
./bin/cutline serve   # opens http://127.0.0.1:8787
```

On Windows run `install-windows.bat`, then double-click `Cutline.bat`.

First launch renders a small demo clip and caption file so you can try a full build
in under a minute — press **Add demo footage**.

### Requirements

- Python 3.10+
- FFmpeg (bundled automatically through `imageio-ffmpeg`; a system FFmpeg also works)
- DaVinci Resolve 18.5 or newer, free or Studio

Automatic captions use [faster-whisper](https://github.com/SYSTRAN/faster-whisper)
running locally (installed by `install.sh`). The first transcription downloads a
75–500 MB model depending on quality. If you would rather not, upload an `.srt`,
`.vtt`, or `.lrc` file instead — everything else works the same.

## Using it

1. **Footage** — drop clips, or paste a folder path to use media already on your drive.
2. **Silence** — pick a pacing, check the silence map, and see exactly how much dead
   air is coming out. The detector learns the room tone per clip.
3. **Captions** — transcribe, upload a file, or turn text off. Choose one of seven
   looks and tune type, colour, highlight, entrance, and position against a live preview.
4. **Motion** — transitions (light leak, film burn, flash, glitch, soft bloom, whip,
   dip to ink, or your own alpha movie) and, for vlogs, title and chapter cards.
5. **Delivery** — aspect, frame rate, resolution. Build.

Then in Resolve: **File → Import → Timeline**, pick `timeline.otio`, and accept the
media relink. Done.

### Silence pacing

| Preset | Cuts pauses over | Feel |
|---|---|---|
| Natural | 0.9 s | Travel films, interviews with air |
| Tight | 0.55 s | Podcast-style social edits (default) |
| Surgical | 0.32 s | Shorts, fast retention editing |

### Caption styles

Seven presets: **Creator** (bold, word-highlight), **Clean** (soft card), **Kinetic**
(editorial music type), **Journal** (warm travel serif), **Broadcast** (newsroom
lower third), **Neon** (karaoke colour), **Minimal** (clean outline). All are
customisable and the whole look is re-rendered from the settings.

![Caption styles](docs/images/caption-styles.jpg)

### Music mode

Cutline decodes the song, estimates tempo and downbeat phase, and cuts picture every
N beats. Beat accents land on the bar. Lyric captions can come from transcription or
an `.lrc`/`.srt` file. If detection is unsure, type the BPM and rebuild.

## Why a companion studio instead of a native plugin

A native Resolve plugin can't do this on the free edition. OpenFX and Fusion
templates process one clip's pixels and can't build a timeline. The scripting API —
the only thing that *can* build a timeline — is Studio-only for external calls and
has been removed from Free's Python support entirely. Timeline interchange is the
one interface Blackmagic left open, so that is what Cutline targets.

More detail: [docs/why-not-a-plugin.md](docs/why-not-a-plugin.md).

## How the free edition is handled

Resolve 19.1 moved external scripting to Studio, and 21.1 removed Python scripting
from the free edition altogether. File interchange was not touched: OTIO import (and
EDL/FCPXML) still works on Free. Cutline is built entirely on that path:

- no Python bridge, no Studio-only API calls
- stock OTIO schemas only (custom schemas are known to make the importer fail)
- absolute media paths, so the conform is silent
- audio-first track order with video layered bottom-to-top, matching a verified import

The one platform caveat worth knowing: **Free on Linux cannot decode H.264/H.265**.
On macOS and Windows the free edition decodes camera files normally. On Linux, work
with DNxHR/ProRes media if you are on the free build.

## CLI

```bash
cutline serve          # start the studio (default)
cutline serve --port 9000 --no-browser
cutline doctor         # check FFmpeg, fonts, OTIO, and the speech engine
cutline demo --force   # regenerate the demo footage
cutline clean --uploads
```

Data lives in `./data` (projects, uploads, renders, models). Override with
`CUTLINE_DATA=/path/to/folder`.

`cutline serve` listens on all interfaces so it also works in containers and on a
render box. On a shared network, start it with `cutline serve --host 127.0.0.1` to
keep the studio local to your machine.

## Project layout

```
cutline/
  app.py            FastAPI routes and job runner
  pipeline.py       the build: silence → captions → overlays → timeline
  silence.py        room-tone learning and speech-run detection
  beats.py          spectral-flux onsets, tempo, downbeat phase
  transcribe.py     faster-whisper wrapper with word timestamps
  captioning.py     cue building, re-timing after cuts, manual edits
  captions.py       the caption renderer (Pillow + bundled fonts)
  transitions.py    procedural light leak / flash / glitch / bloom / whip
  transition_render.py  bakes accents with the real footage underneath
  timeline.py       OTIO writer (contiguous tracks, source ranges intact)
  planner.py        edit decision lists for all three modes
  static/           the studio UI (no build step, no framework)
tests/              49 tests across analysis, planning, rendering, and the API
docs/images/        screenshots used in this README
```

## Notes and limits

- Everything is frame-quantised; 23.976/29.97 totals can differ by a frame or two.
- Transition accents are baked into short movie clips because OTIO dissolves need an
  overlap the free importer doesn't honour reliably. Cuts stay frame-accurate.
- Captions are burned-in overlays; the SRT is the editable source of truth.
- Beat detection is solid on four-on-the-floor material and approximate on rubato
  live recordings — type the BPM to lock it.
- Not affiliated with Blackmagic Design. “DaVinci Resolve” is a trademark of
  Blackmagic Design Pty Ltd.

## Licence

MIT for the code. Bundled fonts (Inter, Archivo Black, Bebas Neue, Playfair Display)
are under the SIL Open Font License; see `cutline/assets/licenses/`.
