# Architecture

Status: the shell in `src/` is this process. The shell is Electron 45
([D-0004](decisions.md#d-0004), [D-0011](decisions.md#d-0011),
[D-0012](decisions.md#d-0012)). The Nix devshell builds and runs it
([D-0005](decisions.md#d-0005), [D-0006](decisions.md#d-0006)).

## Process

One Electron 45 main process. One window. No packaged UI.
The window icon is `assets/icon.png`.
`src/main.js` is this process. `src/timer-wrapper.js` is the only
page script. `src/policy.js` decides hosts, schemes, permissions,
and which `window.open` stays a child window.

```text
BrowserWindow  https://learn.lingvist.com/
  page           the flashcards
  child window   only an OAuth popup that must talk to window.opener
  system browser every other https link, including help and payment
```

`contextIsolation` is on, `nodeIntegration` is off, and `sandbox` is
on. There is no preload API. On uid 0, Chromium exits before the
main script, so `npm start` passes `--no-sandbox` only in that case.
That switch turns the OS sandbox off. The preference does not turn
it back on ([P-0012](pitfalls.md#p-0012)). The timer wrapper is the only script the
shell puts in the page. It is installed with
`webContents.executeJavaScript` on `dom-ready`, in the page world
([D-0013](decisions.md#d-0013), [P-0007](pitfalls.md#p-0007)).

The page keeps the card loop, the hints, the audio, and the
scheduling. Card JSON, progress sync, and audio are ordinary loads.
The shell does not proxy them and does not block them
([P-0008](pitfalls.md#p-0008)).

## Session and keys

`userData` is persistent. The app is a single instance. The user
agent is the default Chrome user agent with the `Electron/` token
removed and the Chrome version kept. The spellchecker is off. The
menu is empty ([D-0014](decisions.md#d-0014)).

Permission checks allow one microphone prompt and deny camera,
notifications, and geolocation. An allow is stored in `userData`. A
deny is asked again. Fullscreen, clipboard write, and persistent
storage stay available ([P-0013](pitfalls.md#p-0013)). A
`window.open` of the study origin loads in this window
([P-0014](pitfalls.md#p-0014)). The host list and the scheme rules
are in [requirements](requirements.md#links).

## What is not in this process

No second scheduler, no offline store, no tracker filter, and no
speech engine. WebKit is not a second build. It is reconsidered only
after email login, one wrong card, and one correct card succeed there
([D-0004](decisions.md#d-0004)).
