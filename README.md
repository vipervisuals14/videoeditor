# PulseVFX Kit — DaVinci Resolve Free 21.1.1 Pop-Up Extension & AI Editor

An all-in-one floating pop-up extension and timeline automation suite built specifically for **DaVinci Resolve Free 21.1.1** (macOS, Windows, Linux) — **no $295 Studio license and no paid third-party plugins (Sapphire/Universe) required.**

Inspired by **StayCreative's VFX Kit 2.0**, **AutoSubs v3.10+**, and **davinci-resolve-lua-mcp**, tailored for:
1. **Music Videos with High-Impact VFX** (7 tabs: *Roto FX, Shakes, Grunge FX, Transitions, Hits, Speed Ramps, CRT* + AI Prompt Builder & Quick-Adjust Sliders)
2. **Cut Silences** (Dead-air stripping + automatic 1.08x jump-cut punch-in zooms & J-cuts for talking-head brand videos)
3. **Subtitles & Social Media Lyric Videos** (Beat-synced kinetic artist lyrics + Hormozi/Pill talking-head word-by-word captions)
4. **Media Pool Smart Auto-Editor** (Reads your open Resolve Media Pool bins & clips and auto-cuts a beat-synced Music Video or Talking-Head Vlog timeline)

---

## Research Findings: How to Build a Pop-Up Plugin for DaVinci Resolve Free 21.1.1

### 1. How StayCreative VFX Kit Works
StayCreative's VFX Kit (`staycreative.store/pages/vfx-kit-extension`, created by *LurkingVisuals*) is built around four UX pillars:
- **Categorized Native Presets (7 Tabs):** *Roto FX, Shakes, Grunge FX, Transitions, Hits, Speed Ramps, CRT* built from native host nodes so editors don't need paid Sapphire/Universe plugins.
- **Live Visual Previews:** Hovering/clicking presets shows the exact motion and color vibe before committing.
- **AI Prompt Assistant:** Typing a vibe prompt (*"drill, high energy, 808 shakes on beat, grunge flashes"*) automatically populates effects across the timeline.
- **Quick-Adjust Category Sliders:** Fine-tune category intensity after the AI pass without losing manual edits.

