const studyUrl = "https://learn.lingvist.com/";
const studyOrigin = "https://learn.lingvist.com";

const inAppHosts = Object.freeze([
  "learn.lingvist.com",
  "accounts.google.com",
  "apis.google.com",
  "www.google.com",
  "www.gstatic.com",
  "www.recaptcha.net",
  "appleid.apple.com",
  "facebook.com",
  "weibo.com",
  "dataporten.no",
]);

function chromeUserAgent(userAgent) {
  return String(userAgent ?? "")
    .replace(/ ?Electron\/\S+/g, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

function hostAllowed(hostname) {
  const host = String(hostname).toLowerCase();
  return inAppHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

function classifyNavigation(rawUrl, { popup = false } = {}) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return "drop";
  }

  if (url.protocol === "https:" && hostAllowed(url.hostname)) {
    return "allow";
  }

  if (url.protocol === "about:" && url.pathname.toLowerCase() === "blank") {
    return popup ? "allow" : "drop";
  }

  if (url.protocol === "https:") {
    return "external";
  }

  return "drop";
}

function originOf(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAudioOnly(request) {
  if (Array.isArray(request.mediaTypes)) {
    return request.mediaTypes.length === 1 && request.mediaTypes[0] === "audio";
  }
  return request.mediaType === "audio";
}

const grantedPermissions = new Set([
  "fullscreen",
  "clipboard-sanitized-write",
  "persistent-storage",
  "pointerLock",
]);

const deniedPermissions = new Set([
  "notifications",
  "geolocation",
  "geolocation-approximate",
  "camera",
  "display-capture",
]);

function isStudyHost(hostname) {
  const host = String(hostname).toLowerCase();
  return host === "learn.lingvist.com" || host.endsWith(".learn.lingvist.com");
}

function classifyWindowOpen(rawUrl) {
  const decision = classifyNavigation(rawUrl, { popup: true });
  if (decision !== "allow") {
    return decision;
  }
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "https:" && isStudyHost(url.hostname)) {
      return "main";
    }
  } catch {
    return "drop";
  }
  return "allow";
}

function classifyPermission(request) {
  if (request.permission === "media") {
    return isMicrophoneRequest(request) ? "microphone" : "deny";
  }
  if (deniedPermissions.has(request.permission)) {
    return "deny";
  }
  if (grantedPermissions.has(request.permission)) {
    return "allow";
  }
  return "deny";
}

function isMicrophoneRequest(request) {
  if (request.permission !== "media" || request.isMainFrame !== true) {
    return false;
  }
  if (!isAudioOnly(request)) {
    return false;
  }

  const primary = [request.requestingOrigin, request.requestingUrl].filter(Boolean);
  if (primary.length === 0 || primary.some((value) => originOf(value) !== studyOrigin)) {
    return false;
  }
  if (request.securityOrigin && originOf(request.securityOrigin) !== studyOrigin) {
    return false;
  }
  return true;
}

module.exports = {
  studyUrl,
  studyOrigin,
  inAppHosts,
  chromeUserAgent,
  classifyNavigation,
  classifyPermission,
  classifyWindowOpen,
  isMicrophoneRequest,
};
