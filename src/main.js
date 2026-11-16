const { app, BrowserWindow, Menu, dialog, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const {
  chromeUserAgent,
  classifyNavigation,
  classifyPermission,
  classifyWindowOpen,
  studyOrigin,
  studyUrl,
} = require("./policy");

const timerSource = fs.readFileSync(path.join(__dirname, "timer-wrapper.js"), "utf8");
const nightSource = fs.readFileSync(path.join(__dirname, "night-theme.js"), "utf8");
const noticeSource = fs.readFileSync(path.join(__dirname, "study-notices.js"), "utf8");
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
      if (parsed && parsed.allow === true) {
        decisionAllow = true;
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
  if (rememberedMicrophone() === true) {
    return Promise.resolve(true);
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
        if (allow) {
          rememberMicrophone(true);
        }
        return allow;
      })
      .catch(() => false)
      .finally(() => {
        pendingPrompt = null;
      });
  }
  return pendingPrompt;
}

function permissionRequest(permission, requestingOrigin, details) {
  return {
    permission,
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
    const decision = classifyPermission(permissionRequest(permission, requestingOrigin, details));
    if (decision === "allow") {
      return true;
    }
    if (!webContents || decision !== "microphone") {
      return false;
    }
    return rememberedMicrophone() === true;
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const decision = classifyPermission(permissionRequest(permission, undefined, details));
    if (decision === "allow") {
      callback(true);
      return;
    }
    if (!webContents || decision !== "microphone") {
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

function installPageScript(contents, source) {
  let current;
  try {
    current = new URL(contents.getURL());
  } catch {
    return;
  }
  if (current.origin !== studyOrigin) {
    return;
  }
  const running = contents.executeJavaScript(source);
  if (running && typeof running.catch === "function") {
    running.catch(() => {});
  }
}

function openInMainWindow(url) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  const loading = mainWindow.loadURL(url);
  if (loading && typeof loading.catch === "function") {
    loading.catch(() => {});
  }
  focusMainWindow();
}

function attachContents(contents) {
  contents.setWindowOpenHandler((details) => {
    const decision = classifyWindowOpen(details && details.url);
    if (decision === "external") {
      openInSystemBrowser(details.url);
    }
    if (decision === "main") {
      openInMainWindow(details.url);
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
    installPageScript(contents, noticeSource);
    installPageScript(contents, nightSource);
    installPageScript(contents, timerSource);
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

function windowIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "icon.png");
  }
  return path.join(__dirname, "..", "assets", "icon.png");
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: windowIconPath(),
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
