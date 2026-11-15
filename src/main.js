const { app, BrowserWindow, Menu, dialog, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const {
  chromeUserAgent,
  classifyNavigation,
  isMicrophoneRequest,
  studyOrigin,
  studyUrl,
} = require("./policy");

const timerSource = fs.readFileSync(path.join(__dirname, "timer-wrapper.js"), "utf8");
const microphoneDecisionFile = "microphone.json";

let mainWindow = null;
let decisionLoaded = false;
let decisionAllow = null;
let pendingPrompt = null;

function pageWebPreferences() {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  };
}

function microphoneDecisionPath() {
  return path.join(app.getPath("userData"), microphoneDecisionFile);
}

function rememberedMicrophone() {
  if (!decisionLoaded) {
    decisionLoaded = true;
    decisionAllow = null;
    try {
      const parsed = JSON.parse(fs.readFileSync(microphoneDecisionPath(), "utf8"));
      if (parsed && typeof parsed.allow === "boolean") {
        decisionAllow = parsed.allow;
      }
    } catch {
      decisionAllow = null;
    }
  }
  return decisionAllow;
}

function rememberMicrophone(allow) {
  decisionLoaded = true;
  decisionAllow = allow;
  try {
    const directory = app.getPath("userData");
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(microphoneDecisionPath(), `${JSON.stringify({ allow })}\n`);
  } catch {
    // The running process still keeps this answer.
  }
}

function askMicrophone(webContents) {
  const remembered = rememberedMicrophone();
  if (typeof remembered === "boolean") {
    return Promise.resolve(remembered);
  }
  if (!pendingPrompt) {
    const options = {
      type: "question",
      buttons: ["Allow", "Deny"],
      defaultId: 1,
      cancelId: 1,
      title: "Microphone",
      message: `Allow ${studyOrigin} to use the microphone?`,
    };
    const parent = BrowserWindow.fromWebContents(webContents);
    const prompt = parent
      ? dialog.showMessageBox(parent, options)
      : dialog.showMessageBox(options);
    pendingPrompt = Promise.resolve(prompt)
      .then((result) => {
        const allow = result.response === 0;
        rememberMicrophone(allow);
        return allow;
      })
      .catch(() => false)
      .finally(() => {
        pendingPrompt = null;
      });
  }
  return pendingPrompt;
}

function microphoneDetails(requestingOrigin, details) {
  return {
    permission: "media",
    isMainFrame: details && details.isMainFrame,
    requestingOrigin,
    requestingUrl: details && details.requestingUrl,
    securityOrigin: details && details.securityOrigin,
    mediaType: details && details.mediaType,
    mediaTypes: details && details.mediaTypes,
  };
}

function installPermissionHandlers() {
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (!webContents || permission !== "media") {
      return false;
    }
    const request = microphoneDetails(requestingOrigin, details);
    request.permission = permission;
    if (!isMicrophoneRequest(request)) {
      return false;
    }
    return rememberedMicrophone() === true;
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const request = microphoneDetails(undefined, details);
    request.permission = permission;
    if (!webContents || !isMicrophoneRequest(request)) {
      callback(false);
      return;
    }
    askMicrophone(webContents).then(callback, () => callback(false));
  });
}

function openInSystemBrowser(url) {
  const opening = shell.openExternal(url);
  if (opening && typeof opening.catch === "function") {
    opening.catch(() => {});
  }
}

function isPopup(contents) {
  return !mainWindow || contents !== mainWindow.webContents;
}

function navigationUrl(event, url) {
  if (typeof url === "string") {
    return url;
  }
  if (event && typeof event.url === "string") {
    return event.url;
  }
  return "";
}

function handleNavigation(event, url, popup) {
  if (event && event.isMainFrame === false) {
    return;
  }
  const target = navigationUrl(event, url);
  const decision = classifyNavigation(target, { popup });
  if (decision === "allow") {
    return;
  }
  event.preventDefault();
  if (decision === "external") {
    openInSystemBrowser(target);
  }
}

function installTimer(contents) {
  let current;
  try {
    current = new URL(contents.getURL());
  } catch {
    return;
  }
  if (current.origin !== studyOrigin) {
    return;
  }
  const running = contents.executeJavaScript(timerSource);
  if (running && typeof running.catch === "function") {
    running.catch(() => {});
  }
}

function attachContents(contents) {
  contents.setWindowOpenHandler((details) => {
    const decision = classifyNavigation(details && details.url, { popup: true });
    if (decision === "external") {
      openInSystemBrowser(details.url);
    }
    if (decision !== "allow") {
      return { action: "deny" };
    }
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        webPreferences: pageWebPreferences(),
      },
    };
  });

  contents.on("will-navigate", (event, url) => {
    handleNavigation(event, url, isPopup(contents));
  });
  contents.on("will-redirect", (event, url) => {
    handleNavigation(event, url, isPopup(contents));
  });
  contents.on("dom-ready", () => {
    installTimer(contents);
  });
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (typeof mainWindow.isVisible === "function" && !mainWindow.isVisible()) {
    mainWindow.show();
  }
  mainWindow.focus();
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: pageWebPreferences(),
  });
  mainWindow = win;
  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
    app.quit();
  });
  const loading = win.loadURL(studyUrl);
  if (loading && typeof loading.catch === "function") {
    loading.catch(() => {});
  }
}

function start() {
  const userAgent = chromeUserAgent(app.userAgentFallback);
  app.userAgentFallback = userAgent;
  session.defaultSession.setUserAgent(userAgent);
  session.defaultSession.setSpellCheckerEnabled(false);
  Menu.setApplicationMenu(null);
  installPermissionHandlers();
  createMainWindow();
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    focusMainWindow();
  });
  app.on("browser-window-created", (_event, window) => {
    window.setMenu(null);
  });
  app.on("web-contents-created", (_event, contents) => {
    if (typeof contents.getType === "function" && contents.getType() !== "window") {
      return;
    }
    attachContents(contents);
  });
  app.on("window-all-closed", () => {
    app.quit();
  });
  app.whenReady().then(start);
}
