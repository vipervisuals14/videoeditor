import { api } from "./api.js";
import {
  $, $$, copyText, el, escapeHTML, formatDate, formatDuration,
  segmented, selectValue, toast, updateRangeFill, wireRange,
} from "./ui.js";

const MODES = {
  social: {
    eyebrow: "Client social",
    title: "Cut the talk.<br />Keep the <em>good</em> part.",
    copy: "Drop in a talking-head clip. Cutline finds the pauses, sets bold captions, and hands you a timeline that opens in Resolve — no scripting, no Studio licence, no round trip.",
    sample: "This one change made the whole shoot",
  },
  vlog: {
    eyebrow: "Long-form travel",
    title: "Keep the road.<br />Lose the <em>dead air</em>.",
    copy: "A day of travel footage becomes a paced film: gentle silence trims, a warm title card, chapter markers per location, and captions that read like a journal.",
    sample: "The light in Lisbon at seven in the morning",
  },
  music: {
    eyebrow: "Beat-driven",
    title: "Cut picture<br />to the <em>beat</em>.",
    copy: "Drop the song and your takes. Cutline detects the tempo, lays the picture on the bar grid, and puts flash accents on the downbeats — then hands back an editable timeline.",
    sample: "We were never going to make it home",
  },
};

export const state = {
  config: null,
  health: null,
  mode: "social",
  sources: [],
  srt: null,
  music: null,
  overlay: null,
  analysis: {},
  beat: null,
  style: null,
  stylePreset: "creator",
  transitionPreset: "light_leak",
  waveSourceId: null,
  projectId: null,
  project: null,
  resultProject: null,
  polling: null,
  previewUrl: null,
  previewSeed: Math.random().toString(36).slice(2, 8),
  processing: false,
};

let previewTimer = null;
let analysisTimer = null;
let lastPreviewKey = "";

/* ------------------------------------------------------------------ boot */

export async function init() {
  try {
    const [config, health] = await Promise.all([api.get("/api/config"), api.get("/api/health")]);
    state.config = config;
    state.health = health;
    $("#foot-version").textContent = `v${config.version}`;
    const engine = $("#engine-pill");
    const engineText = $("#engine-text");
    if (health.ffmpeg && !health.ffmpeg.startsWith("not found")) {
      engineText.textContent = "Resolve import ready";
      engine.classList.remove("warn");
    } else {
      engineText.textContent = "FFmpeg missing";
      engine.classList.add("warn");
      toast("FFmpeg was not found. Reinstall Cutline with ./install.sh", "error", 9000);
    }
    if (!health.asr.available) {
      engineText.textContent = "Captions: SRT mode";
      engine.title = "The optional speech model isn't installed — upload an SRT or install faster-whisper.";
    }
  } catch (error) {
    toast(`Cutline could not reach its engine: ${error.message}`, "error", 12000);
    return;
  }

  buildStyleGrid();
  buildFontSelect();
  buildTransitionGrid();
  buildAspectGrid();
  bindModes();
  bindFootage();
  bindSilence();
  bindCaptions();
  bindMotion();
  bindDelivery();
  bindResult();
  bindProjects();
  bindGuide();
  bindRail();

  applyMode("social", { first: true });
  await refreshProjects();
}

/* ------------------------------------------------------------------ modes */

function bindModes() {
  $$("#mode-tabs .mode-tab").forEach((button) => {
    button.addEventListener("click", () => applyMode(button.dataset.mode));
  });
}

function applyMode(mode, options = {}) {
  if (!MODES[mode]) mode = "social";
  state.mode = mode;
  $$("#mode-tabs .mode-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  const text = MODES[mode];
  $("#hero-eyebrow").textContent = text.eyebrow;
  $("#hero-title").innerHTML = text.title;
  $("#hero-copy").textContent = text.copy;

  const defaults = state.config?.defaults?.[mode];
  if (defaults) applyConfigToDom(defaults, options);

  $("#vlog-panel").classList.toggle("hide", mode !== "vlog");
  $("#music-panel").classList.toggle("hide", mode !== "music");

  const label = $("#transitions-label");
  const copy = $("#transitions-copy");
  const freqLabel = $("#tr-frequency")?.closest(".field")?.querySelector("label");
  const scopeField = $("#tr-scope")?.closest(".field");
  if (mode === "music") {
    label.textContent = "Beat accents";
    copy.textContent = "Flash, glitch, or whip accents landing on the bar grid.";
    if (freqLabel) freqLabel.textContent = "Accent every N cuts";
    if (scopeField) scopeField.classList.add("hide");
    $("#tr-frequency").max = "16";
  } else {
    label.textContent = "Add transitions";
    copy.textContent = mode === "vlog"
      ? "Long, soft blends between locations."
      : "Short light accents over the busiest cuts.";
    if (freqLabel) freqLabel.textContent = "Every N cuts";
    if (scopeField) scopeField.classList.remove("hide");
    $("#tr-frequency").max = "12";
  }

  if (mode === "music") {
    $("#motion-title").textContent = "Rhythm";
    $("#motion-desc").textContent = "The song, the grid, and the accents on the beat";
  } else if (mode === "vlog") {
    $("#motion-title").textContent = "Titles & motion";
    $("#motion-desc").textContent = "The opening card, chapter stops, and blends between places";
  } else {
    $("#motion-title").textContent = "Motion";
    $("#motion-desc").textContent = "Transitions and accents between takes";
  }

  schedulePreview(40);
  updateMetrics();
  updateModeNote();
  saveDraft();
}

function applyConfigToDom(cfg, options = {}) {
  const captions = cfg.captions || {};
  const silence = cfg.silence || {};
  const transitions = cfg.transitions || {};
  const music = cfg.music || {};
  const vlog = cfg.vlog || {};
  const output = cfg.output || {};

  if (cfg.aspect) setAspect(cfg.aspect);
  selectValue($("#fps-select"), cfg.fps ?? "auto");
  selectValue($("#resolution-select"), output.resolution || "1080");
  if (options.first && !$("#project-name").value) {
    $("#project-name").value = cfg.name || "";
  }

  $("#silence-enabled").checked = silence.enabled !== false;
  segmented($("#seg-pacing"), silence.pacing || "balanced");
  selectValue($("#silence-threshold"), silence.threshold_db ?? "");
  const padding = silence.padding ?? null;
  const pacingDefaults = { gentle: 0.24, balanced: 0.15, aggressive: 0.08 };
  $("#silence-padding").value = padding ?? pacingDefaults[silence.pacing || "balanced"] ?? 0.15;
  wireRange($("#silence-padding"), $("#silence-padding-out"), (value) => `${Number(value).toFixed(2)}s`);
  updatePacingHint();

  $("#caption-enabled").checked = captions.enabled !== false;
  const source = captions.source || "auto";
  if (source === "auto") {
    setNote(state.health?.asr?.available
      ? "Transcription runs privately on this machine with faster-whisper. First run downloads a small model."
      : "Automatic captions need the optional speech model, which is not installed in this copy. Add an SRT below, or run ./install.sh and restart — the rest of the cut builds either way.",
      state.health?.asr?.available ? "" : "warn");
  } else {
    setNote("");
  }
  segmented($("#seg-caption-source"), source);
  selectValue($("#caption-delivery"), captions.delivery || "overlay_srt");
  selectValue($("#caption-timing"), captions.timing || "source");
  showCaptionBlocks(source);

  applyStyle(captions.style || null, captions.preset || "creator");

  $("#transitions-enabled").checked = transitions.enabled !== false;
  state.transitionPreset = transitions.preset || "light_leak";
  highlightedTransitions();
  $("#tr-intensity").value = Math.round((transitions.intensity ?? 0.72) * 100);
  $("#tr-duration").value = transitions.duration ?? 0.5;
  $("#tr-frequency").value = transitions.frequency ?? 3;
  selectValue($("#tr-scope"), transitions.scope || "cuts");
  wireRange($("#tr-intensity"), $("#tr-intensity-out"), (value) => `${Math.round(value)}%`);
  wireRange($("#tr-duration"), $("#tr-duration-out"), (value) => `${Number(value).toFixed(2)}s`);
  wireRange($("#tr-frequency"), $("#tr-frequency-out"), (value) => `${value}`);
  $("#custom-transition-block").classList.toggle("hide", state.transitionPreset !== "custom");

  $("#vlog-title").value = vlog.title || "";
  $("#vlog-location").value = vlog.location || "";
  $("#vlog-date").value = vlog.date || "";
  $("#vlog-title-card").checked = vlog.title_card !== false;
  $("#vlog-chapters").checked = vlog.chapter_cards !== false;
  $("#vlog-title-seconds").value = vlog.title_seconds ?? 4;
  wireRange($("#vlog-title-seconds"), $("#vlog-title-seconds-val"), (value) => `${Number(value).toFixed(1)}s`);

  if (music.bpm) $("#music-bpm").value = music.bpm;
  selectValue($("#music-bpc"), music.beats_per_cut ?? 4);
  selectValue($("#music-order"), music.order || "sequence");
}

function updateModeNote() {
  const notes = {
    social: [
      ["good", "Silence pass runs on every take, then captions re-time themselves to the new cut."],
      ["", "Vertical 9:16 with large type — the safe area is already marked in the preview."],
      ["", "Captions land as transparent movies on V3, so you can still nudge a single card."],
    ],
    vlog: [
      ["good", "Silence removal is gentler by default so the film keeps its breathing room."],
      ["", "One chapter card per source clip, titled from the file name."],
      ["", "Widescreen 16:9 with journal-style captions and soft location blends."],
    ],
    music: [
      ["good", "Detected tempo becomes the cut grid; each shot advances on the bar."],
      ["", "Flash and glitch accents can land every N bars."],
      ["", "Lyrics can be transcribed or loaded from an .lrc / .srt file."],
    ],
  }[state.mode] || [];
  const host = $("#preview-notes");
  host.innerHTML = "";
  notes.forEach(([kind, text]) => {
    host.append(el("div", { class: `note ${kind}`.trim() }, [
      icon(kind === "good" ? "check" : "dot"),
      el("span", { text }),
    ]));
  });
}

/* ------------------------------------------------------------------ footage */

function bindFootage() {
  const drop = $("#drop-video");
  const input = $("#file-video");
  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") input.click();
  });
  ["dragenter", "dragover"].forEach((type) => drop.addEventListener(type, (event) => {
    event.preventDefault();
    drop.classList.add("over");
  }));
  ["dragleave", "drop"].forEach((type) => drop.addEventListener(type, (event) => {
    event.preventDefault();
    drop.classList.remove("over");
  }));
  drop.addEventListener("drop", (event) => {
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length) uploadFiles(files, "video");
  });
  input.addEventListener("change", () => {
    const files = Array.from(input.files || []);
    if (files.length) uploadFiles(files, "video");
    input.value = "";
  });

  $("#btn-demo").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Generating demo…";
    try {
      const demo = await api.post("/api/demo", {});
      const inspected = await api.post("/api/inspect", { paths: [demo.clip] });
      const item = inspected.items?.[0];
      if (!item || item.error) throw new Error(item?.error || "The demo clip could not be read.");
      addSource({ ...item, path: demo.clip, name: "Lisbon demo · talking head" });
      addCaptionFile({ path: demo.srt, name: "lisbon_demo.srt", cues: 6, format: "srt" });
      if (state.mode === "social") segmented($("#seg-caption-source"), "file");
      showCaptionBlocks("file");
      toast("Demo footage added — captions are already timed.", "ok");
    } catch (error) {
      toast(`Demo unavailable: ${error.message}`, "error", 7000);
    } finally {
      button.disabled = false;
      button.textContent = "Add demo footage";
    }
  });

  $("#btn-desktop").addEventListener("click", () => {
    const row = $("#path-row");
    const hidden = row.style.display === "none" || row.classList.contains("hide");
    row.classList.toggle("hide", !hidden);
    row.style.display = hidden ? "block" : "none";
    if (hidden) $("#path-input").focus();
  });

  $("#btn-scan").addEventListener("click", async () => {
    const path = $("#path-input").value.trim();
    if (!path) return;
    const button = $("#btn-scan");
    button.disabled = true;
    button.textContent = "Scanning…";
    try {
      const result = await api.post("/api/sources/scan", { path });
      const media = (result.items || []).filter((item) => item.kind === "video");
      if (!media.length) {
        toast("No video files in that folder.", "error");
        return;
      }
      const inspected = await api.post("/api/inspect", { paths: media.map((item) => item.path) });
      const good = (inspected.items || []).filter((item) => !item.error);
      good.forEach((item) => addSource(item));
      toast(`Added ${good.length} clip${good.length === 1 ? "" : "s"} from that folder.`, "ok");
    } catch (error) {
      toast(error.message, "error", 7000);
    } finally {
      button.disabled = false;
      button.textContent = "Scan folder";
    }
  });
}

