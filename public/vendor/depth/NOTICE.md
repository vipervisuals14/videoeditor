# Vendored depth model + runtime

These files let the panel generate a **real** depth map in the browser instead of
guessing one from brightness.

## What is here

| File | Size | What it is |
| --- | --- | --- |
| `depth-anything-v2-small-int8.onnx` | 26 MB | Depth Anything V2 **Small**, transformer fusions applied, quantised to int8 |
| `ort.min.mjs` | 360 KB | ONNX Runtime Web 1.30 (ESM build) |
| `ort-wasm-simd-threaded.wasm` | 14 MB | the WASM backend the runtime executes on |
| `ort-wasm-simd-threaded.mjs` | 24 KB | the WASM loader the runtime needs alongside it |

Total **40 MB**, fetched **once** and then served from the browser cache. Nothing
is downloaded unless someone chooses *AI depth* in `06 • Depth Map`; the panel's
default engine needs no download at all.

## Provenance and licence

- **Model**: `onnx-community/depth-anything-v2-small` (Apache-2.0), exported with
  ONNX Runtime's transformer fusions by `en970/depth-realtime`, quantised to int8.
  Depth Anything V2 is by Lihe Yang et al. — https://depth-anything-v2.github.io
- **Runtime**: ONNX Runtime Web, MIT licence — https://github.com/microsoft/onnxruntime

Both licences permit redistribution. The weights are unchanged by us; only the
int8 quantisation (done by the upstream project) reduces precision, which is why
the panel reports correlation against fp32 rather than claiming bit-exactness.

## Verified numbers

Measured in this repo, not quoted from a datasheet:

- **Accuracy vs the fp32/Python reference** on a 518×294 input: correlation
  **0.9986**, mean absolute error 0.085 on a 0.55–4.6 output range. The residual
  is image resampling (PIL bicubic vs canvas), not a broken pipeline.
- **Speed**: 1.4 s to load the session, 5 s for one inference on a single WASM
  thread (this dev container). A Mac is several times faster, and the work runs
  in a worker so the monitor keeps its frame rate either way.
- **Input contract**: `pixel_values`, float32 `[1, 3, H, W]`, ImageNet
  normalisation, both dimensions a multiple of 14, long side ≈ 518.
- **Output**: `predicted_depth`, `[1, H, W]`, **higher = nearer**. The panel
  inverts this to its own convention (0 = near, 1 = far).

## Why these exact files

Depth Anything V2 Small is the smallest model in the family that still produces
the look a colourist expects: crisp silhouettes, smooth interiors, correct
ground-plane recession. The int8 build is a quarter of the fp32 size at the cost
of a little fine detail, which the panel compensates for with a guided-filter
refinement against the source luma.
