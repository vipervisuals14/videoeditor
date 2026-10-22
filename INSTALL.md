# PulseVFX — The Complete Install Manual (no coding required)

This guide assumes **you have never opened Terminal, never installed a "package", and don't
want to learn.** If you can install an app from a `.pkg` and double-click a file, you can do
this.

There is **nothing to type.** Every command is inside a file you double-click.

Total time: **about 15 minutes**, once. After that it is a 2-double-click routine.

---

> **Shortcut: do you just want the effects without installing anything?**
> There is a **web version** — deploy the `dist-web/` folder anywhere (or use a hosted URL),
> then each effect is applied by pasting one snippet into Resolve's Console. No Node.js, no
> terminal, no bridge. See **[DEPLOY-WEB.md](DEPLOY-WEB.md)**.
> The trade-off: one paste per effect instead of one click. This manual is the one-click route.

---

## What you are installing

Two separate things, and it helps to know why:

| Thing | What it is | Where it lives |
| --- | --- | --- |
| **The panel** | A little web app that runs on your own Mac and shows the effect cards, sliders, keyframes and lyric styles. | Your browser (`http://localhost:3000`) |
| **The bridge** | A tiny script that sits inside DaVinci Resolve and turns the panel's buttons into real Fusion nodes on your timeline. | `~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility/` |

The panel and the bridge talk to each other through a folder on your Mac. That is why the
bridge has to be started inside Resolve once per session — Resolve Free 21.1.1 does not allow
plugins to auto-start.

**No Resolve Studio ($295) is needed. No Sapphire, no Universe, no password.**

---

## Every link you need, in one place

