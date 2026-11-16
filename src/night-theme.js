// Night colors for the study page until that page has its own.
// Each result keeps the hue of the live color. Delete this file when
// the page CSS uses prefers-color-scheme.

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l };
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) {
    h = (gn - bn) / d + (gn < bn ? 6 : 0);
  } else if (max === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }
  return { h: h * 60, s, l };
}

function hueToRgb(p, q, t) {
  let channel = t;
  if (channel < 0) channel += 1;
  if (channel > 1) channel -= 1;
  if (channel < 1 / 6) return p + (q - p) * 6 * channel;
  if (channel < 1 / 2) return q;
  if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
  return p;
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hue) * 255),
    Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  ];
}

function mapNight(l, s, chroma, role) {
  const tint = l >= 0.72 && chroma >= 10;
  const neutral = !tint && (chroma < 32 || s < 0.14);
  if (role === "shadow") {
    return { l: Math.min(l, 0.18), s: 0 };
  }
  if (role === "line") {
    if (neutral) {
      return { l: l > 0.65 ? 0.3 : 0.46, s: 0 };
    }
    return { l: clamp01(0.42 + (1 - l) * 0.08), s: Math.min(s, 0.45) };
  }
  if (role === "ink") {
    if (neutral) {
      return { l: l < 0.62 ? clamp01(0.9 - l * 0.08) : l, s: 0 };
    }
    if (l < 0.55) {
      return { l: clamp01(0.66 + (0.62 - l) * 0.06), s: Math.min(s, 0.55) };
    }
    if (l < 0.8) {
      return { l: clamp01(Math.max(l, 0.76)), s: Math.min(s, 0.62) };
    }
    return { l, s: Math.min(s, 0.62) };
  }
  if (neutral) {
    if (l >= 0.97) {
      return { l: 0.25, s: 0 };
    }
    if (l >= 0.84) {
      return { l: 0.14, s: 0 };
    }
    if (l >= 0.5) {
      return { l: 0.2, s: 0 };
    }
    return { l: Math.min(l, 0.18), s: 0 };
  }
  if (l >= 0.72) {
    const floor = chroma < 32 ? 0.2 : 0.1;
    return { l: clamp01(0.48 + (l - 0.72) * 0.16), s: Math.min(Math.max(s, floor), 0.34) };
  }
  return { l: clamp01(0.34 + l * 0.12), s: Math.min(s, 0.7) };
}

function nightChannels(r, g, b, role) {
  const hsl = rgbToHsl(r, g, b);
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const mapped = mapNight(hsl.l, hsl.s, chroma, role);
  return hslToRgb(hsl.h, mapped.s, mapped.l);
}

const nightStartHour = 20;
const nightEndHour = 6;

function isNightPeriod(date) {
  const hour = date.getHours();
  return hour >= nightStartHour || hour < nightEndHour;
}

function msUntilThemeBoundary(date) {
  const next = new Date(date.getTime());
  next.setSeconds(0, 0);
  next.setMinutes(0);
  if (isNightPeriod(date)) {
    next.setHours(nightEndHour);
    if (next <= date) {
      next.setDate(next.getDate() + 1);
    }
  } else {
    next.setHours(nightStartHour);
  }
  return next.getTime() - date.getTime();
}

