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
  hueShift = 0,
  satShift = 0,
  minValue = 0.2,
  maxValue = 0.4
) {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  // Convert RGB -> HSV
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const d = max - min;
  let h,
    s,
    v = max;

  if (d === 0) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / d) % 6;
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  s = max === 0 ? 0 : d / max;

  // Apply shifts
  h = (h + hueShift) % 360;
  s = Math.min(1, Math.max(0, s + satShift / 100));

  // Normalize brightness (value channel)
  v = Math.min(maxValue, Math.max(minValue, v));

  // Convert HSV -> RGB
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r1, g1, b1;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  r = Math.round((r1 + m) * 255);
  g = Math.round((g1 + m) * 255);
  b = Math.round((b1 + m) * 255);

  // Return hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}

function adjustColorHSVs(hex, deltaS = 0, deltaV = 0) {
  const { h, s, v } = hexToHsv(hex);

  const newS = clamp(s + deltaS, 0, 100);
  const newV = clamp(v + deltaV, 0, 100);

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
