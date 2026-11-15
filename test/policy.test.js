const assert = require("node:assert/strict");
const test = require("node:test");
const {
  chromeUserAgent,
  classifyNavigation,
  isMicrophoneRequest,
  studyOrigin,
} = require("../src/policy");

const chromeUa = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.8078.100 Electron/45.3.3 Safari/537.36";

test("chrome user agent keeps the Chrome version and drops the Electron token", () => {
  const stripped = chromeUserAgent(chromeUa);

  assert.equal(
    stripped,
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.8078.100 Safari/537.36",
  );
  assert.equal(stripped.includes("Electron/"), false);
  assert.equal(chromeUserAgent(stripped), stripped);
});

test("in-app hosts stay in the window, including login subdomains", () => {
  const allowed = [
    "https://learn.lingvist.com/",
    "https://learn.lingvist.com/#guess",
    "https://Learn.Lingvist.com/oauth.html",
    "https://accounts.google.com/o/oauth2/v2/auth",
    "https://apis.google.com/js/api.js",
    "https://www.google.com/recaptcha/api2/anchor",
    "https://www.gstatic.com/recaptcha/releases/x/recaptcha__en.js",
    "https://www.recaptcha.net/recaptcha/api2/",
    "https://appleid.apple.com/auth/authorize",
    "https://facebook.com/login.php",
    "https://www.facebook.com/v18.0/dialog/oauth",
    "https://weibo.com/signup/signup.php",
    "https://api.weibo.com/oauth2/authorize",
    "https://dataporten.no/",
    "https://auth.dataporten.no/oauth/authorization",
  ];

  for (const url of allowed) {
    assert.equal(classifyNavigation(url), "allow", url);
    assert.equal(classifyNavigation(url, { popup: true }), "allow", url);
  }
});

test("other https links leave the app, and unsafe schemes are dropped", () => {
  assert.equal(classifyNavigation("https://help.lingvist.com/hc"), "external");
  assert.equal(classifyNavigation("https://pay.lingvist.com/checkout"), "external");
  assert.equal(classifyNavigation("https://mail.google.com/"), "external");
  assert.equal(classifyNavigation("https://google.com/"), "external");
  assert.equal(classifyNavigation("https://notfacebook.com/"), "external");
  assert.equal(classifyNavigation("https://learn.lingvist.com.evil.example/"), "external");

  for (const url of [
    "http://learn.lingvist.com/",
    "http://evil.example/",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "data:text/html,hi",
    "about:srcdoc",
    "not a url",
  ]) {
    assert.equal(classifyNavigation(url), "drop", url);
    assert.equal(classifyNavigation(url, { popup: true }), "drop", url);
  }
});

test("about:blank is allowed only as a popup", () => {
  assert.equal(classifyNavigation("about:blank"), "drop");
  assert.equal(classifyNavigation("about:blank"), "drop");
  assert.equal(classifyNavigation("about:blank#ignored"), "drop");
  assert.equal(classifyNavigation("about:blank", { popup: true }), "allow");
  assert.equal(classifyNavigation("about:blank#ignored", { popup: true }), "allow");
});

test("microphone permission is audio only on the study origin main frame", () => {
  const allowed = {
    permission: "media",
    isMainFrame: true,
    requestingUrl: "https://learn.lingvist.com/#guess",
    requestingOrigin: studyOrigin,
    securityOrigin: studyOrigin,
    mediaTypes: ["audio"],
  };

  assert.equal(isMicrophoneRequest(allowed), true);
  assert.equal(isMicrophoneRequest({ ...allowed, mediaTypes: undefined, mediaType: "audio" }), true);
  assert.equal(isMicrophoneRequest({ ...allowed, mediaTypes: ["video"] }), false);
  assert.equal(isMicrophoneRequest({ ...allowed, mediaTypes: ["audio", "video"] }), false);
  assert.equal(isMicrophoneRequest({ ...allowed, mediaType: "video", mediaTypes: undefined }), false);
  assert.equal(isMicrophoneRequest({ ...allowed, permission: "notifications" }), false);
  assert.equal(isMicrophoneRequest({ ...allowed, permission: "geolocation" }), false);
  assert.equal(isMicrophoneRequest({ ...allowed, permission: "camera" }), false);
  assert.equal(isMicrophoneRequest({ ...allowed, isMainFrame: false }), false);
  assert.equal(isMicrophoneRequest({
    ...allowed,
    requestingUrl: "https://accounts.google.com/",
    requestingOrigin: "https://accounts.google.com",
  }), false);
  assert.equal(isMicrophoneRequest({
    ...allowed,
    securityOrigin: "https://evil.example",
  }), false);
  assert.equal(isMicrophoneRequest({
    permission: "media",
    isMainFrame: true,
    mediaTypes: ["audio"],
  }), false);
});