function formatChannels(r, g, b, a, asHex) {
  if (a < 1) {
    const alpha = Math.round(a * 1000) / 1000;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (!asHex) {
    return `rgb(${r},${g},${b})`;
  }
  const hex = [r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("");
  return `#${hex}`;
}

function component(token) {
  const text = String(token).trim();
  if (text.endsWith("%")) {
    return clamp01(Number(text.slice(0, -1)) / 100) * 255;
  }
  return Number(text);
}

function alphaComponent(token) {
  if (token == null || token === "") {
    return 1;
  }
  const text = String(token).trim();
  if (text.endsWith("%")) {
    return clamp01(Number(text.slice(0, -1)) / 100);
  }
  return clamp01(Number(text));
}

function paintChannels(r, g, b, a, role, asHex) {
  if (a === 0) {
    return asHex ? "#00000000" : "rgba(0,0,0,0)";
  }
  const [nr, ng, nb] = nightChannels(r, g, b, role);
  return formatChannels(nr, ng, nb, a, asHex);
}

function hexToChannels(hex) {
  let body = hex.slice(1);
  if (body.length === 3 || body.length === 4) {
    body = body.split("").map((char) => char + char).join("");
  }
  return {
    r: parseInt(body.slice(0, 2), 16),
    g: parseInt(body.slice(2, 4), 16),
    b: parseInt(body.slice(4, 6), 16),
    a: body.length >= 8 ? parseInt(body.slice(6, 8), 16) / 255 : 1,
  };
}

function rewriteColorTokens(value, role) {
  const parts = value.split(/(url\([^)]*\))/i);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return part;
    }
    let next = part.replace(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g, (hex) => {
      const channels = hexToChannels(hex);
      return paintChannels(channels.r, channels.g, channels.b, channels.a, role, true);
    });
    next = next.replace(/rgba?\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*(?:,\s*([0-9.]+%?)\s*)?\)/gi, (_match, r, g, b, a) => {
      return paintChannels(component(r), component(g), component(b), alphaComponent(a), role, false);
    });
    next = next.replace(/rgba?\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+%?)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi, (_match, r, g, b, a) => {
      return paintChannels(component(r), component(g), component(b), alphaComponent(a), role, false);
    });
    next = next.replace(/hsla?\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%\s*(?:,\s*([0-9.]+%?)\s*)?\)/gi, (_match, h, s, l, a) => {
      const [r, g, b] = hslToRgb(Number(h), Number(s) / 100, Number(l) / 100);
      return paintChannels(r, g, b, alphaComponent(a), role, false);
    });
    next = next.replace(/\bwhite\b/gi, () => paintChannels(255, 255, 255, 1, role, true));
    return next;
  }).join("");
}

function roleFor(property) {
  const name = property.trim().toLowerCase();
  if (name === "color" || name === "fill" || name === "stroke" || name === "caret-color"
      || name === "text-decoration-color" || name === "-webkit-text-fill-color") {
    return "ink";
  }
  if (name === "background" || name === "background-color" || name === "background-image") {
    return "surface";
  }
  if (name === "box-shadow" || name === "text-shadow") {
    return "shadow";
  }
  if (name === "border" || name === "outline" || name.indexOf("border") === 0 || name === "outline-color") {
    return "line";
  }
  return null;
}

function rewriteNightColors(cssText) {
  return String(cssText).replace(/([^{}]*)\{([^{}]*)\}/g, (match, selector, body) => {
    const rewritten = body.replace(/([-\w]+)\s*:\s*([^;]+)/g, (declaration, property, value) => {
      const role = roleFor(property);
      if (!role) {
        return declaration;
      }
      return `${property}:${rewriteColorTokens(value, role)}`;
    });
    return `${selector}{${rewritten}}`;
  });
}

function officialNightSupported(cssText) {
  return /prefers-color-scheme\s*:/i.test(String(cssText));
}

function luminance(r, g, b) {
  const channel = (value) => {
    const scaled = value / 255;
    return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function parsedColor(text) {
  const source = String(text).trim();
  const hex = source.match(/^#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})$/);
  if (hex) {
    return hexToChannels(source);
  }
  const rgb = source.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/i)
    || source.match(/^rgba?\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)$/i);
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] == null ? 1 : Number(rgb[4]),
    };
  }
  return null;
}

function alreadyNight(background) {
  const color = parsedColor(background);
  if (!color || color.a < 0.5) {
    return false;
  }
  return luminance(color.r, color.g, color.b) < 0.35;
}

function nightColor(color, role) {
  return rewriteColorTokens(color, role);
}

function nightLogoRule() {
  return `.navigation-header svg path{fill:${nightColor("#000000", "ink")}}`;
}

function nightFoldRule() {
  const fill = nightColor("#000000", "ink");
  return `.card-context-translations>.toggle-icon svg path,.collapsible-box>.toggle-icon svg path{fill:${fill}}`;
}

const api = {
  alreadyNight,
  isNightPeriod,
  luminance,
  msUntilThemeBoundary,
  nightColor,
  nightFoldRule,
  nightLogoRule,
  officialNightSupported,
  parsedColor,
  rewriteNightColors,
};

