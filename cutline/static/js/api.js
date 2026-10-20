const jsonHeaders = { "Content-Type": "application/json" };

async function parse(response) {
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const message =
      (payload && (payload.error || payload.detail)) ||
      (text && text.slice(0, 300)) ||
      `Request failed (${response.status})`;
    const error = new Error(typeof message === "string" ? message : "Request failed");
    error.status = response.status;
    throw error;
  }
  if (payload && payload.ok === false) {
    throw new Error(payload.error || "Request failed");
  }
  return payload && Object.prototype.hasOwnProperty.call(payload, "data") ? payload.data : payload;
}

export const api = {
  get(path) {
    return fetch(path, { headers: { Accept: "application/json" } }).then(parse);
  },
  post(path, body) {
    return fetch(path, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(body ?? {}),
    }).then(parse);
  },
  del(path) {
    return fetch(path, { method: "DELETE", headers: { Accept: "application/json" } }).then(parse);
  },
  upload(file, kind, onProgress) {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded / event.total);
        }
      };
      xhr.onload = () => {
        let payload = null;
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          payload = null;
        }
        if (xhr.status >= 200 && xhr.status < 300 && payload && payload.ok) {
          resolve(payload.data);
        } else {
          reject(new Error((payload && payload.error) || `Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed — check that Cutline is still running."));
      xhr.send(form);
    });
  },
};
