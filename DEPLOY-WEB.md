# PulseVFX — Web version (deploy it, no installs)

A plain static site. **No Node on your Mac, no terminal, no bridge, no local server.**
Open the URL, browse effects, and every Apply hands you one snippet to paste into
DaVinci Resolve.

---

## What works, and what changes

| Feature | Desktop build (bridge) | **Web build** |
| --- | --- | --- |
| 72 live effect cards + shaders | yes | **yes** — identical code, runs in your browser |
| Your own photos as the plate (upload or drag-and-drop) | yes | **yes** — read locally, never uploaded |
| Magic Mask, Depth Map, Effect Layers | yes | **yes** — depth runs live in a background worker |
| Real AI depth (Depth Anything V2, on-device) | n/a | **yes** — 40 MB model cached after first use, no server call |
| 4K import + 4K still / PNG-sequence export | yes | **yes** — rendered in your browser, nothing uploaded |
| Native 4K final render (ProRes/DNxHR) | yes, one click | **yes, one paste** — sets your project to 3840×2160 and Resolve renders |
| Intensity sliders 0–200% + keyframe curve editor | yes | **yes** |
| 20 LYRC lyric styles, variation, 9:16 / 16:9 | yes | **yes** — lyrics start **off**, switch them on in `02 • LYRC` |
| Cut Silences / Media Pool auto-editor UI | yes | **yes** (the panel's own timeline preview) |
| **Applying to your Resolve timeline** | one click, via the local bridge | **one paste** into `Workspace ▸ Console` |
| Reading your real bins/clips | automatic | not possible from a browser (paste **Scan** Lua is read-only, see below) |

Why: a web page is not allowed to read or write files inside DaVinci Resolve, and it cannot
run Lua in it. Resolve's Console can — so the web build prepares the exact Lua and you paste
it. One click, one paste, per effect.

**Hosting note.** The depth model is the only large asset: 40 MB of vendored model + runtime in
`vendor/depth/`, which is inside the same static folder. Every host in this guide serves files
that size (GitHub Pages allows 100 MB per file, Netlify 5 GB per deploy). If you never open the AI
engine's download, a visitor transfers none of it — the files are fetched only when requested.

Nothing you import ever leaves your machine: the 4K renderer reads the file locally, composes
frames on a canvas, and hands you the finished ZIP. There is no upload endpoint to leak to.

The snippet is the **same generator** the desktop bridge runs (`public/lua-export.js`), so the
nodes it builds are identical: `MediaIn1 → … → MediaOut1`, native `BezierSpline` keyframes,
TextPlus cards for lyrics, markers included.

---

## See it right now (no deploy)

```bash
node tools/build-web.mjs          # writes dist-web/
npx serve dist-web                # or: python3 -m http.server 4000 -d dist-web
```

Open the printed URL. Press **`+ Apply`** on a card → the “Paste this into Resolve” dialog
appears with the Lua already selected.

---

## Deploy — pick one

### 1. GitHub Pages (free, 2 minutes)

1. Push this repo to GitHub (already done if you are reading it there).
2. Repo ▸ **Settings ▸ Pages ▸ Build and deployment ▸ Source: _GitHub Actions_**.
3. Push any commit (or run the **Deploy web version** workflow manually).
4. The workflow builds `dist-web/` and publishes it — the URL is
   `https://<user>.github.io/<repo>/`.

Everything uses **relative paths**, so a project sub-folder works. The workflow file is
`.github/workflows/pages.yml` and it fails loudly if the bundle is missing a file or still
contains an absolute asset path.

### 2. Netlify (free, drag-and-drop)

- **Easiest:** run `node tools/build-web.mjs`, then drag the **`dist-web`** folder onto
  <https://app.netlify.com/drop>.
- **From the repo:** “Add new site ▸ Import an existing project”, pick the repo — `netlify.toml`
  already sets `node tools/build-web.mjs` and `publish = dist-web`.

### 3. Vercel (free)

Import the repo. `vercel.json` already sets `buildCommand` and `outputDirectory`; no framework
preset, no environment variables.

### 4. Cloudflare Pages

Build command `node tools/build-web.mjs`, output directory `dist-web`. Nothing else.

### 5. Your own hosting / S3 / a NAS

Upload the contents of `dist-web/`. Any static file server works — there is no backend, no
routing, no rewrites needed.

---

## Using the web build with Resolve

1. Open your deployed URL in Chrome/Safari (the panel is designed for a half-screen window;
   **Pop-Up Dock Mode** makes it a narrow strip beside Resolve).
2. Pick a clip in Resolve, put the **playhead over it** on **V1**.
3. In the panel: choose a card, tune **intensity**, add **keyframes** if you want.
4. Press **`+ Apply`**.
5. In the dialog: press **Copy Lua**.
6. In Resolve: **`Workspace ▸ Console`** → make sure the **Lua** tab is selected → click the
   console input → **⌘V** → **Return**.
7. The clip gets the Fusion comp, node graph, keyframes and a marker.

For lyrics: `02 • LYRC Typography` → **Place on Resolve Timeline** → same paste. One paste
builds *all* the TextPlus cards for every cue.

Tip: **Download .lua** in that dialog saves the snippet as a file, which you can drop into
`~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility/` and
run from `Workspace ▸ Scripts` later without touching the console.

---

## What the web build cannot do

- **No automatic Media Pool reading.** A browser cannot inspect your project. The
  `04 • Media Pool AI` tab still plans a cut and generates the auto-assembly Lua, and Resolve
  reads its own Media Pool when that Lua runs.
- **No automatic silence detection of your audio file.** The Cut Silences tab works from the
  waveform you see in the panel; the generated Lua cuts the timeline to those segments.
- **No “one click, done”.** That is the only thing the desktop build adds.

If you want one-click back later, the desktop build is still in this repo — see
[INSTALL.md](INSTALL.md).

---

## Rebuilding / updating

```bash
node tools/gen-recipes.js    # if you changed presets: regenerate 77 native graphs
node tools/build-web.mjs     # rebuild dist-web/
```

The build copies `resolve-bridge/preset-recipes.json` and the bridge `.lua` into the bundle, so
the “Download Bridge .lua” links keep working on the hosted site too.
