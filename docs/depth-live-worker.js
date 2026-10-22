/* ============================================================================
 * PulseVFX — LIVE DEPTH WORKER
 * ----------------------------------------------------------------------------
 * Estimating a 480x270 depth map costs ~70 ms of pure CPU. Doing that on the
 * main thread five times a second stalls the 60 fps monitor, which is exactly
 * what "live depth" must not do. So the estimate runs here, off-thread, and the
 * finished Float32Array is transferred back.
 *
 * Protocol (one message at a time, the panel coalesces):
 *   in : { id, data: ArrayBuffer(RGBA), width, height, opts }
 *   out: { id, map: ArrayBuffer(Float32), width, height }  or  { id, error }
 * ==========================================================================*/
/* global self, importScripts, DEPTH_ENGINE */
'use strict';

importScripts('depth.js');

self.onmessage = function (e) {
  var msg = e.data || {};
  var id = msg.id;
  try {
    if (!self.DEPTH_ENGINE) throw new Error('depth engine missing');
    var data = new Uint8ClampedArray(msg.data);
    var map = self.DEPTH_ENGINE.estimate(
      { data: data, width: msg.width, height: msg.height },
      msg.opts || {}
    );
    self.postMessage({ id: id, map: map.buffer, width: msg.width, height: msg.height }, [map.buffer]);
  } catch (err) {
    self.postMessage({ id: id, error: String((err && err.message) || err) });
  }
};