async function uploadFiles(files, kind) {
  const drop = kind === "video" ? $("#drop-video") : null;
  for (const file of files) {
    const label = drop?.querySelector("b");
    const original = label?.textContent;
    try {
      if (label) {
        label.textContent = `Uploading ${file.name}…`;
        drop.style.pointerEvents = "none";
      }
      const data = await api.upload(file, kind);
      if (kind === "video") {
        addSource(data);
      } else if (kind === "captions") {
        addCaptionFile(data);
      }
    } catch (error) {
      toast(`${file.name}: ${error.message}`, "error", 8000);
    } finally {
      if (label) label.textContent = original;
      if (drop) drop.style.pointerEvents = "";
    }
  }
}

function addSource(item) {
  if (!item || !item.path) return;
  if (state.sources.some((source) => source.path === item.path)) {
    toast("That clip is already in the list.");
    return;
  }
  const source = {
    id: `src${state.sources.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
    path: item.path,
    name: item.name || item.path.split(/[\\/]/).pop(),
    sample: item.sample || null,
    duration: Number(item.duration) || 0,
    width: item.width || 0,
    height: item.height || 0,
    fps: item.fps || 30,
    has_audio: Boolean(item.has_audio),
    has_video: item.has_video !== false,
    size: item.size || 0,
    codec: item.codec || "",
    thumb: item.thumb || null,
  };
  state.sources.push(source);
  if (!state.waveSourceId) state.waveSourceId = source.id;
  renderMedia();
  renderWave();
  refreshAnalysis();
  updateMetrics();
  saveDraft();
}

function removeSource(id) {
  state.sources = state.sources.filter((source) => source.id !== id);
  delete state.analysis[id];
  if (state.waveSourceId === id) state.waveSourceId = state.sources[0]?.id || null;
  renderMedia();
  renderWave();
  updateMetrics();
  saveDraft();
}

function moveSource(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= state.sources.length) return;
  const [item] = state.sources.splice(index, 1);
  state.sources.splice(target, 0, item);
  renderMedia();
  refreshAnalysis();
  saveDraft();
}

function renderMedia() {
  const host = $("#media-list");
  host.innerHTML = "";
  $("#media-empty").classList.toggle("hide", state.sources.length > 0);
  $("#pill-footage").classList.toggle("hide", state.sources.length === 0);
  $("#pill-footage").textContent = `${state.sources.length} clip${state.sources.length === 1 ? "" : "s"}`;
  $("#status-footage").classList.toggle("hide", state.sources.length === 0);
  $("#footage-hint").classList.toggle("hide", state.sources.length > 0);

  state.sources.forEach((source, index) => {
    const thumb = source.thumb
      ? el("img", { class: "media-thumb", src: source.thumb, alt: "" })
      : el("div", { class: "media-thumb placeholder", text: source.has_video ? "VIDEO" : "AUDIO" });
    const badges = [
      el("span", { class: "badge", text: formatDuration(source.duration) }),
      el("span", { class: "badge", text: `${source.width || "?"}×${source.height || "?"}` }),
      el("span", { class: "badge", text: `${Number(source.fps || 30).toFixed(2)} fps` }),
      source.has_audio ? el("span", { class: "badge", text: "audio" }) : el("span", { class: "badge warn", text: "no audio" }),
    ];
    const item = el("div", { class: "media-item" }, [
      thumb,
      el("div", { class: "media-meta" }, [
        el("div", { class: "media-name", title: source.path }, source.name),
        el("div", { class: "media-sub" }, badges),
      ]),
      el("div", { class: "media-actions" }, [
        iconButton("up", "Move earlier", () => moveSource(index, -1), index === 0),
        iconButton("down", "Move later", () => moveSource(index, 1), index === state.sources.length - 1),
        iconButton("x", "Remove clip", () => removeSource(source.id), false, true),
      ]),
    ]);
    item.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      state.waveSourceId = source.id;
      renderMedia();
      renderWave();
    });
    if (state.waveSourceId === source.id) item.style.borderColor = "rgba(216,255,62,.35)";
    host.append(item);
  });
}

function iconButton(kind, title, handler, disabled = false, danger = false) {
  const paths = {
    up: '<path d="M12 19V5m0 0-6 6m6-6 6 6"/>',
    down: '<path d="M12 5v14m0 0 6-6m-6 6-6-6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  const button = el("button", {
    class: `icon-btn ${danger ? "danger" : ""}`.trim(),
    title,
    "aria-label": title,
    html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">${paths[kind]}</svg>`,
  });
  button.disabled = disabled;
  if (disabled) button.style.opacity = ".35";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    handler();
  });
  return button;
}

/* ------------------------------------------------------------------ analysis */

function refreshAnalysis() {
  clearTimeout(analysisTimer);
  analysisTimer = setTimeout(runAnalysis, 260);
}

