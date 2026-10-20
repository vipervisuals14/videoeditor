# Reference research: VFX Kit (StayCreative / LurkingVisuals)

Researched 2026-10-20 from:

- <https://staycreative.store/pages/vfx-kit-extension>
- <https://staycreative.store/products/vfx-kit-extension>
- store schema/variant data exposed on the product page
- Resolve template-install documentation (DRFX / Fusion `.setting`)

## What it is

A paid effects library plus a prompt-driven "AI Assistant", sold as an extension
for **After Effects and Premiere Pro**. It is not a standalone editor and it does
not analyse footage; it inserts pre-made effect presets into an existing timeline.

| Item | Detail |
|---|---|
| Contents | 175+ presets in 7 categories |
| Categories | Roto FX, Shakes, Grunge FX, Transitions, Hits, Speed Ramps, CRT |
| AI Assistant (v2.0) | Type a style prompt; it adds "up to 200+ effects" across the timeline in minutes |
| Workflow | Open clip → prompt or browse → apply → tweak intensity/density → hand-place extras |
| Price | $77 (v1.0) / $147 (v2.0 AI) per store variants; lifetime updates, 14-day refund |
| Install (Adobe) | `.zxp` extension via a ZXP installer |
| Claimed compatibility | After Effects 2025–2026, Premiere Pro 2024–2026; no third-party plugins |

The marketing is explicit that the AI gets you "75–90% there" and the rest is the
tweaker and manual placement. In other words: **preset selection and placement
automation**, not generative video.

## The DaVinci Resolve question

The page shows Resolve logos next to its buttons, and the store's variant data
lists:

- `VFX KIT - v1.0 (175+ presets) / DaVinci Resolve` — $77
- `VFX KIT - v2.0 (AI) / DaVinci Resolve` — $147

But the description, requirements block, and FAQ all describe an Adobe `.zxp`
extension for AE/PR. Those cannot both be true in the same package:

- Resolve does not load ZXP extensions and has no third-party panel SDK.
- A Resolve build of a pack like this would have to be a **DRFX bundle /
  Fusion macros** (Effects Library entries you drag onto clips), not an AI panel.
- Prompt-to-timeline automation inside Resolve requires the scripting API, which
  is Studio-only from 21.1 and was already Studio-only for external callers.

**Conclusion:** the Resolve SKU is almost certainly a Fusion template pack
(possibly without the AI assistant), while the AI extension is Adobe-only.
Anyone buying for Resolve should confirm with the seller exactly what is delivered
and whether any prompt automation exists there.

## The UX worth copying

1. **Style prompt → draft.** One sentence ("drill", "cinematic", "retro") selects
   a coherent recipe instead of making the editor hunt through menus.
2. **Categorised library.** Seven buckets with live previews, not 175 loose files.
3. **Draft, then tweak.** Per-category intensity/density controls; the assistant
   leaves untouched categories alone.
4. **Editable output.** Everything lands as normal presets/keyframes, not a baked
   render.
5. **Hand placement is still expected.** The tool speeds up the first 75%, it does
   not replace taste.

That is the same shape as Cutline's mode/look presets, just at the effect layer
instead of the edit layer.

## What is possible on Resolve 21.1.1 Free

| Capability | Free 21.1.1 | How Cutline could deliver it |
|---|---|---|
| Categorised effect library | Yes | DRFX bundle + Fusion macros (Shakes, CRT, Grunge, Hits, Transitions) |
| Native, editable effects | Yes | `.setting` / `.drfx` assets applied by the user in the Effects Library |
| Prompt → recipe selection | Yes, outside Resolve | Local studio maps a prompt to a recipe (pacing, transitions, overlays, caption style, effect suggestions) |
| Auto-apply native Fusion effects to clips | **No** | Needs scripting, gated to Studio on 21.1 |
| Auto overlay effects (grunge, CRT, leaks, hits, flashes) | Yes | Render alpha movies and place them on OTIO tracks, as Cutline already does for transitions/HUD |
| Camera shake on the footage | Only baked | Render transformed source clips, or ship a Fusion macro the user drags |
| Speed ramps | Only baked | Render retimed clips, or ship a Fusion retime macro |
| Roto / masks | Manual | Not automatable without Studio scripting |
| Live previews inside Resolve | **No** | Previews live in Cutline's local studio, or as rendered thumbnails |
| Dockable AI panel in Resolve | **No** | No UI toolkit on Free; would be Studio-only |

## Three honest directions

### A. Cutline "VFX recipe" packs (Free-friendly, native)

- DRFX/Fusion macro pack for shakes, CRT, grunge, hits, transitions.
- Prompt in the Cutline studio maps to a recipe: cut pacing, transition choice,
  overlay layers, caption style, and a short list of macros to drag.
- The OTIO build places all overlay effects automatically; native macros remain
  one drag each.
- Output stays editable and works on Free.

### B. Baked VFX pipeline (Free-friendly, fully automatic, less editable)

- Cutline renders effect passes (shake, ramp, hit, CRT) into new media and lays
  them into the OTIO.
- One prompt → finished draft, closest to the VFX Kit demo experience.
- Cost: rendered intermediates, slower builds, effects no longer parameter-editable
  in Resolve.

### C. Studio-only automation (closest to the product, requires $299)

- Script applies Fusion macros/effects directly to timeline clips and builds the
  whole edit inside Resolve.
- Only path to true one-click native effects inside Resolve.

## Open questions for the user

1. Is the appeal the **effects library** or the **prompt-to-draft automation**?
2. Which genre first: music video / sports-style hype, or the existing
   talking-head and travel work?
3. Is "editable in Resolve" non-negotiable, or is a baked draft acceptable if it
   saves hours?
4. Would Studio ever be on the table, or must this stay Free?
