const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "..", "src", "main.js");
const mainSource = fs.readFileSync(sourcePath, "utf8");
const timerSource = fs.readFileSync(path.join(__dirname, "..", "src", "timer-wrapper.js"), "utf8");
const scratchRoot = path.join(__dirname, "..", "tmp", "test-userdata");

function loadMain({ lock = true, permissionResponse = 0, userData } = {}) {
  const appHandlers = new Map();
  const windows = [];
  const opened = [];
  const prompts = [];
  const sessionState = {
    userAgent: "",
    spellchecker: true,
    permissionHandlers: {},
  };
  let readyCallback = null;
  let readyCalls = 0;
  let quitCalls = 0;
  let applicationMenu = "default";
  let nextContentsId = 1;
  fs.mkdirSync(scratchRoot, { recursive: true });
  const directory = userData ?? fs.mkdtempSync(path.join(scratchRoot, "user-"));

  const app = {
    userAgentFallback: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.8078.100 Electron/45.3.3 Safari/537.36",
    requestSingleInstanceLock() {
      return lock;
    },
    quit() {
      quitCalls += 1;
    },
    on(eventName, callback) {
      appHandlers.set(eventName, callback);
    },
    whenReady() {
      readyCalls += 1;
      return {
        then(callback) {
          readyCallback = callback;
        },
      };
    },
    getPath(name) {
      if (name !== "userData") {
        throw new Error(`unexpected path ${name}`);
      }
      return directory;
    },
    setPath() {
      throw new Error("userData stays on the default persistent path");
    },
  };

  function createContents(owner) {
    const contents = {
      id: nextContentsId,
      owner,
      handlers: new Map(),
      windowOpenHandler: null,
      scripts: [],
      getType() {
        return "window";
      },
      getURL() {
        return owner.loadedURL ?? "";
      },
      on(eventName, callback) {
        this.handlers.set(eventName, callback);
      },
      setWindowOpenHandler(callback) {
        this.windowOpenHandler = callback;
      },
      executeJavaScript(code) {
        this.scripts.push(code);
        return Promise.resolve();
      },
    };
    nextContentsId += 1;
    return contents;
  }

  class BrowserWindow {
    constructor(options) {
      this.options = options;
      this.webContents = createContents(this);
      this.menu = "default";
      this.loadedURL = "";
      this.minimized = false;
      this.visible = true;
      this.destroyed = false;
      this.handlers = new Map();
      this.restored = false;
      this.focused = false;
      this.shown = false;
      windows.push(this);
      const contentsHandler = appHandlers.get("web-contents-created");
      if (contentsHandler) {
        contentsHandler({}, this.webContents);
      }
      const windowHandler = appHandlers.get("browser-window-created");
      if (windowHandler) {
        windowHandler({}, this);
      }
    }

    static fromWebContents(contents) {
      return contents.owner;
    }

    loadURL(url) {
      this.loadedURL = url;
      return Promise.resolve();
    }

    on(eventName, callback) {
      this.handlers.set(eventName, callback);
    }

    setMenu(menu) {
      this.menu = menu;
    }

    isDestroyed() {
      return this.destroyed;
    }

    isMinimized() {
      return this.minimized;
    }

    isVisible() {
      return this.visible;
    }

    restore() {
      this.restored = true;
      this.minimized = false;
    }

    show() {
      this.shown = true;
      this.visible = true;
    }

    focus() {
      this.focused = true;
    }
  }

  const electron = {
    app,
    BrowserWindow,
    Menu: {
      setApplicationMenu(menu) {
        applicationMenu = menu;
      },
    },
    dialog: {
      showMessageBox(...args) {
        prompts.push(args);
        return Promise.resolve({ response: permissionResponse });
      },
    },
    session: {
      defaultSession: {
        setUserAgent(userAgent) {
          sessionState.userAgent = userAgent;
        },
        setSpellCheckerEnabled(enabled) {
          sessionState.spellchecker = enabled;
        },
        setPermissionCheckHandler(callback) {
          sessionState.permissionHandlers.check = callback;
        },
        setPermissionRequestHandler(callback) {
          sessionState.permissionHandlers.request = callback;
        },
        get webRequest() {
          throw new Error("page requests are not filtered");
        },
      },
    },
    shell: {
      openExternal(url) {
        opened.push(url);
        return Promise.resolve();
      },
    },
  };

  vm.runInNewContext(mainSource, {
    __dirname: path.dirname(sourcePath),
    require(moduleName) {
      if (moduleName === "electron") {
        return electron;
      }
      if (moduleName === "./policy") {
        return require("../src/policy");
      }
      return require(moduleName);
    },
    URL,
  });

  return {
    app,
    appHandlers,
    applicationMenu: () => applicationMenu,
    directory,
    opened,
    prompts,
    quitCalls: () => quitCalls,
    ready() {
      readyCallback();
    },
    readyCalls: () => readyCalls,
    sessionState,
    windows,
  };
}