async function runAnalysis() {
  if (!state.sources.length) return;
  const pacing = currentPacing();
  const padding = Number($("#silence-padding").value);
  const threshold = $("#silence-threshold").value;
  try {
    const result = await api.post("/api/analyze", {
      pacing,
      padding,
      sources: state.sources.slice(0, 16).map((source) => ({
        id: source.id, path: source.path,
        threshold_db: threshold === "" ? null : Number(threshold),
        padding,
      })),
    });
    (result.sources || []).forEach((item) => {
      if (item.error) {
        state.analysis[item.id] = { error: item.error };
      } else {
        state.analysis[item.id] = { silence: item.silence, wave: item.wave, duration: item.duration };
      }
    });
    renderMedia();
    renderWave();
    updateMetrics();
    updateSilenceStatus();
  } catch (error) {
    updateSilenceStatus(error.message);
  }
}

function currentPacing() {
  return $("#seg-pacing button.active")?.dataset.value || "balanced";
}

function updateSilenceStatus(errorMessage = "") {
  const status = $("#status-silence");
  status.innerHTML = "";
  if (!state.sources.length) return;
  const stats = estimateCut();
  if (errorMessage) {
    status.append(el("span", { style: "color:var(--danger)", text: errorMessage.slice(0, 60) }));
    return;
  }
  if (!stats.ready) {
    status.append(el("span", { text: "measuring…" }));
    return;
  }
  status.append(el("span", { class: "pill", text: `${stats.cuts} cuts · ${formatDuration(stats.saved)} out` }));
}

function estimateCut() {
  const silenceOn = $("#silence-enabled").checked;
  let sourceSeconds = 0;
  let kept = 0;
  let cuts = 0;
  let measured = 0;
  state.sources.forEach((source) => {
    sourceSeconds += source.duration;
    const analysis = state.analysis[source.id];
    if (!analysis) return;
    measured += 1;
    if (analysis.error) {
      kept += source.duration;
      return;
    }
    if (silenceOn && analysis.silence?.segments?.length) {
      kept += analysis.silence.kept_seconds;
      cuts += Math.max(0, analysis.silence.segments.length - 1);
    } else {
      kept += source.duration;
    }
  });
  return {
    ready: measured === state.sources.length && state.sources.length > 0,
    sourceSeconds,
    kept: Math.min(sourceSeconds, kept),
    saved: Math.max(0, sourceSeconds - kept),
    cuts,
  };
}

/* ------------------------------------------------------------------ waveform */

function renderWave() {
  const source = state.sources.find((item) => item.id === state.waveSourceId) || state.sources[0];
  const img = $("#wave-img");
  const stats = $("#wave-stats");
  const wrap = $("#wave-wrap");
  $$(".wave-cut", wrap).forEach((node) => node.remove());
  if (!source) {
    img.removeAttribute("src");
    $("#wave-source").textContent = "waiting for a clip";
    stats.innerHTML = "<span>Add footage to see the pauses.</span>";
    return;
  }
  $("#wave-source").textContent = source.name;
  const analysis = state.analysis[source.id];
  if (!analysis) {
    stats.innerHTML = "<span>Measuring room tone…</span>";
    return;
  }
  if (analysis.error) {
    stats.innerHTML = `<span style="color:var(--danger)">${escapeHTML(analysis.error)}</span>`;
    return;
  }
  img.src = analysis.wave || "";
  const silence = analysis.silence;
  const duration = silence?.duration || source.duration || 1;
  if ($("#silence-enabled").checked && silence?.removed?.length) {
    silence.removed.forEach(([start, end]) => {
      const bar = el("div", { class: "wave-cut" });
      bar.style.left = `${(start / duration) * 100}%`;
      bar.style.width = `${Math.max(0.2, ((end - start) / duration) * 100)}%`;
      wrap.append(bar);
    });
  }
  const kept = silence?.kept_seconds ?? duration;
  const removed = silence?.removed_seconds ?? 0;
  stats.innerHTML = `
    <span>Clip <b>${formatDuration(duration)}</b></span>
    <span>Kept <b>${formatDuration(kept)}</b></span>
    <span class="saved">−${formatDuration(removed)}</span>
    <span>${silence?.segments?.length ?? 1} speech run${(silence?.segments?.length ?? 1) === 1 ? "" : "s"}</span>
    <span>gate ${silence?.threshold_db != null ? `${silence.threshold_db} dB` : "auto"}</span>
  `;
}

/* ------------------------------------------------------------------ silence controls */

function bindSilence() {
  $("#silence-enabled").addEventListener("change", () => {
    renderWave();
    updateMetrics();
    saveDraft();
  });
  $$("#seg-pacing button").forEach((button) => {
    button.addEventListener("click", () => {
      segmented($("#seg-pacing"), button.dataset.value);
      const defaults = { gentle: 0.24, balanced: 0.15, aggressive: 0.08 };
      $("#silence-padding").value = defaults[button.dataset.value] ?? 0.15;
      wireRange($("#silence-padding"), $("#silence-padding-out"), (value) => `${Number(value).toFixed(2)}s`);
      updatePacingHint();
      refreshAnalysis();
      saveDraft();
    });
  });
  $("#silence-threshold").addEventListener("change", refreshAnalysis);
  $("#silence-padding").addEventListener("change", refreshAnalysis);
  $("#silence-padding").addEventListener("input", () => {
    wireRange($("#silence-padding"), $("#silence-padding-out"), (value) => `${Number(value).toFixed(2)}s`);
  });
}

function updatePacingHint() {
  const hints = {
    gentle: "Natural keeps pauses under a second and leaves generous air around speech — best for travel films.",
    balanced: "Tight clips pauses over half a second and keeps a little breath around speech.",
    aggressive: "Surgical strips nearly every gap. Punchy for Shorts, risky for emotional takes.",
  };
  $("#pacing-hint").textContent = hints[currentPacing()] || "";
}

/* ------------------------------------------------------------------ captions */

function bindCaptions() {
  $("#caption-enabled").addEventListener("change", () => {
    $("#caption-controls").style.opacity = $("#caption-enabled").checked ? "1" : ".4";
    $("#caption-controls").style.pointerEvents = $("#caption-enabled").checked ? "" : "none";
    schedulePreview();
    updateMetrics();
    saveDraft();
  });
  $$("#seg-caption-source button").forEach((button) => {
    button.addEventListener("click", () => {
      segmented($("#seg-caption-source"), button.dataset.value);
      showCaptionBlocks(button.dataset.value);
      if (button.dataset.value === "none") {
        setNote("No text will be burned in. You can still export nothing — captions are simply off.");
      }
      if (button.dataset.value === "auto" && state.health && !state.health.asr.available) {
        setNote("The speech model isn't installed in this copy. Install faster-whisper with ./install.sh, or use an SRT.", "warn");
      }
      if (button.dataset.value === "auto" && state.health?.asr?.available) {
        setNote("Transcription runs privately on this machine. First run downloads a small model (75–500 MB).");
      }
      if (button.dataset.value === "file") {
        setNote("SRT, VTT, and LRC are supported. LRC files are ideal for lyric videos.");
      }
      schedulePreview();
      saveDraft();
    });
  });

  const srtDrop = $("#drop-srt");
  const srtInput = $("#file-srt");
  srtDrop.addEventListener("click", () => srtInput.click());
  srtDrop.addEventListener("dragover", (event) => {
    event.preventDefault();
    srtDrop.style.borderColor = "rgba(216,255,62,.55)";
  });
  srtDrop.addEventListener("dragleave", () => {
    srtDrop.style.borderColor = "";
  });
  srtDrop.addEventListener("drop", (event) => {
    event.preventDefault();
    srtDrop.style.borderColor = "";
    const file = event.dataTransfer?.files?.[0];
    if (file) uploadCaption(file);
  });
  srtInput.addEventListener("change", () => {
    const file = srtInput.files?.[0];
    if (file) uploadCaption(file);
    srtInput.value = "";
  });

  $("#caption-delivery").addEventListener("change", saveDraft);
  $("#caption-timing").addEventListener("change", saveDraft);

  $("#style-grid").addEventListener("click", (event) => {
    const card = event.target.closest(".style-card");
    if (!card) return;
    const preset = state.config.styles.find((item) => item.id === card.dataset.id);
    if (!preset) return;
    state.stylePreset = preset.id;
    applyStyle(preset, preset.id, true);
    state.previewSeed = Math.random().toString(36).slice(2, 8);
    schedulePreview(30);
    saveDraft();
  });

  const styleIds = ["#st-font", "#st-size", "#st-color", "#st-accent", "#st-active", "#st-position",
    "#st-animation", "#st-words", "#st-box", "#st-outline", "#st-lines", "#st-uppercase"];
  styleIds.forEach((selector) => {
    const node = $(selector);
    if (!node) return;
    node.addEventListener("input", () => {
      readStyleIntoState();
      updateStyleReadouts();
      schedulePreview(140);
    });
    node.addEventListener("change", () => {
      readStyleIntoState();
      updateStyleReadouts();
      schedulePreview(40);
      saveDraft();
    });
  });
}

