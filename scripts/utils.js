function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function getYear(dateStr) {
  return dateStr.split("-")[0];
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  let result = "";
  if (hours > 0) result += `${hours}h`;
  if (mins > 0) result += (hours > 0 ? " " : "") + `${mins}m`;
  return result;
}

function hexToRgba(hex, alpha = 1) {
  // Remove '#' if present
  hex = hex.replace(/^#/, "");

  // Expand shorthand form (e.g. "abc" → "aabbcc")
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (hex.length !== 6) {
    throw new Error("Invalid hex color: " + hex);
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustColor(hex) {
  const { h, s, v } = hexToHsv(hex);
  const adjustedS = Math.max(s, 100); //min saturation
  const adjustedV = Math.max(20, Math.min(v, 50)); //max brightness
  return hsvToHex(h, s, v);
}

function adjustColorHSV(
  hex,
  deltaS = 0,
  deltaV = 0,
  minV = 0, // minimum brightness (0–100 scale)
  maxV = 25 // maximum brightness
) {
  const { h, s, v } = hexToHsv(hex);

  const newS = clamp(s + deltaS, 0, 100);
  const newV = clamp(v + deltaV, minV, maxV); // <-- clamp into dark range

  return hsvToHex(h, newS, newV);
}

function hexToHsv(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");

  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / delta + 2) * 60;
    else h = ((r - g) / delta + 4) * 60;
  }

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return { h, s, v };
}

function hsvToHex(h, s, v) {
  s /= 100;
  v /= 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