| What | Link |
| --- | --- |
| **Node.js** (free, required, install once) | https://nodejs.org/en/download |
| **DaVinci Resolve Free** (if you don't have it) | https://www.blackmagicdesign.com/products/davinciresolve |
| **Download this kit** (ZIP) | https://github.com/vipervisuals14/videoeditor/archive/refs/heads/arena/9c8d60e0-videoeditor.zip |
| The project page (for future updates) | https://github.com/vipervisuals14/videoeditor |
| This manual online | https://github.com/vipervisuals14/videoeditor/blob/arena/9c8d60e0-videoeditor/INSTALL.md |
| The two reference sites the looks are based on | https://staycreative.store/pages/vfx-kit-extension · https://lyrc.studio |

---

## Part 1 — Install Node.js (once, ~10 minutes)

Node.js is the free, official engine that runs the panel. Node.js is made by the people who
make it for everybody — you are not installing anything sketchy.

1. Open **https://nodejs.org/en/download**
2. Click the **macOS Installer (.pkg)** button for the **LTS** version.
   *(If it asks Intel or Apple Silicon — pick whichever your Mac is. If you don't know:
    Apple menu  →  About This Mac  →  look at "Chip". "Apple M1/M2/M3/M4" = Apple Silicon,
    "Intel Core" = Intel.)*
3. The `.pkg` lands in your **Downloads** folder. Double-click it.
4. Click **Continue → Continue → Agree → Install**.
5. If macOS asks for your **password**, type it. *Nothing appears as you type — that is
   normal and not a bug.* Press Return.
6. Click **Close** when it says the installation was successful.

✅ **You never have to open Node.js.** It just needs to be there.

---

## Part 2 — Get the kit onto your Mac

1. Click this link:
   **https://github.com/vipervisuals14/videoeditor/archive/refs/heads/arena/9c8d60e0-videoeditor.zip**
2. A file called `videoeditor-arena-9c8d60e0-videoeditor.zip` downloads to **Downloads**.
3. Double-click it. You get a **folder** next to the zip, named
   `videoeditor-arena-9c8d60e0-videoeditor`.
4. **Drag that folder onto your Desktop.** (It just makes it easy to find. Anywhere you like
   works — as long as the folder stays *whole*.)
5. Rename it to **PulseVFX** if you want, so it is easy to spot.

You should now see a folder containing these files:

```
PulseVFX/
├── Mac 1 - Install Resolve Bridge.command   ← double-click this first
├── Mac 2 - Start VFX Panel.command          ← then this
├── Mac 3 - Open Floating Panel Window.command  (optional)
├── install-macos-resolve-free.sh
├── INSTALL.md            ← this file
├── README.md
├── server.js
├── public/               (the panel itself)
├── resolve-bridge/       (the bridge script)
└── fusion-macros/        (12 extra Fusion effects)
```

⚠️ **Do not move single files out of the folder.** The double-click files look for their
neighbours.

---

## Part 3 — Install into Resolve (double-click #1)

Before this step: **open DaVinci Resolve once and close it.** Resolve creates its own folders
the first time it runs, and the installer needs them.

1. Double-click **`Mac 1 - Install Resolve Bridge.command`**.
2. A black Terminal window opens by itself and says
   **"PulseVFX — STEP 1 of 3: Install into DaVinci Resolve"**.
3. When it prints **✓ Installed Lua Bridge to:** and **DONE**, you are finished.
   Press Return to close the window.

**If macOS says *"cannot be opened because it is from an unidentified developer"*:**

- **Right-click** the file → **Open** → click **Open** in the dialog.
- You only ever do this once per file. (It is the same "Open anyway" security prompt you get
  for any downloaded app.)

**If it says it cannot find your Resolve folder:** open DaVinci Resolve, close it, run the
file again.

✅ This also installs **12 extra Fusion effects** (macros) that show up in Resolve's Effects
Library — you can use those even without the panel.

---

## Part 4 — Start the panel (double-click #2)

1. Double-click **`Mac 2 - Start VFX Panel.command`**.
2. It prints **"Node.js found: vXX.X.X"**, then **"Starting the panel…"**.
3. Your browser opens the panel automatically after ~2 seconds.

**Leave that black Terminal window open while you edit.** It *is* the panel. Closing the
window (or pressing `Control-C` in it) stops the panel. You can minimise it.

> Want a floating window with no tabs and no address bar, so it looks like a plugin?
> Double-click **`Mac 3 - Open Floating Panel Window.command`** instead of using a normal
> browser tab. (Uses Chrome, Edge or Brave if you have one.)

**If the browser says "Site can't be reached":** the Terminal window was closed. Double-click
`Mac 2` again.

---

## Part 5 — Connect Resolve (once per session)

The panel is now running, but Resolve does not know about it yet. This is a **click, not an
install** — it takes one second and you repeat it whenever you reopen Resolve.

1. Open **DaVinci Resolve Free** and **open a project** (not the Project Manager start screen).
2. In the very top menu bar: **Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge**

   *If `Scripts` only shows greyed-out or unrelated entries, quit Resolve fully and reopen it —
   Resolve reads that menu at launch.*
3. Look at the panel's top-right corner. The dot next to **"Resolve 21.1.1 Bridge"** turns
   **green** and reads **`Live: <your project name> · Resolve 21.1.1`**.

That green pill is your proof that a click in the panel will really reach your timeline.

---

## Part 6 — What "connected" actually means

When the pill in the panel header turns green and reads
**`Live: <your project> · Resolve 21.1.1`**, the pipe is open. That is all it means.

**Nothing on your timeline changes until you press a button that sends something.**
The panel is not a mirror of Resolve. Its big preview at the top of the page is **empty
when you open the app** — it shows no stock footage and plays nothing — until you load your
own clip or photo. Once connected, the timeline strip on the right shows your **real**
Resolve timeline (look for the green `LIVE` tag).

Two things to check, in this order:

1. The strip above the Lua console should read
   **`Live · target: <clip name>`** — that is the clip an Apply will hit.
   If it says **`No clip under the playhead`**, put a clip on **V1** and park the playhead on it.
2. Press **`Test bridge`** in that strip. Resolve should answer with its project, timeline and
   target clip in a green toast. If you get an amber/red toast instead, the bridge is not
   actually running (click `Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge` again).

---

## Part 7 — Your first effect in 60 seconds

1. In Resolve, on the **Edit page**, put a clip on **V1**.
2. Move the **playhead over that clip** (the bridge applies to the clip under the playhead).
3. In the panel, stay on **`01 • Effects`**.
4. Click a card — try **"Band-Split Slice Cabinet"** or **"Copperplate Engrave Hatch"**.
   The big preview shows the effect live on your footage.
5. Drag the **intensity slider** on that card (0–200%) and watch both the preview and the
   panel's big monitor.
6. Click **`+ Apply`** on the card.

**What you should see:** a small toast at the bottom of the panel saying
`Applied "…" · PRINT graph (LIVE in Resolve 21.1.1) | ColorCorrector → BrightnessContrast → Bitmap`,
and the clip in Resolve gets a Fusion comp with those nodes plus a coloured marker on the
timeline. Scrub it — the effect is real, on the clip.

> If the toast says **"Lua + monitor ready"** instead of "LIVE", the bridge is not running.
> Go back to Part 5.

---

## Part 8 — Keyframes (the sliders that move)

1. Select the card you applied.
2. Under the big preview there is a **curve editor**. Click on the curve to drop a keyframe;
   drag it to change value/time. **Right-click** (or Shift-click) deletes one.
3. Or use the small **`◆ KF`** button on a card to stamp the current intensity at the
   playhead. The badge on the card counts how many keyframes that effect owns.
4. Press **`+ Apply`** again.

Each keyframe is written into Resolve as a **native `BezierSpline`** on the effect's input, so
it animates in Resolve exactly as it does in the panel preview. Nothing is faked with markers.

---

## Part 9 — The five tabs

The panel is five tabs, not seven. Two of them hold a second panel behind a small switcher at the
top of the tab:

| Tab | Holds |
| --- | --- |
| **01 • Effects** | the 72 effect cards (Look Director + Effect Layers sit under **More tools**) |
| **02 • Lyrics** | the 20 LYRC styles and your lyric blocks |
| **03 • Subject** | **Magic Mask** · **Depth Map** (switch between them) |
| **04 • Editing** | **Cut Silences** · **Media Pool AI** (switch between them) |
| **05 • Render** | 4K import and export |

In **01 • Effects** the keyframe editor stays out of the way until you click a card. Clicking a card
**previews** it on the monitor and does not touch your timeline; only the card's **+ Apply** button
sends the effect to Resolve and writes a clip onto the V3 lane.

**`02 • Lyrics`** — 20 kinetic lyric styles (Bold / Layered / Minimal / Talking).

- **Lyrics start switched off.** Your footage plays clean until you turn them on, so a new clip
  never arrives with text burned onto it. There is a switch at the top of this tab —
  **`Lyrics on monitor: OFF / ON`** — and the same switch sits in the viewer bar as
  **`Lyrics: OFF`**. Either one turns the typography on and off, and the choice is remembered.
- Type or paste your lyrics, press **`Sync to Beats`**, pick a style, press **`Variation`** to
  reshuffle the arrangement.
- **`Place on Resolve Timeline`** builds real text cards: one `TextPlus` per line, each with a
  3-key opacity animation, merged over your footage, plus yellow lyric markers.
- `Song Hook` and `Brand Script` load example text if you want to see it working first.

**`04 • Editing ▸ Cut Silences`** — for talking-head videos and vlogs.

- **`Cut Silences in Resolve`** rebuilds the timeline from the loud parts only.
- The 1.08× jump-cut punch-in and J-cut overlap are applied to the kept segments.

**`04 • Editing ▸ Media Pool AI`** — auto editing.

- **`Scan Resolve Media Pool`** reads the bins and clips in your open project.
- **`Auto-Cut Timeline Now`** assembles a new timeline: beat-synced for music videos, or a
  rough vlog cut for talking heads.

**`03 • Subject ▸ Depth Map`** — depth of field and 10 more depth-driven looks.

- **Pick an engine first.** Two cards sit at the top of the tab:
  - **🧠 AI depth** (default) — runs **Depth Anything V2** in your browser. This is the real thing:
    it understands what is in the picture, so faces, hair and object edges come out sharp and the
    ground recedes properly. The first time you use it, it downloads a **49 MB model** — once. A
    progress bar shows the download, then it is cached and starts instantly after that.
  - **🔬 AI high detail** — the same model looking at the picture at **twice** the resolution. It
    pulls apart detail the normal pass smooths over: the line of a jaw, strands of hair, leaves.
    Nothing extra to download. The catch is speed: several seconds for **one** frame, so it is for
    a still you are about to finish, not for playback while you scrub. It does not refresh by
    itself — press **`↻ Re-scan plate`** when you move the playhead.
  - **⚡ Fast estimate** — no download, instant. It guesses from position, colour and texture, so
    it is fine for a quick look and wrong often enough that you should not export from it.
- In a browser that blocks background workers (a few locked-down setups), the AI card says
  **unavailable here** and the tab falls back to the fast estimate instead of failing silently.
- **`↻ Re-scan plate`** rebuilds the map for the current frame with whichever engine is selected.
- **`Live depth: ON`** (on by default) re-reads the frame while the clip plays, so the map always
  describes what is on screen instead of the frame that happened to be up when the tab opened.
  The estimate runs in a background worker (`depth-live-worker.js`), so the monitor keeps its
  frame rate. Switch it to **OFF** when you want the map pinned to one frame.
- **`Preview:`** at the top right chooses what the monitor shows: **picture only** (default — you
  see just the graded result), **depth overlay**, the raw **depth map**, or a **split compare**.
- The map is estimated at **480×270** and the effect pass runs at the monitor's own resolution,
  so depth-of-field edges are not a blown-up 160×90 buffer.
- **`From Magic Mask`** turns a mask you drew into the depth map; **`Load depth map`** takes a real one
  (iPhone LiDAR, Depth Anything, MiDaS, or Resolve's own Depth Map export). Loaded maps keep their
  own detail up to 960 px wide instead of being squashed to thumbnail size.
- Turn on any of the 11 effects with its slider (Depth of Field, Tilt-Shift, Atmosphere, Depth Grade,
  Parallax, Relight, Slice Offset, Contours, Point Cloud, Anaglyph, Echo), keyframe them with **`◆`**,
  and send one or all with **`Send Active Stack to Resolve`**.
- **`⬇ Depth .PNG`** saves the map at 1920×1080 (white = near).

**`03 • Subject ▸ Magic Mask`** — cut a person or object out of the shot, like Resolve's Magic Mask.

That tool is Studio-only (it is one of the things the $295 unlocks), so this tab builds the same
matte here and hands Resolve a real Fusion graph.

1. Open the tab and leave **`✦ Magic Select`** highlighted.
2. Click your subject once, right on the **Live Preview** picture. A red outline appears with
   a dark frame around it — that is your matte. The coverage number tells you how much of the
   picture it caught.
3. Wrong bits? Click **`－ Subtract`** and paint over them. Missed bits? Click **`＋ Add`** and
   paint them in. **`▭ Box`** is the quick way to just grab a rectangle.
4. Tidy the edge with **`Feather`** (softness) and **`Grow / shrink`** (eats in or spills out).
   **`Select sensitivity`** decides how picky the click is — raise it if the matte stops short,
   lower it if it leaks onto the wall.
5. Press **`Track forward ▶`** and it follows the subject across the next frames. **`◀ Track back`**
   does the same backwards. **`＋ Keyframe`** pins the matte at the playhead.
6. Press **`Send Mask to Resolve`**. Resolve gets `Paint → Polygon → Blur → MatteControl → Merge`
   with BezierSpline keyframes. In the browser version you paste the snippet it copies.

The **`Person` / `Skin` / `Sky` / `Brightness` / `Colour`** buttons change what the click looks
for. **`Invert`** flips the matte (select everything *except* the subject). **`⬇ Matte as .PNG`**
saves a 1920×1080 black-and-white matte you can drop into Fusion if you would rather paint on
it by hand.

---

## Using your own photos and clips

The preview is the **first thing on the page**, and it starts blank on purpose: the app ships
no footage, no demo clip and no music-video stand-in. Nothing appears until you load a file.

**Your own photo** (a still frame, artwork, a photo you want to grade):

1. Click **`Load photo`** in the bar above the preview, next to **`Load footage`**.
2. Pick your file (PNG, JPEG, WebP, AVIF, TIFF or BMP). It appears on the **Live Preview** at once.
3. Or skip the button: **drag the file from Finder straight onto the preview picture**.
4. The button then shows your file's name, and everything in the panel works on that photo —
   effects, depth of field, Magic Mask, Effect Layers, and `05 • Render` for a full-size export.

To clear the preview and start over, click **`Clear`**. There are no built-in plates to go back to.

**Your own video:** **`Load footage`**, or drag the clip onto the preview. Nothing auto-plays —
press **`Play`** when you want it to move, and **`Pause`** to freeze it. The timeline, the silence
detector and the lyric overlay all stay untouched until you switch them on.

**Making a vertical (9:16) version of a wide photo:**

1. Click **`9:16: OFF`** in the viewer bar so it reads **`9:16: ON`**. The photo moves into a
   vertical slot with dark side bars — nothing is squashed.
2. If the subject is cut off, click **`Framing: Centre`** to cycle Centre → Left → Right. That
   chooses which part of the photo the vertical frame keeps.
3. The panel already picks a left-third crop the first time you switch to 9:16, because that is
   where a subject usually is.

Your images never leave your Mac — the page reads the file locally in the browser.

## The transport bar (play, pause, scrub)

Under the Live Preview: **`Pause`**, **`Test Film Snip / Transient`**, and the scrubber with the
timecode beside it.

- **`Pause`** stops everything — the shader, the beat pulse, the lyric animation, **and your
  video**. Pause a clip and the picture holds on that exact frame; press **`Play`** and it
  resumes from the same place. (Older builds froze the shader clock but left the video element
  playing underneath, so the picture kept moving.)
- **Dragging the scrubber** moves the playhead and seeks your video to the same point, and
  refreshes the depth map for that frame.
- **`Motion: ON/OFF`** in the viewer bar is the same freeze, without changing the play state.

## Layering effects (stacking looks)

1. Click any effect card in **`01 • Effects`** so it is highlighted.
2. Scroll to **Effect Layers** under the card grid and press **`＋ Add Current Effect`**.
3. Repeat with other cards. Each row in the rack is one layer.
4. Use the **Blend** menu (Screen, Multiply, Overlay…) and the two sliders —
   **FX** is how strong the layer is, **OP** is how much of it you see.
5. **`↑` `↓`** change the order, **`◐`** mutes a layer, **`✕`** removes it.
6. Press **`◆`** on a row to keyframe that layer's strength at the playhead.
7. **`Send Stack to Resolve`** hands Resolve the whole stack as one ordered graph.

---

## 4K import & export

1. Open **`05 • Render`**.
2. Drag a clip or image onto the dashed box (or press **`⬆ Import footage`**). The panel shows its
   real resolution and whether it is 4K.
3. Pick a size (4K UHD is already selected), frame rate and format.
4. **`⬇ Export still`** saves one full-resolution frame.
   **`⬇ Render PNG sequence (ZIP)`** saves a numbered sequence — drag that folder into Resolve's
   Media Pool and it imports as an image sequence.
5. For a finishing master press **`▦ Make Resolve render 4K natively`**: it copies a Lua snippet
   that sets your project and timeline to 3840 × 2160, then Resolve renders with its own codecs.
   In the hosted website version you paste that snippet into Resolve's Console.

---

## Your everyday routine (this is the whole thing)

1. Double-click **`Mac 2 - Start VFX Panel.command`**.
2. In Resolve: **Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge**.
3. Edit. The pill stays green.

When you are done: close the panel's Terminal window and quit Resolve. Nothing to uninstall,
nothing left running.

---

## Updating the kit later

1. Download the ZIP again and replace your old PulseVFX folder (keep the new folder's name,
   or the double-click files still work — they only look for their neighbours).
2. Double-click **`Mac 1 - Install Resolve Bridge.command`** to copy the new bridge in.
3. **Quit DaVinci Resolve completely (⌘Q) and reopen it.** The old bridge is still in memory
   until Resolve quits, and two copies running at once would apply every effect twice.
4. In Resolve: **Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge**.
5. In the browser: reload the panel page (**⌘R**).

---

## If something goes wrong

| What you see | What it means | Fix |
| --- | --- | --- |
| *"cannot be opened because it is from an unidentified developer"* | macOS quarantine on a downloaded script | **Right-click** the file ▸ **Open** ▸ **Open**. Once per file. |
| *"Node.js is not installed yet"* | Part 1 was skipped | Do Part 1, then double-click `Mac 2` again. |
| Browser: *"Site can't be reached"* | The Terminal window running the panel was closed | Double-click `Mac 2` again. |
| Panel works, pill stays **amber**, toast says **"Lua + monitor ready"** | The bridge is not running inside Resolve | Resolve ▸ **Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge** |
| No `Scripts` entry in Workspace | Resolve read the menu before the bridge was installed | Quit Resolve completely (⌘Q) and reopen it. |
| Pill green, but *"No video clip found on timeline"* | Nothing under the playhead | Put a clip on V1 and park the playhead over it. |
| Effect applied but the clip looks unchanged | The clip already had a Fusion comp that was not saved, or you applied to a different clip | Check the clip's **Fusion** page; re-apply with the playhead on the right clip. |
| *"Port 3000 is already in use"* | The panel is already running somewhere | Just open http://localhost:3000 — the `Mac 2` file also detects this and opens it for you. |
| Everything is tiny / zoomed weirdly | Browser zoom | Press **⌘0** in the browser. |
| Panel is too wide beside Resolve | — | Click **`Pop-Up Dock Mode`** in the panel header for a narrow floating strip. |
| macOS asks *"Do you want the application node to accept incoming network connections?"* | Normal firewall prompt | Click **Allow** (or **Deny** — both work; the panel only talks to your own Mac). |
| Resolve updated to a newer 21.x | Expected | It still works. The kit targets 21.1.1 because that is the version that removed Python scripts in Free. |
| You want to reinstall cleanly | — | Just run `Mac 1` again. It overwrites. |

Still stuck? Open the panel's **Lua** drawer at the bottom right and press
**`Copy Lua for Resolve Console`**. In Resolve, choose **Workspace ▸ Console**, paste, press
Enter — that does the same thing by hand and always works.

---

## Uninstalling

1. Drag the **PulseVFX** folder to the Bin.
2. In Finder press **⇧⌘G**, paste this, press Return, and delete the `VFXKit Free` folder:
   `~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Templates/Edit/Effects/VFXKit Free`
3. Same again for:
   `~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility/VFXKit_ResolveFree_Bridge.lua`
4. Optional: delete the folder `~/.vfxkit-resolve-free`.

(Your own projects, timelines and Fusion comps are never touched by any of this.)

---

## Quick-reference: what each file in the folder does

| File | What it does | Do you touch it? |
| --- | --- | --- |
| `Mac 1 - Install Resolve Bridge.command` | Copies the bridge + 12 macros into Resolve | Double-click once (again after updating the kit) |
| `Mac 2 - Start VFX Panel.command` | Starts the panel and opens it | Double-click every session |
| `Mac 3 - Open Floating Panel Window.command` | Opens the panel in a small app-style window | Optional |
| `install-macos-resolve-free.sh` | The real installer that `Mac 1` calls | No |
| `server.js` | The panel's engine | No |
| `public/` | The panel's screens, shaders and previews | No |
| `resolve-bridge/` | The Lua bridge + the 77 effect recipes | No |
| `fusion-macros/` | 12 native Fusion effects for the Effects Library | No |
| `README.md` | Technical notes, benchmarks, how the bridge was tested | Reference only |

---

### Links, one more time

- Node.js → **https://nodejs.org/en/download**
- DaVinci Resolve Free → **https://www.blackmagicdesign.com/products/davinciresolve**
- Download this kit → **https://github.com/vipervisuals14/videoeditor/archive/refs/heads/arena/9c8d60e0-videoeditor.zip**
- Project page → **https://github.com/vipervisuals14/videoeditor**
- Manual online → **https://github.com/vipervisuals14/videoeditor/blob/arena/9c8d60e0-videoeditor/INSTALL.md**
