export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else if (key === "dataset") Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

export function formatDuration(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  if (value >= 3600) {
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    return `${h}:${String(m).padStart(2, "0")}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
  }
  const m = Math.floor(value / 60);
  const s = value % 60;
  return m > 0 ? `${m}:${s.toFixed(0).padStart(2, "0")}` : `${s.toFixed(1)}s`;
}

export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let size = value;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size < 10 && index > 0 ? size.toFixed(1) : Math.round(size)} ${units[index]}`;
}

export function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function debounce(fn, wait = 180) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function toast(message, kind = "", timeout = 4200) {
  const host = $("#toasts");
  if (!host) return;
  const node = el("div", { class: `toast ${kind}`.trim(), text: message });
  host.append(node);
  setTimeout(() => {
    node.style.transition = "opacity .25s, transform .25s";
    node.style.opacity = "0";
    node.style.transform = "translateY(6px)";
    setTimeout(() => node.remove(), 260);
  }, timeout);
}

export function segmented(container, value) {
  if (!container) return;
  $$("button", container).forEach((button) => {
    button.classList.toggle("active", button.dataset.value === String(value));
  });
}

export function selectValue(select, value) {
  if (!select) return;
  const stringValue = String(value);
  const options = Array.from(select.options);
  const match = options.find((option) => option.value === stringValue)
    || options.find((option) => option.value.toLowerCase() === stringValue.toLowerCase());
  if (match) select.value = match.value;
}

export function updateRangeFill(input) {
  if (!input) return;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  input.style.setProperty("--p", `${Math.max(0, Math.min(100, percent))}%`);
}

export function wireRange(input, output, formatter) {
  if (!input) return;
  const sync = () => {
    updateRangeFill(input);
    if (output) output.textContent = formatter ? formatter(input.value) : input.value;
  };
  input.addEventListener("input", sync);
  sync();
}

export function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const area = document.createElement("textarea");
  area.value = text;
  document.body.append(area);
  area.select();
  try {
    document.execCommand("copy");
  } finally {
    area.remove();
  }
  return Promise.resolve();
}

export function confirmAction(message) {
  return window.confirm(message);
}
