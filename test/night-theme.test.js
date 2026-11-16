const assert = require("node:assert/strict");
const test = require("node:test");
const {
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
} = require("../src/night-theme");

function hueOf(color) {
  const parsed = parsedColor(color.startsWith("#") || color.startsWith("rgb") ? color : nightColor(color, "surface"));
  const channels = parsed || parsedColor(nightColor(color, "surface"));
  const r = channels.r / 255;
  const g = channels.g / 255;
  const b = channels.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) {
    return 0;
  }
  const d = max - min;
  let hue;
  if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return hue * 60;
}

function hueDelta(left, right) {
  const gap = Math.abs(left - right) % 360;
  return Math.min(gap, 360 - gap);
}

test("night surfaces go dark and night ink goes light, keeping the page hue", () => {
  const surface = parsedColor(nightColor("#ffffff", "surface"));
  const pale = parsedColor(nightColor("#eef0f4", "surface"));
  const ink = parsedColor(nightColor("#000000", "ink"));
  const blue = "#0098f0";
  const future = "#ff00aa";

  const teal = parsedColor(nightColor("rgb(3, 120, 137)", "ink"));
  const lavender = parsedColor(nightColor("rgb(226, 180, 255)", "surface"));
  const wash = parsedColor(nightColor("rgb(224, 235, 239)", "surface"));
  const purple = parsedColor(nightColor("rgb(172, 110, 209)", "ink"));
  const wrong = parsedColor(nightColor("rgb(254, 92, 85)", "ink"));
  assert.ok(luminance(surface.r, surface.g, surface.b) < 0.2);
  assert.ok(luminance(pale.r, pale.g, pale.b) < 0.2);
  assert.ok(luminance(surface.r, surface.g, surface.b) - luminance(pale.r, pale.g, pale.b) > 0.02);
  assert.ok(luminance(ink.r, ink.g, ink.b) > 0.75);
  assert.ok(luminance(teal.r, teal.g, teal.b) > 0.25);
  assert.ok(luminance(teal.r, teal.g, teal.b) < 0.6);
  assert.ok(Math.max(teal.r, teal.g, teal.b) - Math.min(teal.r, teal.g, teal.b) < 140);
  assert.ok(luminance(lavender.r, lavender.g, lavender.b) > luminance(surface.r, surface.g, surface.b));
  assert.ok(luminance(lavender.r, lavender.g, lavender.b) < 0.35);
  assert.ok(lavender.b > lavender.g);
  assert.ok(luminance(wash.r, wash.g, wash.b) > luminance(surface.r, surface.g, surface.b));
  assert.ok(wash.b > wash.r);
  assert.ok(luminance(purple.r, purple.g, purple.b) > 0.35);
  assert.ok(purple.b > purple.r && purple.r > purple.g);
  assert.ok(wrong.r > wrong.g + 40);
  assert.ok(hueDelta(hueOf(blue), hueOf(nightColor(blue, "surface"))) < 1);
  assert.ok(hueDelta(hueOf(future), hueOf(nightColor(future, "surface"))) < 1);
});

test("a stylesheet keeps image urls and follows a later official night mode", () => {
  const rewritten = rewriteNightColors(".card{background:url(sprite.png) #ffffff;color:#111111}");
  assert.match(rewritten, /url\(sprite\.png\)/);
  const background = rewritten.match(/background:url\(sprite\.png\) (#[0-9a-f]{6})/);
  const color = rewritten.match(/color:(#[0-9a-f]{6})/);
  assert.ok(background);
  assert.ok(color);
  const surface = parsedColor(background[1]);
  const ink = parsedColor(color[1]);
  assert.ok(luminance(surface.r, surface.g, surface.b) < 0.2);
  assert.ok(luminance(ink.r, ink.g, ink.b) > 0.75);
  assert.equal(rewriteNightColors(".fade{background:rgba(255,255,255,.4)}").includes(".4"), true);
  assert.equal(officialNightSupported("body{background:#fff}"), false);
  assert.equal(officialNightSupported("@media (prefers-color-scheme: dark){body{background:#111}}"), true);
  assert.equal(alreadyNight("rgb(12, 16, 24)"), true);
  assert.equal(alreadyNight("rgb(12 16 24)"), true);
  assert.equal(alreadyNight("rgba(0, 0, 0, 0)"), false);
});

test("the header logo takes the night ink while the night sheet is up", () => {
  const rule = nightLogoRule();
  const fill = rule.match(/^(\.navigation-header svg path)\{fill:(#[0-9a-f]{6})\}$/);
  assert.ok(fill);
  const logo = parsedColor(fill[2]);
  const ink = parsedColor(nightColor("#000000", "ink"));
  assert.deepEqual(logo, ink);
  assert.ok(luminance(logo.r, logo.g, logo.b) > 0.75);
});

test("the translation fold control takes the night ink", () => {
  const rule = nightFoldRule();
  assert.match(rule, /^\.card-context-translations>\.toggle-icon svg path,/);
  assert.match(rule, /\.collapsible-box>\.toggle-icon svg path\{fill:#[0-9a-f]{6}\}$/);
  const fill = parsedColor(rule.match(/fill:(#[0-9a-f]{6})/)[1]);
  assert.deepEqual(fill, parsedColor(nightColor("#000000", "ink")));
  assert.ok(luminance(fill.r, fill.g, fill.b) > 0.75);
});

test("night colors run from 20:00 to 06:00 local time", () => {
  const evening = new Date(2026, 10, 16, 20, 0, 0);
  const morning = new Date(2026, 10, 16, 6, 0, 0);
  const afternoon = new Date(2026, 10, 16, 15, 30, 0);
  const predawn = new Date(2026, 10, 16, 3, 0, 0);
  assert.equal(isNightPeriod(evening), true);
  assert.equal(isNightPeriod(predawn), true);
  assert.equal(isNightPeriod(morning), false);
  assert.equal(isNightPeriod(afternoon), false);
  assert.equal(msUntilThemeBoundary(new Date(2026, 10, 16, 19, 0, 0)), 60 * 60 * 1000);
  assert.equal(msUntilThemeBoundary(evening), 10 * 60 * 60 * 1000);
  assert.equal(msUntilThemeBoundary(predawn), 3 * 60 * 60 * 1000);
  assert.equal(msUntilThemeBoundary(morning), 14 * 60 * 60 * 1000);
});