function sameOriginStylesheet(link) {
  try {
    return new URL(link.href).origin === location.origin;
  } catch {
    return false;
  }
}

function install() {
  const root = document.documentElement;
  if (!root || root.dataset.lvNight === "1" || root.dataset.lvNight === "pending" || root.dataset.lvNight === "off") {
    return;
  }
  let boundaryTimer = null;
  let observer = null;

  function armBoundary() {
    if (boundaryTimer) {
      clearTimeout(boundaryTimer);
    }
    boundaryTimer = setTimeout(() => {
      boundaryTimer = null;
      if (root.dataset.lvNight === "off") {
        return;
      }
      if (isNightPeriod(new Date())) {
        if (root.dataset.lvNight !== "1" && root.dataset.lvNight !== "pending") {
          delete root.dataset.lvNight;
          beginNight();
        }
        armBoundary();
        return;
      }
      endNightForDay();
    }, msUntilThemeBoundary(new Date()));
  }

  function endNightForDay() {
    root.dataset.lvNight = "day";
    if (observer) {
      observer.disconnect();
    }
    const sheet = document.querySelector('style[data-lv-night="1"]');
    if (sheet) {
      sheet.remove();
    }
    armBoundary();
  }

  if (!isNightPeriod(new Date())) {
    root.dataset.lvNight = "day";
    armBoundary();
    return;
  }

  beginNight();
  armBoundary();

  function beginNight() {
  root.dataset.lvNight = "pending";
  const cache = new Map();
  let pass = 0;
  let scheduled = false;

  function ownSheet() {
    return document.querySelector('style[data-lv-night="1"]');
  }

  function stop(reason) {
    root.dataset.lvNight = reason;
    if (boundaryTimer) {
      clearTimeout(boundaryTimer);
      boundaryTimer = null;
    }
    if (observer) {
      observer.disconnect();
    }
    const sheet = ownSheet();
    if (sheet) {
      sheet.remove();
    }
  }

  function sourceText() {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter(sameOriginStylesheet);
    const inline = Array.from(document.querySelectorAll("style"))
      .filter((node) => node.dataset.lvNight !== "1")
      .map((node) => node.textContent || "");
    const reads = links.map((link) => {
      if (cache.has(link.href)) {
        return Promise.resolve(cache.get(link.href));
      }
      return fetch(link.href).then((response) => response.text()).then((text) => {
        cache.set(link.href, text);
        return text;
      });
    });
    return Promise.all(reads).then((sheets) => sheets.concat(inline).join("\n"));
  }

  function rebuild() {
    const current = ++pass;
    const hadSheet = Boolean(ownSheet());
    const running = sourceText().then((cssText) => {
      if (current !== pass || root.dataset.lvNight === "off" || root.dataset.lvNight === "day") {
        return;
      }
      if (officialNightSupported(cssText)) {
        stop("off");
        return;
      }
      if (!hadSheet) {
        const background = getComputedStyle(document.body || root).backgroundColor;
        if (alreadyNight(background)) {
          stop("off");
          return;
        }
      }
      let sheet = ownSheet();
      if (!sheet) {
        sheet = document.createElement("style");
        sheet.dataset.lvNight = "1";
      }
      const next = `${rewriteNightColors(cssText)}\nhtml{color-scheme:dark}\n${nightLogoRule()}\n${nightFoldRule()}`;
      if (sheet.textContent !== next) {
        sheet.textContent = next;
      }
      root.appendChild(sheet);
      root.dataset.lvNight = "1";
    });
    if (running && typeof running.catch === "function") {
      running.catch(() => {
        if (root.dataset.lvNight === "pending") {
          delete root.dataset.lvNight;
        }
      });
    }
  }

  function schedule() {
    if (scheduled || root.dataset.lvNight === "off" || root.dataset.lvNight === "day") {
      return;
    }
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (root.dataset.lvNight !== "off") {
        rebuild();
      }
    });
  }

  observer = new MutationObserver(schedule);
  observer.observe(document.head || root, { childList: true, subtree: true });
  schedule();
  }
}

if (typeof module === "object" && module.exports) {
  module.exports = api;
}

if (typeof document !== "undefined" && document.documentElement) {
  install();
}