function navigationEvent(url, isMainFrame = true) {
  return {
    url,
    isMainFrame,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
}

test("the shell source does not take page requests, keys, or a preload", () => {
  assert.equal(mainSource.includes("webRequest"), false);
  assert.equal(mainSource.includes("globalShortcut"), false);
  assert.equal(mainSource.includes("preload"), false);
});

test("the app waits until it is ready, then opens one isolated study window", () => {
  const loaded = loadMain();

  assert.equal(loaded.windows.length, 0);
  loaded.ready();

  assert.equal(loaded.windows.length, 1);
  const win = loaded.windows[0];
  assert.equal(win.options.webPreferences.contextIsolation, true);
  assert.equal(win.options.webPreferences.nodeIntegration, false);
  assert.equal(win.options.webPreferences.sandbox, true);
  assert.deepEqual(Object.keys(win.options.webPreferences).sort(), [
    "contextIsolation",
    "nodeIntegration",
    "sandbox",
  ]);
  assert.equal(win.options.webPreferences.preload, undefined);
  assert.equal(win.options.icon, path.join(__dirname, "..", "assets", "icon.png"));
  assert.equal(fs.existsSync(win.options.icon), true);
  assert.equal(win.loadedURL, "https://learn.lingvist.com/");
  assert.equal(win.menu, null);
  assert.equal(loaded.applicationMenu(), null);
  assert.equal(loaded.sessionState.spellchecker, false);
  assert.equal(
    loaded.sessionState.userAgent,
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.8078.100 Safari/537.36",
  );
  assert.equal(loaded.app.userAgentFallback, loaded.sessionState.userAgent);
  fs.rmSync(loaded.directory, { recursive: true, force: true });
});

test("a second launch focuses the open window", () => {
  const loaded = loadMain();
  loaded.ready();
  loaded.windows[0].minimized = true;
  loaded.windows[0].visible = false;

  loaded.appHandlers.get("second-instance")();

  assert.equal(loaded.windows.length, 1);
  assert.equal(loaded.windows[0].restored, true);
  assert.equal(loaded.windows[0].shown, true);
  assert.equal(loaded.windows[0].focused, true);
  fs.rmSync(loaded.directory, { recursive: true, force: true });
});

test("a second process quits instead of opening another window", () => {
  const loaded = loadMain({ lock: false });

  assert.equal(loaded.quitCalls(), 1);
  assert.equal(loaded.readyCalls(), 0);
  assert.equal(loaded.windows.length, 0);
  fs.rmSync(loaded.directory, { recursive: true, force: true });
});

test("main-frame navigation follows the host and scheme rules", () => {
  const loaded = loadMain();
  loaded.ready();
  const contents = loaded.windows[0].webContents;

  const study = navigationEvent("https://learn.lingvist.com/#hub");
  contents.handlers.get("will-navigate")(study, study.url);
  assert.equal(study.prevented, false);

  const apple = navigationEvent("https://appleid.apple.com/auth/authorize");
  contents.handlers.get("will-navigate")(apple, apple.url);
  assert.equal(apple.prevented, false);

  const payment = navigationEvent("https://pay.lingvist.com/checkout");
  contents.handlers.get("will-navigate")(payment, payment.url);
  assert.equal(payment.prevented, true);

  const insecure = navigationEvent("http://learn.lingvist.com/");
  contents.handlers.get("will-navigate")(insecure, insecure.url);
  assert.equal(insecure.prevented, true);

  const blank = navigationEvent("about:blank");
  contents.handlers.get("will-navigate")(blank, blank.url);
  assert.equal(blank.prevented, true);

  const dataUrl = navigationEvent("data:text/html,hi");
  contents.handlers.get("will-redirect")(dataUrl, dataUrl.url);
  assert.equal(dataUrl.prevented, true);

  const frame = navigationEvent("https://evil.example/tracker", false);
  contents.handlers.get("will-redirect")(frame, frame.url);
  assert.equal(frame.prevented, false);

  assert.deepEqual(loaded.opened, ["https://pay.lingvist.com/checkout"]);
  fs.rmSync(loaded.directory, { recursive: true, force: true });
});

test("popups stay in-app only for about:blank and login hosts", () => {
  const loaded = loadMain();
  loaded.ready();
  const open = loaded.windows[0].webContents.windowOpenHandler;

  const blank = open({ url: "about:blank" });
  assert.equal(blank.action, "allow");
  const popupPreferences = blank.overrideBrowserWindowOptions.webPreferences;
  assert.equal(popupPreferences.contextIsolation, true);
  assert.equal(popupPreferences.nodeIntegration, false);
  assert.equal(popupPreferences.sandbox, true);
  assert.equal(popupPreferences.preload, undefined);

  const facebook = open({ url: "https://www.facebook.com/v18.0/dialog/oauth" });
  assert.equal(facebook.action, "allow");

  const help = open({ url: "https://help.lingvist.com/hc" });
  assert.equal(help.action, "deny");

  const script = open({ url: "javascript:alert(1)" });
  assert.equal(script.action, "deny");

  const study = open({ url: "https://learn.lingvist.com/#hub" });
  assert.equal(study.action, "deny");
  assert.equal(loaded.windows.length, 1);
  assert.equal(loaded.windows[0].loadedURL, "https://learn.lingvist.com/#hub");
  assert.equal(loaded.windows[0].focused, true);

  assert.deepEqual(loaded.opened, ["https://help.lingvist.com/hc"]);
  fs.rmSync(loaded.directory, { recursive: true, force: true });
});

test("the timer wrapper is installed on the study page", () => {
  const loaded = loadMain();
  loaded.ready();
  const contents = loaded.windows[0].webContents;

  contents.handlers.get("dom-ready")();
  assert.deepEqual(contents.scripts, [timerSource]);

  loaded.windows[0].loadedURL = "https://accounts.google.com/";
  contents.handlers.get("dom-ready")();
  assert.equal(contents.scripts.length, 1);
  fs.rmSync(loaded.directory, { recursive: true, force: true });
});

test("the microphone is one prompt, and camera, notifications, and geolocation are denied", async () => {
  const loaded = loadMain();
  loaded.ready();
  const contents = loaded.windows[0].webContents;
  const check = loaded.sessionState.permissionHandlers.check;
  const request = loaded.sessionState.permissionHandlers.request;
  const audio = {
    requestingUrl: "https://learn.lingvist.com/#guess",
    securityOrigin: "https://learn.lingvist.com",
    isMainFrame: true,
    mediaTypes: ["audio"],
  };

  assert.equal(check(contents, "media", "https://learn.lingvist.com", {
    ...audio,
    mediaTypes: undefined,
    mediaType: "audio",
  }), false);

  const decisions = [];
  await new Promise((resolve) => {
    let remaining = 2;
    const finish = (granted) => {
      decisions.push(granted);
      remaining -= 1;
      if (remaining === 0) {
        resolve();
      }
    };
    request(contents, "media", finish, audio);
    request(contents, "media", finish, audio);
  });

  assert.deepEqual(decisions, [true, true]);
  assert.equal(loaded.prompts.length, 1);
  assert.equal(check(contents, "media", "https://learn.lingvist.com", {
    ...audio,
    mediaTypes: undefined,
    mediaType: "audio",
  }), true);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(loaded.directory, "microphone.json"), "utf8")).allow,
    true,
  );

  for (const permission of ["fullscreen", "clipboard-sanitized-write", "persistent-storage"]) {
    let granted = "unset";
    request(contents, permission, (value) => {
      granted = value;
    }, {});
    assert.equal(granted, true, permission);
    assert.equal(check(contents, permission, "https://learn.lingvist.com", {}), true, permission);
  }

  for (const [permission, details] of [
    ["notifications", {}],
    ["geolocation", {}],
    ["display-capture", {}],
    ["usb", {}],
    ["media", { ...audio, mediaTypes: ["video"] }],
    ["media", { ...audio, mediaTypes: ["audio", "video"] }],
    ["media", { ...audio, isMainFrame: false }],
  ]) {
    let granted = "unset";
    request(contents, permission, (value) => {
      granted = value;
    }, details);
    assert.equal(granted, false, permission);
  }
  assert.equal(loaded.prompts.length, 1);
  fs.rmSync(loaded.directory, { recursive: true, force: true });
});