async function uploadCaption(file) {
  try {
    const data = await api.upload(file, "captions");
    addCaptionFile(data);
    segmented($("#seg-caption-source"), "file");
    showCaptionBlocks("file");
    setNote(`${data.cues} captions loaded from ${data.format?.toUpperCase() || "file"}.`);
    toast("Caption file loaded.", "ok");
    saveDraft();
  } catch (error) {
    toast(error.message, "error", 8000);
  }
}

function addCaptionFile(item) {
  state.srt = item;
  const host = $("#srt-item");
  host.classList.remove("hide");
  host.innerHTML = "";
  host.append(el("div", { class: "media-thumb placeholder", text: (item.format || "SRT").toUpperCase() }));
  host.append(el("div", { class: "media-meta" }, [
    el("div", { class: "media-name" }, item.name || "captions.srt"),
    el("div", { class: "media-sub" }, [
      el("span", { class: "badge", text: `${item.cues || 0} cues` }),
      el("span", { class: "badge", text: "timed" }),
    ]),
  ]));
  host.append(iconButton("x", "Remove caption file", () => {
    state.srt = null;
    host.classList.add("hide");
  }));
  schedulePreview();
}

function showCaptionBlocks(source) {
  const showFile = source === "file";
  $("#srt-block").classList.toggle("hide", !showFile);
  $("#caption-controls").style.opacity = $("#caption-enabled").checked ? "1" : ".4";
  $("#caption-controls").style.pointerEvents = $("#caption-enabled").checked ? "" : "none";
}

function setNote(text, kind = "") {
  const note = $("#asr-note");
  note.textContent = text || "";
  note.style.color = kind === "warn" ? "var(--amber)" : "var(--dim)";
}

function buildStyleGrid() {
  const host = $("#style-grid");
  host.innerHTML = "";
  (state.config?.styles || []).forEach((preset) => {
    const sample = `<span class="sample" style="
      font-family:'${preset.font === "playfair" ? "Playfair Display" : preset.font === "archivo" ? "Archivo Black" : preset.font === "bebas" ? "Bebas Neue" : "Inter"}';
      font-weight:${preset.weight};
      font-size:${preset.id === "bebas" ? "19px" : "15px"};
      color:${preset.color};
      text-transform:${preset.uppercase ? "uppercase" : "none"};
      ${preset.background_opacity > 0 ? `background:${hexToRGBA(preset.background, preset.background_opacity)};padding:3px 8px;border-radius:5px;` : `text-shadow:0 2px 8px rgba(0,0,0,.65);`}
    ">${preset.id === "kinetic" ? "NIGHT<br>DRIVE" : preset.id === "journal" ? "Lisbon, 7am" : preset.id === "clean" ? "the good part" : preset.id === "minimal" ? "keep it simple" : preset.id === "broadcast" ? "BREAKING" : "STOP SCROLLING"}</span>`;
    const card = el("button", { class: "style-card", dataset: { id: preset.id }, type: "button" });
    card.innerHTML = `
      <div class="style-thumb" style="background-image:linear-gradient(160deg, rgba(255,154,90,.5), rgba(20,20,32,.9)), var(--thumb-grad, linear-gradient(140deg,#1b1b26,#0e0e14))">
        ${sample}
      </div>
      <div class="style-meta"><b>${escapeHTML(preset.label)}</b><span>${escapeHTML(preset.tagline || "")}</span></div>
    `;
    host.append(card);
  });
  highlightedStyles();
}

function highlightedStyles() {
  $$("#style-grid .style-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.id === state.stylePreset);
  });
}

function buildFontSelect() {
  const select = $("#st-font");
  select.innerHTML = "";
  (state.config?.fonts || []).forEach((font) => {
    select.append(el("option", { value: font.id, text: font.label }));
  });
}

function applyStyle(style, presetId, fromCard = false) {
  if (!style) {
    const preset = state.config?.styles?.find((item) => item.id === (presetId || "creator")) || state.config?.styles?.[0];
    style = preset ? { ...preset } : {};
  }
  state.style = { ...style };
  state.stylePreset = presetId || style.id || state.stylePreset;
  if (fromCard) highlightedStyles();

  selectValue($("#st-font"), state.style.font || "inter");
  $("#st-size").value = state.style.size ?? 66;
  $("#st-color").value = (state.style.color || "#FFFFFF").toUpperCase();
  $("#st-accent").value = (state.style.accent || "#D8FF3E").toUpperCase();
  selectValue($("#st-active"), state.style.active || "accent");
  selectValue($("#st-position"), state.style.position || "bottom");
  selectValue($("#st-animation"), state.style.animation || "pop");
  $("#st-words").value = state.style.max_words ?? 3;
  $("#st-box").value = Math.round((state.style.background_opacity ?? 0) * 100);
  $("#st-outline").value = state.style.outline ?? 0;
  $("#st-lines").value = Math.round((state.style.line_spacing ?? 1) * 100);
  $("#st-uppercase").checked = state.style.uppercase !== false;
  updateStyleReadouts();
}

function readStyleIntoState() {
  if (!state.style) state.style = {};
  state.style.font = $("#st-font").value;
  state.style.weight = state.config.fonts.find((font) => font.id === $("#st-font").value)?.weights?.slice(-1)[0] || 800;
  state.style.size = Number($("#st-size").value);
  state.style.color = $("#st-color").value.toUpperCase();
  state.style.accent = $("#st-accent").value.toUpperCase();
  state.style.active = $("#st-active").value;
  state.style.position = $("#st-position").value;
  state.style.animation = $("#st-animation").value;
  state.style.max_words = Number($("#st-words").value);
  state.style.background_opacity = Number($("#st-box").value) / 100;
  state.style.outline = Number($("#st-outline").value);
  state.style.line_spacing = Number($("#st-lines").value) / 100;
  state.style.uppercase = $("#st-uppercase").checked;
  state.style.karaoke = $("#st-active").value !== "none";
}

function updateStyleReadouts() {
  $("#st-size-val").textContent = $("#st-size").value;
  $("#st-size-out").textContent = $("#st-size").value;
  $("#st-words-val").textContent = $("#st-words").value;
  $("#st-box-val").textContent = `${$("#st-box").value}%`;
  $("#st-box-out").textContent = `${$("#st-box").value}%`;
  $("#st-outline-val").textContent = $("#st-outline").value;
  $("#st-lines-val").textContent = (Number($("#st-lines").value) / 100).toFixed(1);
  ["#st-size", "#st-words", "#st-box", "#st-outline", "#st-lines"].forEach((selector) => updateRangeFill($(selector)));
}

/* ------------------------------------------------------------------ motion */

function buildTransitionGrid() {
  const host = $("#transition-grid");
  host.innerHTML = "";
  (state.config?.transitions || []).forEach((preset) => {
    const card = el("button", { class: "transition-card", dataset: { id: preset.id }, type: "button" });
    card.innerHTML = preset.id === "custom"
      ? `<div style="height:66px;display:grid;place-items:center;background:repeating-linear-gradient(45deg,#141420,#141420 6px,#1b1b28 6px,#1b1b28 12px);color:var(--dim);font-size:10px;letter-spacing:.12em">YOUR MOVIE</div>
         <div class="transition-name">${escapeHTML(preset.label)}<span>alpha</span></div>`
      : `<img loading="lazy" alt="" src="/api/transition-preview/${preset.id}?intensity=0.78&aspect=16:9&frames=12" />
         <div class="transition-name">${escapeHTML(preset.label)}<span>${Number(preset.duration).toFixed(1)}s</span></div>`;
    card.addEventListener("click", () => {
      state.transitionPreset = preset.id;
      highlightedTransitions();
      $("#custom-transition-block").classList.toggle("hide", preset.id !== "custom");
      $("#tr-duration").value = Math.min(Number($("#tr-duration").max), preset.duration);
      wireRange($("#tr-duration"), $("#tr-duration-out"), (value) => `${Number(value).toFixed(2)}s`);
      schedulePreview(80);
      saveDraft();
    });
    host.append(card);
  });
  highlightedTransitions();
}

function highlightedTransitions() {
  $$("#transition-grid .transition-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.id === state.transitionPreset);
  });
}

