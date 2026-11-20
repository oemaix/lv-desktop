# Pitfalls

Status: binding. The next id is P-0026. Do not reuse or renumber an id.

## Index

| Id | Depends on | Summary |
| --- | --- | --- |
| [P-0001](#p-0001) | [D-0001](decisions.md#d-0001) | Nix ignores untracked flake files |
| [P-0002](#p-0002) | [D-0003](decisions.md#d-0003) | `tmp/` is not a requirement |
| [P-0003](#p-0003) | [D-0004](decisions.md#d-0004) | Resolved: the stack is Electron |
| [P-0004](#p-0004) | [D-0001](decisions.md#d-0001) | Unborn `HEAD` breaks `rev-parse` |
| [P-0005](#p-0005) | [D-0006](decisions.md#d-0006) | Impure devshell keeps the host `PATH` |
| [P-0006](#p-0006) | [D-0011](decisions.md#d-0011) | Stay on Electron 45 |
| [P-0007](#p-0007) | [D-0012](decisions.md#d-0012) | A preload cannot patch `setTimeout` |
| [P-0008](#p-0008) | [D-0014](decisions.md#d-0014) | Do not filter page requests |
| [P-0009](#p-0009) | [D-0014](decisions.md#d-0014) | Do not take the page's keys |
| [P-0010](#p-0010) | [Operations](operations.md#devshell) | Rootless uid 0 hides the dev home |
| [P-0011](#p-0011) | [D-0006](decisions.md#d-0006) | Use the devshell Electron 45 binary |
| [P-0012](#p-0012) | [P-0010](#p-0010) | Electron 45 will not start as uid 0 |
| [P-0013](#p-0013) | [D-0014](decisions.md#d-0014) | Do not deny every other permission |
| [P-0014](#p-0014) | [D-0012](decisions.md#d-0012) | The study origin stays in one window |
| [P-0015](#p-0015) | [D-0016](decisions.md#d-0016) | Release packages are built on GitHub Actions |
| [P-0016](#p-0016) | [D-0016](decisions.md#d-0016) | Do not set `build.license` |
| [P-0017](#p-0017) | [D-0017](decisions.md#d-0017) | Derive night colors from the live page |
| [P-0018](#p-0018) | [D-0017](decisions.md#d-0017) | Follow style tags added after the first paint |
| [P-0019](#p-0019) | [D-0018](decisions.md#d-0018) | Press the consent button, leave reCAPTCHA |
| [P-0020](#p-0020) | [D-0019](decisions.md#d-0019) | Night colors follow the local clock |
| [P-0021](#p-0021) | [D-0019](decisions.md#d-0019) | The header mark's fill is an attribute |
| [P-0022](#p-0022) | [D-0019](decisions.md#d-0019) | The translation fold mark's fill is an attribute |
| [P-0023](#p-0023) | [D-0006](decisions.md#d-0006) | A variable in the terminal path hides the profile |
| [P-0024](#p-0024) | [D-0006](decisions.md#d-0006) | A missing zsh rc makes terminal exit return 1 |
| [P-0025](#p-0025) | [D-0003](decisions.md#d-0003) | A failed study load is discarded |

## P-0001

Do not run `nix flake lock` or `nix develop` while `flake.nix` is
untracked. Inside a Git repository, Nix copies only files in the index
and ignores untracked files.

Stage the flake files with `git add`. Do not create a commit only to
satisfy Nix.

Depends on [D-0001](decisions.md#d-0001).

## P-0002

Do not treat a file under `tmp/` as a requirement. Tracked documents
are the source. A file there can support a recommendation. It does
not close a decision, and it does not rewrite this suite.

Depends on [D-0003](decisions.md#d-0003).

## P-0003

Resolved. [D-0004](decisions.md#d-0004) chose Electron, and
[D-0011](decisions.md#d-0011) chose Electron 45. Do not add a second
shell beside Electron. Do not implement on another major
([P-0006](#p-0006)).

Depends on [D-0004](decisions.md#d-0004).

## P-0004

Do not use `git rev-parse --abbrev-ref HEAD` as proof of the branch
before the first commit. On Git 2.54 that command exits 128 while
`HEAD` still points at an unborn branch, including just after
`git init -b main`. `git symbolic-ref --short HEAD` prints `main`.

Do not create a commit only to make `rev-parse` succeed.

Depends on [D-0001](decisions.md#d-0001).

## P-0005

Do not treat a binary found inside `nix develop` as a package from
`flake.nix` unless it lives under `/nix/store`. Impure `nix develop`
keeps the caller's `PATH`. A host tool can resolve even when the
devshell does not list it.

Depends on [D-0006](decisions.md#d-0006).

## P-0006

Do not implement the shell on a major other than Electron 45.
[D-0011](decisions.md#d-0011) closed on that line. On 2026-11-15 the
stable release was 45.3.3. Email login and the flashcards passed
on that build. Do not treat an Electron 42 session as this port.

Depends on [D-0011](decisions.md#d-0011).

## P-0007

Do not install the timer wrapper from a preload. Context isolation is
on, so a preload cannot patch the page's `setTimeout`. Call
`webContents.executeJavaScript` on `dom-ready`. The page calls the
global `setTimeout` when the reader answers, so a wrapper installed
after the bundle loads still runs.

Depends on [D-0012](decisions.md#d-0012).

## P-0008

Do not filter the page's requests. Card JSON, progress sync, and
audio are ordinary loads. A blocklist breaks the cards and adds
nothing the study loop needs. Host limits apply to navigation and
`window.open`, not to those loads.

Depends on [D-0014](decisions.md#d-0014).

## P-0009

Do not bind arrows, space, or enter in the shell, and do not add
global hotkeys. The page already owns those keys. An empty menu is
what keeps them on the page.

Depends on [D-0014](decisions.md#d-0014).

## P-0010

On rootless Docker the bind-mounted workspace is uid 0 inside the
container. `realize.sh` then runs `usermod -o` so the account `dev`
shares uid 0 with `root`. `getpwuid(0)` returns the first
`/etc/passwd` line. While that line is `root`, Docker sets
`HOME=/root`. The gitconfig and the mounted `gh` directory under
`/home/dev` are not read.

After that uid rewrite, put the `dev` line ahead of `root`. Leave the
name `root` at uid 0 so `sudo` can still find it.

Depends on the Dev Container in [Operations](operations.md#devshell).

## P-0011

Do not run Electron from the binary the npm `electron` package
downloads, and do not use `electron_44` from this nixpkgs pin. The
download is built for a normal Linux linker and does not start under
Nix. nixos-26.05 has no `electron_45` attribute. The shell stays on
Electron 45 ([P-0006](#p-0006)).

The devshell builds 45.3.3 with that pin's electron binary builder
and puts `electron` on `PATH`. `ELECTRON_OVERRIDE_DIST_PATH` points
at its dist directory. `ELECTRON_SKIP_BINARY_DOWNLOAD=1` stops npm
from fetching the other binary.

Depends on [D-0006](decisions.md#d-0006) and
[D-0011](decisions.md#d-0011).

## P-0012

Do not expect Electron 45 to start as uid 0 while Chromium's process
sandbox is required. The process exits before the window exists.
This Dev Container is uid 0 ([P-0010](#p-0010)).

That check runs in C++ before the main script, so
`app.commandLine.appendSwitch` is too late. `npm start` runs
`scripts/start.js`, which puts `--no-sandbox` on the command line
only when `getuid()` is 0. That switch turns the OS sandbox off.
`webPreferences.sandbox` does not turn it back on. Context isolation
and `nodeIntegration: false` still apply. A normal account does not
pass that switch, so the process sandbox stays on there.

Depends on [P-0010](#p-0010) and [D-0012](decisions.md#d-0012).

## P-0013

Do not answer every permission check with a denial except the
microphone. The session handler replaces Chromium's own decision.
Camera, notifications, and geolocation are the denials. Fullscreen,
clipboard write, and persistent storage stay available. Other device
permissions, such as USB and screen capture, stay denied.

Depends on [D-0014](decisions.md#d-0014).

## P-0014

Do not open a second window for the study origin. `window.open` of
`learn.lingvist.com` loads in the existing window. `about:blank` and
the OAuth hosts that post to `window.opener` stay child windows.

Depends on [D-0012](decisions.md#d-0012).

## P-0015

Do not build the release packages inside the Nix devshell. The
packager downloads the official Electron zip, and that binary does
not start under Nix ([P-0011](#p-0011)). DMG is built on macOS. MSI
is built on Windows. AppImage, deb, and rpm are built on Linux.
The packages are unsigned. The arm64 MSI from electron-builder
26.18.0 is an x64 WiX package that installs the arm64 app.

Depends on [D-0016](decisions.md#d-0016).

## P-0016

Do not put `license` in the electron-builder `build` object.
electron-builder 26 rejects that key and stops before it writes a
package. The SPDX identifier stays in `package.json`. The
`LICENSE` file is packed through `files` and `extraResources`.

Depends on [D-0016](decisions.md#d-0016).

## P-0017

Do not store Lingvist's current hex colors for the night treatment.
Read the live stylesheet and keep each color's hue. Do not add a
second palette. Skip the treatment when the page background is
already dark, or when the page CSS uses `prefers-color-scheme`.
Delete `src/night-theme.js` when the official page has night colors.

Depends on [D-0017](decisions.md#d-0017).

## P-0018

Do not treat the one linked stylesheet as the whole page. On
2026-11-16 a logged-in session had one same-origin CSS file and 193
style tags in `head`. Those tags held more color declarations than
the file, and 64 of them were Vue scoped rules. The file name is
hashed and will change. There was no `prefers-color-scheme` rule.
`color-scheme` was `normal`. The page background was
`rgb(238, 240, 244)`, card text was `rgb(44, 49, 67)`, and the
prompt words were `rgb(3, 120, 137)`.

Copy style tags that appear after the first pass, and keep the
night sheet last. A dark background caused by that sheet is not
the official night mode.

Depends on [D-0017](decisions.md#d-0017).

## P-0019

Hide `div.survey` only. Do not hide `div.grecaptcha-badge`, the
reCAPTCHA iframe, or the reCAPTCHA token field. Press the
"OK, got it" button inside `section.app-cookie-consent`, and only
while that notice is shown. Do not press "Find out more". That
link opens the terms of service. The button stores the consent
cookie. Do not filter the page's requests
([P-0008](#p-0008)).

Depends on [D-0018](decisions.md#d-0018).

## P-0020

Use the computer's local clock. Night colors are on from 20:00 to
06:00 and off from 06:00 to 20:00, including while the page stays
open. Do not leave the night sheet up during the day. Keep a white
card lighter than the pale page. Keep a pale tint lighter than that
card, including a correct-answer wash. Cap the saturation of dark
colored text and of pale tinted surfaces, so a teal prompt does not
turn bright cyan and a pale selected control does not turn neon.
Lift mid-tone colored text so it stays readable on the night card.

Depends on [D-0019](decisions.md#d-0019).

## P-0021

The mark in `.navigation-header` is an inline SVG. On 2026-11-16 its
two paths set `fill="#2C3143"` as an attribute, so the stylesheet
rewrite leaves the mark dark on the night rail. Paint those paths
with the night ink in the night sheet. Do not restyle the other rail
icons. The orange marks keep their own fills. The rule leaves with
the night sheet.

Depends on [D-0019](decisions.md#d-0019).

## P-0022

The control that folds the sentence translation is
`.card-context-translations > .toggle-icon`. On 2026-11-16 its arrow
path set `fill="#2C3143"` as an attribute, so the night sheet left it
dark on the night card. `.collapsible-box > .toggle-icon` is the same
control. Paint those paths with the night ink. Leave the grammar
arrow and the rail icons alone. The rule leaves with the night sheet.

Depends on [D-0019](decisions.md#d-0019).

## P-0023

Do not set `terminal.integrated.profiles.linux` or
`terminal.integrated.profiles.osx` `path` to
`${workspaceFolder}/.vscode/nix-develop-terminal.sh`. The editor
checks that this path exists before it expands the variable, then
drops the profile. "Nix Develop" is then missing from the terminal
list, and a new terminal falls back to the container shell. Set
`path` to `/bin/sh`, pass the script in `args`, and set
`overrideName` so the tab title is "Nix Develop".

Depends on [D-0006](decisions.md#d-0006).

## P-0024

Nix zsh runs `zsh-newuser-install` when the account has no `.zshenv`,
`.zprofile`, `.zshrc`, or `.zlogin`. That function returns 1 when it
does not open its wizard. A later plain `exit` keeps status 1, and
the editor reports that the terminal terminated with exit code 1.
When those files are absent, `.vscode/nix-develop-terminal.sh` sets
`ZDOTDIR` to `.vscode/zsh`, whose `.zshrc` succeeds. Leave an
account's own zsh startup files in place.

Depends on [D-0006](decisions.md#d-0006).

## P-0025

Do not treat the empty `loadURL` catch as recovery. A slow network
can fail the main-frame load of `https://learn.lingvist.com/` with
a timeout. `createMainWindow` and `openInMainWindow` ignore that
rejection. The window keeps the title `lv-desktop`. Do not reload
from that catch until [D-0020](decisions.md#d-0020) chooses the
schedule and the pattern. An immediate second `loadURL` can be
settled by the failed load's `did-finish-load`. `ERR_ABORTED` (-3)
is not a timeout.

Depends on [D-0003](decisions.md#d-0003).
