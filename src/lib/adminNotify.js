// Browser-native "new order" notification: a short beep (generated via Web
// Audio, no audio file needed) plus a Fiverr-style red dot badge drawn onto
// the favicon and a "(N) " prefix on the tab title. All state is derived
// from the caller (AdminPage.jsx passes the current unread-orders count) —
// this module just knows how to make noise and draw a badge.

let audioCtx = null;

export function playNotificationSound() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    // Two quick ascending tones — reads as an "attention" ding, not a beep.
    [880, 1175].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  } catch (error) {
    console.error("Failed to play notification sound:", error);
  }
}

let baseFaviconHref = null;
let faviconLinkEl = null;

function getFaviconLink() {
  if (!faviconLinkEl) {
    faviconLinkEl = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (!faviconLinkEl) {
      faviconLinkEl = document.createElement("link");
      faviconLinkEl.rel = "icon";
      document.head.appendChild(faviconLinkEl);
    }
    baseFaviconHref = faviconLinkEl.href;
  }
  return faviconLinkEl;
}

// Draws the current favicon plus a small red dot in the top-right corner
// onto a canvas, and swaps the <link rel="icon"> href to that data URL.
export function setFaviconBadge(hasNew) {
  const link = getFaviconLink();
  if (!hasNew) {
    if (baseFaviconHref) link.href = baseFaviconHref;
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size - 7, 7, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#e63946";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();
    link.href = canvas.toDataURL("image/png");
  };
  img.onerror = () => {
    // Favicon image couldn't be loaded (e.g. CORS) — fall back to just the
    // title prefix, which setTitleBadge already handles independently.
  };
  img.src = baseFaviconHref || link.href;
}

let baseTitle = null;

export function setTitleBadge(count) {
  if (baseTitle === null) baseTitle = document.title.replace(/^\(\d+\)\s*/, "");
  document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
}