test("a microphone denial is asked again, and a stored allow is not", async () => {
  fs.mkdirSync(scratchRoot, { recursive: true });
  const directory = fs.mkdtempSync(path.join(scratchRoot, "user-"));
  const first = loadMain({ permissionResponse: 1, userData: directory });
  first.ready();
  const audio = {
    requestingUrl: "https://learn.lingvist.com/",
    securityOrigin: "https://learn.lingvist.com",
    isMainFrame: true,
    mediaTypes: ["audio"],
  };

  let firstGrant = "unset";
  await new Promise((resolve) => {
    first.sessionState.permissionHandlers.request(first.windows[0].webContents, "media", (value) => {
      firstGrant = value;
      resolve();
    }, audio);
  });
  assert.equal(firstGrant, false);
  assert.equal(first.prompts.length, 1);
  assert.equal(fs.existsSync(path.join(directory, "microphone.json")), false);

  const second = loadMain({ permissionResponse: 0, userData: directory });
  second.ready();
  let secondGrant = "unset";
  await new Promise((resolve) => {
    second.sessionState.permissionHandlers.request(second.windows[0].webContents, "media", (value) => {
      secondGrant = value;
      resolve();
    }, audio);
  });
  assert.equal(secondGrant, true);
  assert.equal(second.prompts.length, 1);

  const third = loadMain({ permissionResponse: 1, userData: directory });
  third.ready();
  let thirdGrant = "unset";
  await new Promise((resolve) => {
    third.sessionState.permissionHandlers.request(third.windows[0].webContents, "media", (value) => {
      thirdGrant = value;
      resolve();
    }, audio);
  });
  assert.equal(thirdGrant, true);
  assert.equal(third.prompts.length, 0);
  assert.equal(third.sessionState.permissionHandlers.check(
    third.windows[0].webContents,
    "media",
    "https://learn.lingvist.com",
    { ...audio, mediaTypes: undefined, mediaType: "audio" },
  ), true);
  fs.rmSync(directory, { recursive: true, force: true });
});
