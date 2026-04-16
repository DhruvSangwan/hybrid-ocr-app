const DESKTOP_SERVER_URL = "http://localhost:5000";

export async function readDesktopStatus() {
  const response = await fetch(`${DESKTOP_SERVER_URL}/status`);
  if (!response.ok) {
    throw new Error("Desktop OCR server is not responding.");
  }

  return response.json();
}

export async function postDesktopOcrJob(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${DESKTOP_SERVER_URL}/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = "Desktop OCR request failed.";

    try {
      const payload = await response.json();
      detail = payload.error || detail;
    } catch {
      detail = response.statusText || detail;
    }

    throw new Error(detail);
  }

  const fileNameHeader = response.headers.get("X-Output-Filename");
  const bytes = await response.arrayBuffer();

  return {
    bytes,
    fileName: fileNameHeader || undefined,
  };
}
