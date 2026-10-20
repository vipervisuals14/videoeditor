import { init, restoreDraft } from "./studio.js";

init().then(() => {
  restoreDraft();
  // Re-check the engine once more in case the app started before FFmpeg settled.
  window.addEventListener("focus", () => {
    document.body.dataset.focused = "1";
  });
});
