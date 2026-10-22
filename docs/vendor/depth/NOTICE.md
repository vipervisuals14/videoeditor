# Vendored depth model + runtime

These files let the panel generate a **real** depth map in the browser instead of
guessing one from brightness.

## What is here

| File | Size | What it is |
| --- | --- | --- |
| `depth-anything-v2-small-fp16.onnx` | 49 MB | Depth Anything V2 **Small**, transformer fusions applied, fp16 weights |
| `ort.wasm.min.mjs` | 52 KB | ONNX Runtime Web 1.30, **wasm-only** ESM build |
| `ort-wasm-simd-threaded.wasm` | 14 MB | the WASM backend the runtime executes on |
| `ort-wasm-simd-threaded.mjs` | 24 KB | the WASM loader the runtime needs alongside it |

Total **63 MB**, fetched **once** and then served from the browser cache. Nothing
is downloaded unless someone switches the depth engine to AI; the panel's
*Fast estimate* engine needs no download at all.

## Provenance and licence

- **Model**: `onnx-community/depth-anything-v2-small` (Apache-2.0), exported with
  ONNX Runtime's transformer fusions and an fp16 conversion by `en970/depth-realtime`.
  Depth Anything V2 is by Lihe Yang et al. — https://depth-anything-v2.github.io
- **Runtime**: ONNX Runtime Web, MIT licence — https://github.com/microsoft/onnxruntime

Both licences permit redistribution. The weights are unchanged by us.

## Why fp16 and not int8

An int8 quantised build of the same model was shipped first (26 MB). It was
measured against this fp16 build and then dropped, because fp16 won on both
axes at once:

| | int8 (26 MB) | **fp16 (49 MB)** |
| --- | --- | --- |
| Agreement with a 1036 px reference pass | 0.8376 | **0.8585** |
| High-frequency energy vs that reference | 2.688× | **1.376×** — int8 was adding quantisation noise, not detail |
| Inference, single WASM thread | 4.2 s (median of 3) | **2.5 s** (median of 3) |
| Session load | 594 ms | **371 ms** |

So the smaller file was slower *and* grainier. Shipping it as a "budget" option
would have been a worse product with an extra 26 MB in the repo.

## The 2× pass

`AI high detail` is the **same** model run at a 1036 px long side instead of 518.
No extra download, roughly 4× the compute, and noticeably more structure in
hair, foliage and thin edges. It is a separate card rather than the default
because a 4× slower pass on every live refresh would make the tab feel broken.

## Verified numbers

Measured in this repo, not quoted from a datasheet (`node tools/test_depth_ai.mjs`):

- **Accuracy vs the Python reference** on a real photograph: correlation
  **0.9991**, mean absolute error 0.0104. The residual is image resampling
  (PIL bicubic vs canvas), not a broken pipeline.
- **Ordering** on a procedurally rendered perspective scene: foreground block
  **8.61** > near floor **5.30** > sky **0.00** (model convention, higher = nearer).
  After inversion to the panel's 0 = near: block **0.016**, sky **1.000**.
- **Speed**: ~0.4 s to load the session, ~2.5 s for one inference on a single
  WASM thread (this dev container). A Mac is several times faster, and the work
  runs in a worker so the monitor keeps its frame rate either way.
- **Input contract**: `pixel_values`, float32 `[1, 3, H, W]`, ImageNet
  normalisation, both dimensions a multiple of 14, long side 518 (or 1036).
- **Output**: `predicted_depth`, `[1, H, W]` — three dimensions, not four. Reading
  it as `[1, C, H, W]` yields `NaN` for every pixel; that bug was caught by these
  tests, which now fail loudly on any non-finite value.
