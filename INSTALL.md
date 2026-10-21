# PulseVFX — The Complete Install Manual (no coding required)

This guide assumes **you have never opened Terminal, never installed a "package", and don't
want to learn.** If you can install an app from a `.pkg` and double-click a file, you can do
this.

There is **nothing to type.** Every command is inside a file you double-click.

Total time: **about 15 minutes**, once. After that it is a 2-double-click routine.

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

## Part 6 — Your first effect in 60 seconds

1. In Resolve, on the **Edit page**, put a clip on **V1**.
2. Move the **playhead over that clip** (the bridge applies to the clip under the playhead).
3. In the panel, stay on **`01 • TouchDesigner & VFX`**.
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

## Part 7 — Keyframes (the sliders that move)

1. Select the card you applied.
2. Under the big preview there is a **curve editor**. Click on the curve to drop a keyframe;
   drag it to change value/time. **Right-click** (or Shift-click) deletes one.
3. Or use the small **`◆ KF`** button on a card to stamp the current intensity at the
   playhead. The badge on the card counts how many keyframes that effect owns.
4. Press **`+ Apply`** again.

Each keyframe is written into Resolve as a **native `BezierSpline`** on the effect's input, so
it animates in Resolve exactly as it does in the panel preview. Nothing is faked with markers.

---

## Part 8 — The other three tabs

**`02 • LYRC Typography`** — 20 kinetic lyric styles (Bold / Layered / Minimal / Talking).

- Type or paste your lyrics, press **`Sync to Beats`**, pick a style, press **`Variation`** to
  reshuffle the arrangement.
- **`Place on Resolve Timeline`** builds real text cards: one `TextPlus` per line, each with a
  3-key opacity animation, merged over your footage, plus yellow lyric markers.
- `Song Hook` and `Brand Script` load example text if you want to see it working first.

**`03 • Cut Silences`** — for talking-head videos and vlogs.

- **`Cut Silences in Resolve`** rebuilds the timeline from the loud parts only.
- The 1.08× jump-cut punch-in and J-cut overlap are applied to the kept segments.

**`04 • Media Pool AI`** — auto editing.

- **`Scan Resolve Media Pool`** reads the bins and clips in your open project.
- **`Auto-Cut Timeline Now`** assembles a new timeline: beat-synced for music videos, or a
  rough vlog cut for talking heads.

---

## Your everyday routine (this is the whole thing)

1. Double-click **`Mac 2 - Start VFX Panel.command`**.
2. In Resolve: **Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge**.
3. Edit. The pill stays green.

When you are done: close the panel's Terminal window and quit Resolve. Nothing to uninstall,
nothing left running.

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