function bindMotion() {
  $("#transitions-enabled").addEventListener("change", () => {
    saveDraft();
    updateMetrics();
  });
  $("#tr-intensity").addEventListener("input", () => {
    wireRange($("#tr-intensity"), $("#tr-intensity-out"), (value) => `${Math.round(value)}%`);
    $$("#transition-grid img").forEach((img) => {
      img.src = img.src.replace(/intensity=[\d.]+/, `intensity=${(Number($("#tr-intensity").value) / 100).toFixed(2)}`);
    });
    schedulePreview(220);
  });
  ["#tr-duration", "#tr-frequency"].forEach((selector) => {
    $(selector).addEventListener("input", () => {
      wireRange($(selector), $(selector === "#tr-duration" ? "#tr-duration-out" : "#tr-frequency-out"),
        (value) => selector === "#tr-duration" ? `${Number(value).toFixed(2)}s` : value);
      saveDraft();
    });
  });
  $("#tr-scope").addEventListener("change", saveDraft);

  const overlayDrop = $("#drop-overlay");
  const overlayInput = $("#file-overlay");
  overlayDrop.addEventListener("click", () => overlayInput.click());
  overlayInput.addEventListener("change", async () => {
    const file = overlayInput.files?.[0];
    if (!file) return;
    try {
      const data = await api.upload(file, "overlay");
      state.overlay = data;
      const host = $("#overlay-item");
      host.classList.remove("hide");
      host.innerHTML = "";
      host.append(el("div", { class: "media-thumb placeholder", text: "FX" }));
      host.append(el("div", { class: "media-meta" }, [
        el("div", { class: "media-name" }, data.name),
        el("div", { class: "media-sub" }, [
          el("span", { class: "badge", text: formatDuration(data.duration || 0) }),
          el("span", { class: "badge", text: data.codec || "overlay" }),
        ]),
      ]));
      host.append(iconButton("x", "Remove overlay", () => {
        state.overlay = null;
        host.classList.add("hide");
      }));
      toast("Overlay ready — it will loop to fit each transition.", "ok");
    } catch (error) {
      toast(error.message, "error", 7000);
    }
    overlayInput.value = "";
  });

  const musicDrop = $("#drop-music");
  const musicInput = $("#file-music");
  musicDrop.addEventListener("click", () => musicInput.click());
  musicDrop.addEventListener("dragover", (event) => {
    event.preventDefault();
    musicDrop.style.borderColor = "rgba(216,255,62,.55)";
  });
  musicDrop.addEventListener("dragleave", () => {
    musicDrop.style.borderColor = "";
  });
  musicDrop.addEventListener("drop", (event) => {
    event.preventDefault();
    musicDrop.style.borderColor = "";
    const file = event.dataTransfer?.files?.[0];
    if (file) uploadMusic(file);
  });
  musicInput.addEventListener("change", () => {
    const file = musicInput.files?.[0];
    if (file) uploadMusic(file);
    musicInput.value = "";
  });

  $("#music-bpm").addEventListener("change", async () => {
    if (state.music) await detectBeats(state.music.path, $("#music-bpm").value ? Number($("#music-bpm").value) : null);
  });
  ["#music-bpc", "#music-order"].forEach((selector) => {
    $(selector).addEventListener("change", () => {
      if (selector === "#music-bpc") renderBeat();
      updateMetrics();
      saveDraft();
    });
  });

  ["#vlog-title", "#vlog-location", "#vlog-date", "#vlog-title-seconds", "#vlog-title-card", "#vlog-chapters"].forEach((selector) => {
    $(selector).addEventListener("input", saveDraft);
    $(selector).addEventListener("change", saveDraft);
  });
  wireRange($("#vlog-title-seconds"), $("#vlog-title-seconds-val"), (value) => `${Number(value).toFixed(1)}s`);
}

async function uploadMusic(file) {
  try {
    const data = await api.upload(file, "audio");
    state.music = data;
    const host = $("#music-item");
    host.classList.remove("hide");
    host.innerHTML = "";
    host.append(el("div", { class: "media-thumb placeholder", text: "AUDIO" }));
    host.append(el("div", { class: "media-meta" }, [
      el("div", { class: "media-name" }, data.name),
      el("div", { class: "media-sub" }, [
        el("span", { class: "badge", text: formatDuration(data.duration) }),
        el("span", { class: "badge", text: data.codec || "audio" }),
      ]),
    ]));
    host.append(iconButton("x", "Remove song", () => {
      state.music = null;
      state.beat = null;
      host.classList.add("hide");
      renderBeat();
    }));
    await detectBeats(data.path, null);
    toast("Song loaded and tempo detected.", "ok");
    saveDraft();
  } catch (error) {
    toast(error.message, "error", 7000);
  }
}

async function detectBeats(path, bpm) {
  try {
    $("#beat-source").textContent = "listening…";
    const result = await api.post("/api/beats", { path, bpm });
    state.beat = result;
    $("#music-bpm").value = result.detected_bpm || result.bpm;
    renderBeat();
    updateMetrics();
    saveDraft();
  } catch (error) {
    $("#beat-source").textContent = "analysis failed";
    $("#beat-stats").innerHTML = `<span style="color:var(--danger)">${escapeHTML(error.message)}</span>`;
  }
}

function renderBeat() {
  const wrap = $("#beat-wrap");
  $$(".wave-cut", wrap).forEach((node) => node.remove());
  if (!state.beat) {
    $("#beat-img").removeAttribute("src");
    $("#beat-source").textContent = "add a track to detect";
    $("#beat-stats").innerHTML = "<span>Cutline listens for tempo and downbeats.</span>";
    return;
  }
  const beat = state.beat;
  $("#beat-img").src = beat.wave || "";
  $("#beat-source").textContent = `${beat.bpm?.toFixed(1)} BPM · ${beat.source === "manual" ? "manual" : "detected"}`;
  const duration = beat.duration || 1;
  const bpc = Number($("#music-bpc").value || 4);
  const period = 60 / (beat.bpm || 120);
  const stride = period * bpc;
  for (let t = beat.offset || 0, index = 0; t < duration; t += stride, index += 1) {
    const line = el("div", { class: "wave-cut" });
    line.style.left = `${(t / duration) * 100}%`;
    line.style.width = "1px";
    line.style.background = index % 4 === 0 ? "rgba(216,255,62,.6)" : "rgba(216,255,62,.16)";
    line.style.border = "0";
    wrap.append(line);
  }
  $("#beat-stats").innerHTML = `
    <span><b>${beat.bpm?.toFixed(2)}</b> BPM</span>
    <span>${beat.source === "manual" ? "manual tempo" : `confidence ${Math.round((beat.confidence || 0) * 100)}%`}</span>
    <span>cut every <b>${bpc}</b> beat${bpc === 1 ? "" : "s"}</span>
    <span>${formatDuration(beat.duration)} song</span>
  `;
}

/* ------------------------------------------------------------------ delivery */

function buildAspectGrid() {
  const host = $("#aspect-grid");
  host.innerHTML = "";
  const shapes = {
    "9:16": [18, 32], "16:9": [32, 18], "1:1": [26, 26], "4:5": [23, 29],
  };
  (state.config?.aspects || []).forEach((aspect) => {
    const [width, height] = shapes[aspect.id] || [26, 26];
    const card = el("button", { class: "aspect-card", dataset: { id: aspect.id }, type: "button" });
    card.innerHTML = `
      <span class="aspect-frame" style="width:${width}px;height:${height}px"></span>
      <b>${aspect.id}</b>
    `;
    card.addEventListener("click", () => {
      setAspect(aspect.id);
      schedulePreview(60);
      saveDraft();
    });
    host.append(card);
  });
}

function setAspect(aspect) {
  $$("#aspect-grid .aspect-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.id === aspect);
  });
  $("#preview-aspect").textContent = `${aspect} · ${aspectLabel(aspect)}`;
  updateFrameSize(aspect);
}

function aspectLabel(aspect) {
  const found = state.config?.aspects?.find((item) => item.id === aspect);
  return found ? `${found.width}×${found.height}` : "1080×1920";
}

function updateFrameSize(aspect) {
  const frame = $("#frame");
  if (!frame) return;
  const sizes = {
    "9:16": [236, 420], "16:9": [360, 203], "1:1": [320, 320], "4:5": [292, 365],
  };
  const [width, height] = sizes[aspect] || sizes["9:16"];
  const narrow = window.innerWidth <= 860;
  const scale = narrow ? 0.62 : 1;
  frame.style.width = `${Math.round(width * scale)}px`;
  frame.style.height = `${Math.round(height * scale)}px`;
}

function bindDelivery() {
  $("#fps-select").addEventListener("change", saveDraft);
  $("#resolution-select").addEventListener("change", () => schedulePreview(90));
  ["#project-name"].forEach((selector) => $(selector).addEventListener("input", saveDraft));

  $("#btn-build").addEventListener("click", build);
  $("#btn-build-side").addEventListener("click", build);
  window.addEventListener("resize", () => {
    updateFrameSize($("#aspect-grid .aspect-card.active")?.dataset.id || "9:16");
  });
}

/* ------------------------------------------------------------------ preview */

function schedulePreview(delay = 220) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(updatePreview, delay);
}