### 2. The DaVinci Resolve Free 21.1.1 Technical Wall (And How We Bypass It)
- In **Resolve 19.1**, Blackmagic locked `UIManager` (Resolve's internal GUI window builder) and `Workflow Integrations` behind Resolve Studio.
- In **Resolve 21.1 / 21.1.1** (Sept/Oct 2026), Blackmagic removed Python (`.py`) script execution from Resolve Free (`Workspace ▸ Scripts` ignores `.py` files) and sandboxed the built-in Lua runtime (`io`, `os.execute`, `require`, and `UIManager` are `nil`).
- **What Remains Open in Resolve Free 21.1.1:**
  - `Workspace ▸ Scripts` still executes `.lua` scripts with full access to `resolve`, `fusion`, `Project`, `MediaPool`, `Timeline`, `AppendToTimeline()`, `AddFusionComp()`, `AddMarker()`, etc.
  - `loadfile()` still executes external Lua table chunks from disk, and `fusion:SetPrefs()` + `fusion:SavePrefs()` still flushes responses to `Fusion.prefs` on disk.
- **Our Solution (`resolve-bridge/VFXKit_ResolveFree_Bridge.lua`):**
  - Uses the **Lua File-Mailbox + `Fusion.prefs` Bridge** (~50ms round-trip latency) paired with this **Floating Pop-Up Web/Desktop UI** and native **Fusion `.setting` Macros** (`fusion-macros/`).

---

## Quick Start (macOS & DaVinci Resolve Free 21.1.1)

```bash
# 1. Install the Lua Bridge & Native Fusion .setting Macros into macOS Resolve paths:
./install-macos-resolve-free.sh

# 2. Start the PulseVFX Pop-Up Panel Server:
npm start
```

3. In **DaVinci Resolve Free 21.1.1**, open your project and click once per session:
   `Workspace ▸ Scripts ▸ VFXKit_ResolveFree_Bridge`
4. Keep the **PulseVFX Pop-Up Panel** open next to Resolve (use **Pop-Up Dock Mode** in the top bar for a narrow floating strip).

---

## TouchDesigner-Style TOP Distortions, Transitions, Intensity & Keyframes

The panel now ships **72 presets across 10 categories**, including a real generative
canvas runtime (`public/touchdesigner.js`) that runs entirely in the browser — no
plugins, no Resolve Studio.

### TouchDesigner TOPs (12)
| Preset | Emulates |
| --- | --- |
| TD Simplex UV Displace TOP | `Noise TOP (Simplex 4D) ▸ Displace TOP` |
| Feedback Slope Loop TOP | `Feedback TOP ▸ Transform ▸ Level` |
| Blob Track CV Telemetry | `Threshold ▸ Blob Track ▸ Info CHOP` (bboxes, centroids, vectors) |
| Rutt-Etra Z-Scanline Extrusion | 1978 Rutt-Etra scanline luma→Z displacement |
| Luma Pixel-Sort Slicer | luma-threshold vertical pixel sorting |
| Slit-Scan Time Machine | temporal slit-scan curtain |
| Reaction-Diffusion Edge Melt | Gray-Scott style organic melt |
| ASCII Matrix Raster | `CHOP to DAT ▸ Text TOP` glyph raster |
| Kaleidoscope Mirror TOP | 8-wedge polar mirroring |
| Optical Flow Vector Warp | curl-noise advection + vector field |
| Chladni Cymatic Plate | standing-wave nodal displacement map |
| Datamosh Macroblock Drift | P-frame macroblock hold/displace |

### Data & Print TOPs (8) — reference-matched monochrome family
Built from the supplied TouchDesigner reference set (data/print corner of TOP work):
| Preset | Reference mechanic |
| --- | --- |
| Band-Split Slice Cabinet | horizontal slab decomposition, per-slab noise offset, lenticular rib screen, dark plinth + vignette |
| Lenticular Rib Line-Screen | full-frame vertical rib sheet (dark rib + bright lens crest) over a toned mono plate |
| Barcode Block Halftone | crisp white horizontal bars whose length = cell luminance, 48×30 grid |
| Bayer 8×8 Ordered Dither | true ordered-dither 1-bit print conversion, auto-levelled plate |
| Flow-Field Stipple Portrait | frame-space grain lattice (identical at 1080p and 4K), dot density + size following auto-levelled luma, contour-tangent shear |
| Contour Ring Stipple | dots placed on the iso-luma contours of the plate — the field literally traces the subject's topography |
| Copperplate Engrave Hatch | real burin hatch: one 34° line field masked into three tone bands (+ cross-hatch in shadow), stroke **weight** builds tone |
| Flow Dash Glyph Field | oriented dashes following the image gradient, length tracking luma |

![Data & Print TOP family](docs/data-print-presets.png)

### Glitch & Bitmap TOPs (8) — degraded-signal family
Matched to the second reference set (ink prints, luma-key cut-outs, bitmap posters,
smears and chroma ghosts). Same rules as the rest: intensity 0–200% + keyframes.

| Preset | Reference mechanic |
| --- | --- |
| Ink Stipple Print | inverted plate: black ink specks on white stock, density from tone + contour emphasis, occasional drag ticks |
| Luma-Key Silhouette Streak | hard luma key to pure white, horizontal trail streaks tearing off the edges, sensor grain |
| Palette Mosaic Quantize | resolution-crushed blocks posterised to a 5-colour palette with tone-banded assignment |
| Directional Zoom Smear | 16-tap normalised zoom smear + single-hue green duotone with forest falloff |
| Datamosh Text Echo | macroblock P-frame smear with periodic hard tears, a rust mid-band wash and red/cyan offset ghosts |
| Newsprint Ripple Halftone | true halftone dot screen whose pitch grows with the frame (dots stay a visible screen at 4K) with a ripple warp slicing through it |
| Window Slice Displace | rectangular window carved out and refilled with sliced, chroma-boosted duplicates |
| Chroma Bleed Ghost | duotone field with magenta/cyan edge-difference ghosts and tear bands |

![Glitch & Bitmap TOP family](docs/glitch-bitmap-presets.png)

---

## 4K Export Verification (all 72 presets)

Every preset was rendered at a true **3840×2160** with `TD_ENGINE.setQuality('export')`
and inspected at **1:1 pixel crops** — not thumbnails, not upscales. The pass found and
fixed a whole class of "looks fine at 720p, falls apart at 4K" bugs:

| Bug class | What went wrong | Fix |
| --- | --- | --- |
| Print screens authored in buffer pixels | stipple / halftone / dither lattices became sub-pixel noise at 4K, so tone survived but the texture vanished | screens are now authored in **frame pixels** (`rpx()` / a resolution-aware pitch) and dot radius scales with the pitch, so the screen frequency reads the same at 1080p and 4K |
| Fixed-pixel line drawing | lenticular ribs, engrave hatch and scan lines turned into 1px moiré wash across the frame | ribs are a repeating **lens-shading pattern** (multiply) at a frame-space pitch; hatch strokes scale with the cell |
| Flat-bar rib screen | black bars down the whole frame read as a barcode, not glass | replaced with a cosine lens ramp composited in `multiply`, so ribs survive inside blown highlights |
| Feedback drawn onto itself | `ctx.drawImage(fb)` through a transform is undefined in canvas and produced stair-step garbage once the source moved | new `feedbackStep()` transforms the previous buffer into a scratch canvas first, then rebuilds it as a bounded **EMA** `FB = FB·decay + src·(1−decay)` |
| Low-key footage killed print effects | a dark plate sits entirely below the ink threshold, so stipple / halftone / engrave / mosaic rendered almost black | every tonal shader now runs **auto-levels** (5–98 percentile of the current plate, with a small raw blend) before mapping tone |
| Soft 1400px mono plates | band-slice / lenticular plates were upscaled ~3× and looked like oil paintings | plate now renders at ~45–60% of frame width (up to 2600px) with a filmic shoulder instead of clipping |
| Skyline in the transition B-plate | every transition preview slid a bar-chart of black rectangles over the shot | replaced with an atmospheric plate (curved horizon, lone figure, sun, bokeh) |

Token/technique changes made during the pass: `Contour Ring Stipple` was rebuilt to place
dots on the **iso-luma contours** of the plate (it previously drew literal concentric
circles), `Copperplate Engrave Hatch` became a real burin plate (one line field masked into
three tone bands, cross-hatched in shadow, stroke weight carrying tone), `ASCII Matrix
Raster` became a true full-frame glyph raster with a gamma-lifted ramp, and
`Datamosh Text Echo` was rebuilt around a mono plate + rust mid-band + red/cyan ghosts.

![All 72 presets rendered at 3840x2160](docs/4k-verification.png)

### Measured cost (Node + Skia, CPU only, one core — a Mac is several times faster)

| Path | Resolution | Total for all 72 | Average | Worst |
| --- | --- | --- | --- | --- |
| Interactive preview | 1280×720, `preview` | ~0.6 s | ~8 ms | 30 ms (`td_lenticular`) |
| Full export render | 3840×2160, `export` | ~6.0 s | ~83 ms | 459 ms (`td_dirsmear`) |

The panel renders cards at preview quality, so scrolling and slider drags stay interactive;
export quality is used for the large preview, the still grab and the Resolve render.

---

### Transitions & Morphs (8)
Luma-Wipe Exposure Dissolve · Feedback Zoom Morph · Slit-Scan Curtain Wipe ·
Refractive Glass Push · Mirror Fold Flip · Chromatic Split Slide ·
Rolling Shutter Skew Wipe · Blob Track Contour Morph.

### Intensity + keyframes on every effect and every transition
- **Per-card intensity slider (0–200%)** on all 72 presets — drag it and the live
  preview reacts immediately.
- **Interactive Keyframe & Intensity Curve Inspector** — click/drag on the curve to
  place and move keyframes (Shift-click or right-click deletes), with auto envelopes
  (`Transition Peak`, `Ramp In`, `Impact Decay`, `CHOP Sine LFO`), prev/next keyframe
  navigation, and a live evaluated-intensity readout that follows the playhead.
- **Per-card `◆ KF` button** stamps a keyframe at the playhead without leaving the grid;
  the badge shows how many keyframes that effect owns.
- **Native export:** pressing Apply sends the whole lane to the Resolve Free 21.1.1 Lua
  bridge, which compiles it into a `comp:BezierSpline()` keyframe table on the Fusion
  node (`spline:SetKeyFrames({ [frame] = { value }, ... })`).