async function updatePreview() {
  const aspect = $("#aspect-grid .aspect-card.active")?.dataset.id || "9:16";
  const captionsOn = $("#caption-enabled").checked && $("#seg-caption-source button.active")?.dataset.value !== "none";
  const source = state.sources[0];
  const style = { ...(state.style || {}) };
  const text = previewText();
  const key = JSON.stringify({ aspect, captionsOn, text, style, source: source?.path, seed: state.previewSeed });
  if (key === lastPreviewKey) return;
  lastPreviewKey = key;

  const frame = $("#frame");
  updateFrameSize(aspect);
  try {
    let url;
    if (captionsOn) {
      const response = await fetch("/api/caption-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          preset: state.stylePreset,
          aspect,
          text,
          seed: state.previewSeed,
          background: source?.path || null,
          background_time: source ? Math.min(1.2, Math.max(0.2, source.duration * 0.2)) : 0,
          at: null,
        }),
      });
      if (!response.ok) throw new Error("preview failed");
      const blob = await response.blob();
      url = URL.createObjectURL(blob);
    } else {
      url = `/api/preview/sample?aspect=${encodeURIComponent(aspect)}&seed=${state.previewSeed}`;
    }
    const img = $("#preview-img");
    const previous = state.previewUrl;
    img.onload = () => {
      if (previous && previous.startsWith("blob:")) URL.revokeObjectURL(previous);
    };
    state.previewUrl = url.startsWith("blob:") ? url : null;
    img.src = url;
    frame.style.setProperty("--ar", aspect);
  } catch (error) {
    // A preview is never worth breaking the studio over.
    $("#preview-img").src = `/api/preview/sample?aspect=${encodeURIComponent(aspect)}&seed=${state.previewSeed}`;
  }
  updateFrameTag();
}

function previewText() {
  if (state.srt && $("#seg-caption-source button.active")?.dataset.value === "file") {
    return state.srt.sample || "Captions from your file";
  }
  return MODES[state.mode]?.sample || "Your words, cut to fit";
}

function updateFrameTag() {
  const position = $("#st-position")?.value || "bottom";
  const labels = { bottom: "LOWER SAFE", lower_third: "LOWER THIRD", center: "CENTRE", top: "UPPER SAFE" };
  $("#frame-tag").textContent = labels[position] || "SAFE AREA";
}

function updateMetrics() {
  const aspect = $("#aspect-grid .aspect-card.active")?.dataset.id || "9:16";
  $("#preview-aspect").textContent = `${aspect} · ${aspectLabel(aspect)}`;
  const stats = estimateCut();
  const captionsOn = $("#caption-enabled").checked && $("#seg-caption-source button.active")?.dataset.value !== "none";
  const style = state.style || {};

  if (state.mode === "music") {
    const beat = state.beat;
    if (beat) {
      const bpc = Number($("#music-bpc").value || 4);
      const period = 60 / (beat.bpm || 120);
      const cutLen = period * bpc;
      const musicDuration = beat.duration || state.music?.duration || 0;
      const footage = state.sources.reduce((total, source) => total + source.duration, 0);
      const timeline = Math.max(0, Math.min(musicDuration || footage, footage || musicDuration));
      const cuts = Math.max(0, Math.floor((timeline - (beat.offset || 0)) / cutLen));
      $("#metric-duration").textContent = timeline ? formatDuration(timeline) : "—";
      $("#metric-cut").textContent = cuts || "—";
      $("#metric-cut-label").textContent = "Cuts";
      $("#metric-saved").textContent = beat.bpm ? `${beat.bpm.toFixed(0)}` : "—";
      $("#metric-saved-label").textContent = "BPM";
      const every = Number($("#tr-frequency").value || 8);
      const accents = Math.floor(cuts / Math.max(1, every));
      const captionCount = captionsOn ? Math.round((timeline || 0) / 2.1) : 0;
      const host = $("#preview-notes");
      host.innerHTML = "";
      [
        ["good", `${formatDuration(timeline)} of picture, cut every ${bpc} beat${bpc === 1 ? "" : "s"}.`],
        ["", `${accents} beat accent${accents === 1 ? "" : "s"} · ${captionCount || "no"} lyric card${captionCount === 1 ? "" : "s"}.`],
        ["", state.music ? `Song: ${state.music.name}` : "Using the first clip's audio as the bed."],
      ].forEach(([kind, text]) => host.append(el("div", { class: `note ${kind}`.trim() }, [
        icon(kind === "good" ? "check" : "dot"), el("span", { text }),
      ])));
      return;
    }
    $("#metric-duration").textContent = state.sources.length ? formatDuration(state.sources.reduce((t, s) => t + s.duration, 0)) : "—";
    $("#metric-cut").textContent = "—";
    $("#metric-cut-label").textContent = "Cuts";
    $("#metric-saved").textContent = "—";
    $("#metric-saved-label").textContent = "BPM";
    return;
  }

  $("#metric-cut-label").textContent = "Cuts";
  $("#metric-saved-label").textContent = "Silence out";
  const timeline = stats.ready ? stats.kept : state.sources.reduce((total, source) => total + source.duration, 0);
  $("#metric-duration").textContent = timeline ? formatDuration(timeline) : "—";
  $("#metric-cut").textContent = stats.ready ? stats.cuts : "—";
  $("#metric-saved").textContent = stats.ready ? `−${formatDuration(stats.saved)}` : "—";

  if (!state.sources.length) {
    updateModeNote();
    return;
  }
  const host = $("#preview-notes");
  host.innerHTML = "";
  const wordCount = timeline * 2.6;
  const perCard = Number(style.max_words || 3);
  const captionCards = captionsOn ? Math.max(1, Math.round(wordCount / perCard)) : 0;
  const every = Math.max(1, Number($("#tr-frequency").value || 3));
  const transitionCount = $("#transitions-enabled").checked ? Math.floor(stats.cuts / every) : 0;
  const notes = [
    ["good", `${formatDuration(stats.saved)} of dead air removed across ${stats.cuts} cut${stats.cuts === 1 ? "" : "s"}.`],
    ["", captionsOn ? `${captionCards} caption cards in the “${state.stylePreset}” style.` : "Captions are off — picture and sound only."],
    ["", transitionCount ? `${transitionCount} transition${transitionCount === 1 ? "" : "s"} on the busiest cuts.` : "No transitions — straight cuts."],
  ];
  notes.forEach(([kind, text]) => host.append(el("div", { class: `note ${kind}`.trim() }, [
    icon(kind === "good" ? "check" : "dot"), el("span", { text }),
  ])));
}

function icon(kind) {
  const paths = {
    check: '<path d="m5 12 4.5 4.5L19 7" stroke-linecap="round"/>',
    dot: '<circle cx="12" cy="12" r="3.2"/>',
  };
  return el("span", { html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${paths[kind] || paths.dot}</svg>` });
}

function hexToRGBA(hex, alpha) {
  const value = String(hex || "#000000").replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ------------------------------------------------------------------ build */

function readConfig() {
  readStyleIntoState();
  const threshold = $("#silence-threshold").value;
  const styleSource = $("#seg-caption-source button.active")?.dataset.value || "auto";
  const config = {
    mode: state.mode,
    name: $("#project-name").value.trim(),
    aspect: $("#aspect-grid .aspect-card.active")?.dataset.id || "9:16",
    fps: $("#fps-select").value,
    silence: {
      enabled: $("#silence-enabled").checked,
      pacing: currentPacing(),
      threshold_db: threshold === "" ? null : Number(threshold),
      padding: Number($("#silence-padding").value),
      min_silence: null,
    },
    captions: {
      enabled: $("#caption-enabled").checked && styleSource !== "none",
      source: $("#caption-enabled").checked ? styleSource : "none",
      language: "auto",
      quality: "balanced",
      delivery: $("#caption-delivery").value,
      preset: state.stylePreset,
      style: { ...state.style },
      timing: $("#caption-timing").value,
    },
    transitions: {
      enabled: $("#transitions-enabled").checked,
      preset: state.transitionPreset,
      frequency: Number($("#tr-frequency").value),
      duration: Number($("#tr-duration").value),
      intensity: Number($("#tr-intensity").value) / 100,
      scope: state.mode === "music" ? "beats" : $("#tr-scope").value,
      custom_asset: state.overlay?.path || null,
    },
    vlog: {
      title: $("#vlog-title").value.trim(),
      location: $("#vlog-location").value.trim(),
      date: $("#vlog-date").value.trim(),
      title_card: $("#vlog-title-card").checked,
      chapter_cards: $("#vlog-chapters").checked,
      title_seconds: Number($("#vlog-title-seconds").value),
    },
    music: {
      bpm: $("#music-bpm").value ? Number($("#music-bpm").value) : null,
      beats_per_cut: Number($("#music-bpc").value),
      transition_every: Number($("#tr-frequency").value),
      order: $("#music-order").value,
      start_at: 0,
    },
    output: {
      resolution: $("#resolution-select").value,
      overlay_codec: "qtrle",
    },
  };
  return config;
}

async function build() {
  if (state.processing) return;
  const config = readConfig();
  if (!state.sources.length) {
    toast("Add at least one clip first.", "error");
    $("#drop-video").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (config.captions.source === "file" && !state.srt) {
    toast("Add the caption file, or switch captions to Automatic / No text.", "error", 6000);
    $("#drop-srt")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (config.transitions.preset === "custom" && !state.overlay) {
    toast("Upload the overlay movie for the custom transition.", "error");
    return;
  }
  if (state.mode === "music" && !state.music && !state.sources.some((source) => source.has_audio)) {
    toast("Music video needs a song with audio.", "error");
    return;
  }
  state.processing = true;
  setBuildDisabled(true);
  showProgress(2, "Queued", "Handing the takes to the cutting room…");
  try {
    const created = await api.post("/api/projects", {
      mode: state.mode,
      name: config.name || null,
      sources: state.sources.map((source) => ({ path: source.path, name: source.name })),
      srt_path: state.srt?.path || null,
      music_path: state.music?.path || null,
      custom_transition_path: state.overlay?.path || null,
      config,
    });
    state.projectId = created.id;
    localStorage.setItem("cutline:lastProject", created.id);
    watchProject(created.id, { openResult: true });
  } catch (error) {
    state.processing = false;
    setBuildDisabled(false);
    showProgress(0, "Didn't start", error.message);
    $("#build-error").textContent = error.message;
    toast(error.message, "error", 9000);
  }
}

function setBuildDisabled(disabled) {
  ["#btn-build", "#btn-build-side"].forEach((selector) => {
    const button = $(selector);
    if (!button) return;
    button.disabled = disabled;
    const label = button.querySelector("span") || button;
    if (disabled) {
      button.dataset.original = label.innerHTML;
      if (button.id === "btn-build") label.innerHTML = "Cutting…";
    } else if (button.dataset.original) {
      label.innerHTML = button.dataset.original;
    }
  });
}

function showProgress(percent, stage, message) {
  const box = $("#progress-box");
  box.classList.remove("hide");
  $("#progress-fill").style.width = `${Math.max(0, Math.min(100, percent))}%`;
  $("#progress-stage").textContent = stage || "";
  $("#progress-msg").textContent = message || "";
  $("#progress-pct").textContent = `${Math.round(percent)}%`;
}

function watchProject(projectId, options = {}) {
  clearInterval(state.polling);
  const tick = async () => {
    try {
      const project = await api.get(`/api/projects/${projectId}`);
      if (project.status === "failed") {
        clearInterval(state.polling);
        state.processing = false;
        setBuildDisabled(false);
        showProgress(project.progress || 0, "Stopped", project.message || "The cut failed.");
        $("#build-error").textContent = project.error || "The cut stopped before it reached the timeline.";
        toast(project.error || "The build failed.", "error", 9000);
        return;
      }
      if (project.running || project.status === "running" || project.status === "queued") {
        showProgress(project.progress || 0, project.stage || "Working", project.message || "");
        state.resultProject = project;
        return;
      }
      if (project.status === "done") {
        clearInterval(state.polling);
        state.processing = false;
        setBuildDisabled(false);
        showProgress(100, "Ready", "Your first cut is ready for Resolve.");
        state.resultProject = project;
        if (options.openResult) openResult(project);
      }
    } catch (error) {
      clearInterval(state.polling);
      state.processing = false;
      setBuildDisabled(false);
      showProgress(0, "Offline", error.message);
      toast(`Lost contact with the engine: ${error.message}`, "error", 9000);
    }
  };
  tick();
  state.polling = setInterval(tick, 900);
}

/* ------------------------------------------------------------------ result */

function bindResult() {
  $$("[data-close-result]").forEach((node) => node.addEventListener("click", closeResult));
  $("#btn-another").addEventListener("click", () => {
    closeResult();
    $("#project-name").value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Keep the footage — just change the look and build again.");
  });
  $("#btn-rebuild").addEventListener("click", rebuildCurrent);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeResult();
      closeModal();
    }
  });
}

function openResult(project) {
  state.resultProject = project;
  const summary = project.summary || {};
  const stamp = Date.now();
  $("#result-preview-img").src = project.output?.preview
    ? `/api/projects/${project.id}/asset/preview.jpg?t=${stamp}`
    : `/api/preview/sample?aspect=${encodeURIComponent(project.summary?.aspect || "9:16")}&seed=${stamp}`;
  $("#result-title").textContent = project.name ? `${project.name} is in the can.` : "Your timeline is in the can.";
  $("#result-sub").textContent = `${summary.mode_label || "Cut"} · ${formatDuration(summary.timeline_seconds || 0)} · ${summary.fps ? `${Number(summary.fps).toFixed(2)} fps` : ""} · ${summary.width || 1080}×${summary.height || 1920}`;

  const stats = [
    ["Timeline", formatDuration(summary.timeline_seconds || 0)],
    ["Cuts", summary.cuts ?? "—"],
    ["Silence out", summary.removed_seconds ? formatDuration(summary.removed_seconds) : "—"],
    ["Captions", summary.captions || 0],
    ["Transitions", summary.transitions || 0],
    [summary.bpm ? "Tempo" : "Look", summary.bpm ? `${Number(summary.bpm).toFixed(1)} BPM` : (summary.style || "—")],
  ];
  $("#result-stats").innerHTML = stats.map(([label, value]) => `
    <div class="stat"><b>${escapeHTML(String(value))}</b><span>${escapeHTML(label)}</span></div>
  `).join("");

  const warnings = project.warnings || summary.warnings || [];
  $("#result-warnings").innerHTML = warnings.length
    ? warnings.map((warning) => `<div class="warn-item"><span>⚠</span><span>${escapeHTML(warning)}</span></div>`).join("")
    : "";

  const id = project.id;
  const files = [
    { key: "otio", title: "timeline.otio", sub: "DaVinci Resolve timeline · import this", primary: true, icon: "OTIO" },
    { key: "srt", title: "captions.srt", sub: "Subtitle sidecar · editable text timing", icon: "SRT" },
    { key: "vtt", title: "captions.vtt", sub: "Web captions for social uploads", icon: "VTT" },
    { key: "transcript", title: "transcript.txt", sub: "Full transcript with timecodes", icon: "TXT" },
    { key: "preview", title: "preview.jpg", sub: "A still of the finished cut", icon: "JPG" },
  ];
  const downloads = $("#result-downloads");
  downloads.innerHTML = "";
  files.forEach((file) => {
    if (!project.output?.[file.key]) return;
    downloads.append(el("a", {
      class: `download ${file.primary ? "primary" : ""}`.trim(),
      href: `/api/projects/${id}/asset/${encodeURIComponent(file.title)}?download=1&t=${stamp}`,
      download: true,
    }, [
      el("span", { class: "file-ico", text: file.icon }),
      el("div", {}, [el("b", { text: file.title }), el("span", { text: file.sub })]),
      el("span", { class: "arrow", text: "↓" }),
    ]));
  });
  const folderButton = el("button", { class: "download", type: "button" }, [
    el("span", { class: "file-ico", text: "DIR" }),
    el("div", {}, [el("b", { text: "Project folder" }), el("span", { text: project.paths?.folder || "" })]),
    el("span", { class: "arrow", text: "⧉" }),
  ]);
  folderButton.addEventListener("click", async () => {
    await copyText(project.paths?.folder || "");
    toast("Output folder path copied.", "ok");
  });
  downloads.append(folderButton);

  renderRecaptionEditor(project);
  $("#result").classList.add("open");
}

function closeResult() {
  $("#result").classList.remove("open");
}

function renderRecaptionEditor(project) {
  const host = $("#result-recaptions");
  host.innerHTML = "";
  const cues = project.captions?.cues || [];
  if (!cues.length) return;
  const block = el("div", {});
  block.innerHTML = `
    <div class="label" style="margin-bottom:9px">Fix the captions in place</div>
    <div class="hint" style="margin-bottom:9px">Edit the words, then re-render. The timeline, transitions, and titles are kept.</div>
  `;
  const list = el("div", { class: "cue-list" });
  cues.forEach((cue) => {
    const row = el("div", { class: "cue-row" });
    row.append(el("div", { class: "cue-time", text: `${formatClock(cue.start)} → ${formatClock(cue.end)}` }));
    const area = el("textarea", { spellcheck: "false" });
    area.value = cue.text;
    area.dataset.start = cue.start;
    area.dataset.end = cue.end;
    row.append(area);
    list.append(row);
  });
  block.append(list);
  const apply = el("button", { class: "primary-btn small", type: "button", text: "Apply caption edits" });
  apply.style.marginTop = "12px";
  apply.addEventListener("click", async () => {
    const edits = Array.from(list.querySelectorAll("textarea")).map((area) => ({
      text: area.value,
      start: Number(area.dataset.start),
      end: Number(area.dataset.end),
    })).filter((cue) => cue.text.trim());
    if (!edits.length) {
      toast("Keep at least one caption line.", "error");
      return;
    }
    apply.disabled = true;
    apply.textContent = "Re-rendering…";
    try {
      await api.post(`/api/projects/${project.id}/recaption`, { cues: edits });
      closeResult();
      state.processing = true;
      setBuildDisabled(true);
      showProgress(4, "Queued", "Re-cutting the captions…");
      watchProject(project.id, { openResult: true });
      toast("Caption update started.", "ok");
    } catch (error) {
      toast(error.message, "error");
      apply.disabled = false;
      apply.textContent = "Apply caption edits";
    }
  });
  block.append(apply);
  host.append(block);
}

function formatClock(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(value / 60);
  const s = value % 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

async function rebuildCurrent() {
  const project = state.resultProject;
  if (!project) return;
  try {
    closeResult();
    state.processing = true;
    setBuildDisabled(true);
    showProgress(2, "Queued", "Rebuilding the cut…");
    await api.post(`/api/projects/${project.id}/rebuild`, {});
    watchProject(project.id, { openResult: true });
  } catch (error) {
    toast(error.message, "error");
    state.processing = false;
    setBuildDisabled(false);
  }
}

/* ------------------------------------------------------------------ projects */

function bindProjects() {
  $("#btn-projects").addEventListener("click", async () => {
    $("#projects-view").classList.add("open");
    $("#workspace").style.display = "none";
    $("#hero").style.display = "none";
    await refreshProjects();
  });
  $("#btn-back-studio").addEventListener("click", () => {
    $("#projects-view").classList.remove("open");
    $("#workspace").style.display = "";
    $("#hero").style.display = "";
  });
}

async function refreshProjects() {
  try {
    const projects = await api.get("/api/projects");
    $("#project-count").textContent = String(projects.length);
    const grid = $("#project-grid");
    grid.innerHTML = "";
    $("#projects-empty").classList.toggle("hide", projects.length > 0);
    projects.forEach((project) => {
      const card = el("div", { class: "project-card" });
      const cover = el("div", { class: "project-cover" });
      if (project.cover) {
        cover.style.backgroundImage = `url(/api/projects/${project.id}/asset/cover.jpg)`;
      } else {
        cover.innerHTML = `<span style="font-family:var(--display);color:var(--dim);font-size:12px">CUTLINE</span>`;
      }
      cover.append(el("span", { class: "mode-tag", text: modeLabel(project.mode) }));
      const statusDot = `<span class="status-dot ${project.status || "queued"}"></span>`;
      const body = el("div", { class: "project-body" });
      body.innerHTML = `
        <h3 title="${escapeHTML(project.name || "Untitled")}">${escapeHTML(project.name || "Untitled cut")}</h3>
        <div class="sub">${statusDot}${escapeHTML(project.stage || project.status || "")} · ${formatDate(project.updated)}</div>
        <div class="sub">${project.summary?.timeline_seconds ? formatDuration(project.summary.timeline_seconds) : "—"} · ${project.summary?.cuts ?? 0} cuts · ${project.summary?.captions ?? 0} captions</div>
      `;
      const actions = el("div", { class: "project-actions" });
      const open = el("button", { class: "ghost-btn", type: "button", text: "Open" });
      open.addEventListener("click", () => openProject(project.id));
      const rebuild = el("button", { class: "ghost-btn", type: "button", text: "Rebuild" });
      rebuild.addEventListener("click", () => rebuildProject(project.id));
      const remove = el("button", { class: "icon-btn danger", title: "Delete project", html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13"/></svg>' });
      remove.addEventListener("click", async () => {
        if (!window.confirm(`Delete “${project.name}”? Rendered captions are removed; your source footage is untouched.`)) return;
        try {
          await api.del(`/api/projects/${project.id}`);
          toast("Project deleted.");
          await refreshProjects();
        } catch (error) {
          toast(error.message, "error");
        }
      });
      actions.append(open, rebuild, remove);
      body.append(actions);
      card.append(cover, body);
      grid.append(card);
    });
  } catch (error) {
    toast(`Could not load projects: ${error.message}`, "error");
  }
}

function modeLabel(mode) {
  return { social: "Talking head", vlog: "Travel vlog", music: "Music video" }[mode] || "Cut";
}

async function openProject(id) {
  try {
    const project = await api.get(`/api/projects/${id}`);
    if (project.status === "failed" && project.error) {
      toast(project.error, "error", 8000);
    }
    if (project.running) {
      closeProjectsView();
      state.processing = true;
      showProgress(project.progress || 0, project.stage || "Working", project.message || "");
      watchProject(id, { openResult: true });
      return;
    }
    if (!project.output?.otio) {
      toast("That project has no timeline yet. Rebuild it to regenerate.", "error");
      return;
    }
    closeProjectsView();
    openResult(project);
  } catch (error) {
    toast(error.message, "error");
  }
}

function closeProjectsView() {
  $("#projects-view").classList.remove("open");
  $("#workspace").style.display = "";
  $("#hero").style.display = "";
}

async function rebuildProject(id) {
  try {
    closeProjectsView();
    state.processing = true;
    setBuildDisabled(true);
    showProgress(2, "Queued", "Rebuilding the cut…");
    await api.post(`/api/projects/${id}/rebuild`, {});
    watchProject(id, { openResult: true });
  } catch (error) {
    toast(error.message, "error");
    state.processing = false;
    setBuildDisabled(false);
  }
}

/* ------------------------------------------------------------------ guide / misc */

function bindGuide() {
  $("#btn-guide").addEventListener("click", showGuide);
  $("#foot-guide").addEventListener("click", (event) => {
    event.preventDefault();
    showGuide();
  });
  $("#foot-about").addEventListener("click", (event) => {
    event.preventDefault();
    showAbout();
  });
  $$("[data-close-modal]").forEach((node) => node.addEventListener("click", closeModal));
}

function showGuide() {
  $("#modal-title").textContent = "How Cutline lands in Resolve";
  $("#modal-body").innerHTML = `
    <p>Resolve's free edition blocks the scripting bridge, so Cutline doesn't use one. It writes a timeline file — the same import path as an XML or EDL — and Resolve opens it natively.</p>
    <div class="import-steps" style="margin:16px 0">
      <div class="import-step">Build a cut and download <code>timeline.otio</code>.</div>
      <div class="import-step">In Resolve choose <code>File → Import → Timeline</code>.</div>
      <div class="import-step">Leave the media where it is — clips link by absolute path.</div>
      <div class="import-step">Edit page: V1 program, V2 transitions, V3 captions, V4 titles, A1 audio.</div>
    </div>
    <p style="color:var(--muted)">Everything Cutline renders is a movie file with an alpha channel, so it behaves like any clip you would drop on a track. Captions are also written as <code>captions.srt</code> when you prefer Resolve's subtitle track.</p>
    <p style="color:var(--muted)">The free edition caps export at 4K 60, and H.264 decode on Linux free is limited — on macOS and Windows your camera files play normally.</p>
  `;
  $("#modal-guide").classList.add("open");
}

function showAbout() {
  $("#modal-title").textContent = "Cutline";
  $("#modal-body").innerHTML = `
    <p>A local first-cut studio for DaVinci Resolve. Three passes — talking heads, travel films, music videos — built on the same idea: do the mechanical first cut, keep every decision editable.</p>
    <p style="color:var(--muted)">No account. No upload. Media is read from your drive, analysis and renders happen on this machine, and the output is a folder you own.</p>
    <p style="color:var(--muted)">Fonts: Inter, Archivo Black, Bebas Neue, and Playfair Display, all under the SIL Open Font License. Transition previews are procedurally generated.</p>
    <p style="color:var(--muted);font-size:12px">Not affiliated with Blackmagic Design. “DaVinci Resolve” is a trademark of Blackmagic Design Pty Ltd.</p>
  `;
  $("#modal-guide").classList.add("open");
}

function closeModal() {
  $("#modal-guide").classList.remove("open");
}

function bindRail() {
  $$("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.jump);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $$("[data-jump]").forEach((button) => {
        button.classList.toggle("active", button.dataset.jump === entry.target.id);
      });
    });
  }, { rootMargin: "-30% 0px -55% 0px", threshold: 0.01 });
  $$(".step").forEach((step) => observer.observe(step));
}

/* ------------------------------------------------------------------ draft */

const DRAFT_KEY = "cutline:draft";

function saveDraft() {
  try {
    const draft = {
      mode: state.mode,
      savedAt: Date.now(),
      config: readConfig(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Drafts are a convenience; ignore storage limits.
  }
}

export function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw);
    if (!draft || !draft.config) return false;
    if (Date.now() - (draft.savedAt || 0) > 1000 * 60 * 60 * 24 * 14) return false;
    state.mode = draft.mode || "social";
    $$("#mode-tabs .mode-tab").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === state.mode);
    });
    applyMode(state.mode);
    applyConfigToDom(draft.config);
    if (draft.config.name) $("#project-name").value = draft.config.name;
    return true;
  } catch {
    return false;
  }
}
