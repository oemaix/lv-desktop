# Decisions

Status: scope, engine, release, license, and packages are decided
([D-0003](#d-0003), [D-0004](#d-0004), [D-0011](#d-0011),
[D-0015](#d-0015), [D-0016](#d-0016)).

Ids stay `D-xxxx`. The next id is one greater than the highest id in
this file. Never reuse or renumber an id. Closing a decision moves
that entry from Undecided to Decided and does not change its id.

## Decided

| Id | Summary |
| --- | --- |
| [D-0001](#d-0001) | New Git repository, branch `main` |
| [D-0002](#d-0002) | Docs are English |
| [D-0003](#d-0003) | Single-window Lingvist desk client |
| [D-0004](#d-0004) | The shell is Electron |
| [D-0005](#d-0005) | nixpkgs pin `nixos-26.05` |
| [D-0006](#d-0006) | Devshell packages |
| [D-0007](#d-0007) | Editor extensions |
| [D-0008](#d-0008) | Product docs are in the suite |
| [D-0009](#d-0009) | `docs/operations.md` is in the suite |
| [D-0010](#d-0010) | Root `.editorconfig` |
| [D-0011](#d-0011) | Electron 45 |
| [D-0012](#d-0012) | One window, isolated page, one script |
| [D-0013](#d-0013) | Correct-answer hold becomes 100ms |
| [D-0014](#d-0014) | Session, permissions, and link policy |
| [D-0015](#d-0015) | GNU GPL version 3 only |
| [D-0016](#d-0016) | Unsigned packages for both arches |
| [D-0017](#d-0017) | One night color treatment, derived from the page |
| [D-0018](#d-0018) | Hide send feedback and press the consent button |
| [D-0019](#d-0019) | Night colors from 20:00 to 06:00 |

### D-0001

Status: Decided

Choice: This directory is a Git repository. The branch is `main`.
History was empty at bootstrap, so `git init -b main` created it.

Source: Bootstrap procedure.

Consequence: Nix reads the flake from the Git index
([P-0001](pitfalls.md#p-0001)). `.gitignore` ignores `tmp/`,
`.cursor/`, `.env`, `.env.*` (not `.env.example`), `result`,
`result-*`, `.direnv/`, `node_modules/`, `dist/`, `out/`, and
`release/`. `.vscode/` and `.cursorignore` stay tracked.

### D-0002

Status: Decided

Choice: The doc suite is English.

Source: Bootstrap completion. The request did not name a language,
and the suite was written in English.

Consequence: `README.md` and `docs/` are English.

### D-0003

Status: Decided

Choice: `lv-desktop` is a single-window desktop client for Lingvist.
It is for someone sitting at a desk, with a keyboard and a large
display. That is the better place to drill vocabulary. A phone or a
tablet is the worse place, and this client does not try to feel like
them.

Lingvist stays the teacher. The window opens
`https://learn.lingvist.com/`. The card loop, the hints, the audio,
and the scheduling stay on that site. The shell keeps the session,
stays out of the keyboard, and shortens one fixed pause after a
correct answer.

Subscription and payment are out of scope. Checkout, plan changes,
and receipts stay in a normal browser or the mobile app. A payment
window from the site goes to the system browser.

Also outside the shell: a second scheduler, a theme, global hotkeys,
an offline cache, a tracker blocklist, and a speech engine of our own.

Source: User request on 2026-11-15.

Consequence: Vision, use cases, requirements, architecture, and UI
design describe this client. The program is `src/`.

### D-0004

Status: Decided

Choice: The shell is Electron. One main process.

Linux Tauri uses WebKitGTK. That is a different engine from the
Chromium the cards were tested in. WebKit often has no Web Speech
API. Wails and pywebview land on that same kind of system webview.
The gain would be a smaller binary and a second browser to debug
when the site moves. A Chrome or Chromium `--app` window is
Chromium, so the page features are there, but the timer patch needs
an extension, and there is no separate session unless a dedicated
profile is managed by hand.

Revisit WebKit only after email login, one wrong card, and one
correct card succeed there. Until then the project has one shell.
The binary size is not the product. The card loop is.

The release is Electron 45 ([D-0011](#d-0011)). A logged-in session
already ran on Electron 42: email login, the hub, a wrong card, and
a correct card. That window had reCAPTCHA, the old Google `gapi`
login, Howler, and a `SpeechRecognition` constructor.

Source: User request on 2026-11-15.

Consequence: Implementation uses Electron 45. Node.js 24 and
Electron 45.3.3 are in the devshell
([D-0006](#d-0006), [D-0011](#d-0011)).

### D-0005

Status: Decided

Choice: `inputs.nixpkgs.url` is `github:NixOS/nixpkgs/nixos-26.05`.

Source: The NixOS stable manual lists 26.05 ("Yarara", 2026-05-30) as
the current stable release:
<https://nixos.org/manual/nixos/stable/release-notes>.
NixOS 26.11 was still before branch-off on 2026-11-15:
<https://github.com/NixOS/nixpkgs/issues/567567>.

Consequence: The devshell tracks the stable channel, not
`nixpkgs-unstable`.

### D-0006

Status: Decided

Choice: `devShells.default` exists for `x86_64-linux` and
`aarch64-linux`. Packages: `bashInteractive`, `zsh`, `git`, `curl`,
`cacert`, `coreutils`, `python3`, `nodejs_24`, and Electron 45.3.3.
No `shellHook`. The shell sets `ELECTRON_OVERRIDE_DIST_PATH` to that
Electron dist directory and `ELECTRON_SKIP_BINARY_DOWNLOAD=1`.

nixos-26.05 has no `electron_45` attribute. The devshell builds
45.3.3 with the channel's electron binary builder
([P-0011](pitfalls.md#p-0011)).

Source: Bootstrap procedure, then the implementation on 2026-11-15
([D-0011](#d-0011)).

Consequence: The Cursor shell hook and the editor terminal both enter
this shell. It is impure ([P-0005](pitfalls.md#p-0005)). `npm start`
and `npm test` run here. The npm `electron` package must not
download its own binary ([P-0011](pitfalls.md#p-0011)).

### D-0007

Status: Decided

Choice: Recommended extensions are `jnoortheen.nix-ide`,
`editorconfig.editorconfig`, and `DavidAnson.vscode-markdownlint`.
The editor's built-in JavaScript support covers `src/` and `test/`.

Source: Bootstrap procedure. Those three match `flake.nix`,
`.editorconfig`, and the doc suite.

Consequence: The reasons are in [operations](operations.md).
`.vscode/extensions.json` is the list. No extra JavaScript
extension is recommended.

### D-0008

Status: Decided

Choice: The product docs are part of the suite:
`docs/vision-and-scope.md`, `docs/glossary.md`,
`docs/use-cases.md`, `docs/requirements.md`, and
`docs/ui-design.md`. Bootstrap left them out. They were written when
[D-0003](#d-0003) and [D-0004](#d-0004) closed.

Source: Bootstrap rule, then the user request on 2026-11-15. The id
did not change.

Consequence: `README.md` links them. Together with overview,
architecture, roadmap, this file, pitfalls, and operations, they are
the suite.

### D-0009

Status: Decided

Choice: `docs/operations.md` is part of the suite.

Source: Bootstrap completion. The devshell, the editor terminal, the
extension list, and the local Cursor hook are operations of this
repository.

Consequence: Extension reasons live there, not only in `README.md`.

### D-0010

Status: Decided

Choice: A root `.editorconfig` sets UTF-8, LF, a final newline,
trailing-whitespace trim (off for Markdown), space indent, and indent
size 2.

Source: Bootstrap completion. [D-0007](#d-0007) includes the
EditorConfig extension so shared defaults exist.

Consequence: Editors that honor EditorConfig share those defaults.
JavaScript uses the root section.

### D-0011

Status: Decided

Choice: The shell uses Electron 45, the stable line `45-x-y`. On
2026-11-15 that line's stable release is 45.3.3 (Chromium
156.0.8078.100, Node.js 24.22.3).

Source: User request on 2026-11-15.
<https://releases.electronjs.org/?channel=stable> listed 45.3.3 as
the stable release that day.

Consequence: The shell targets Electron 45.3.3. Node.js 24 and that
Electron are in the devshell ([D-0006](#d-0006),
[P-0011](pitfalls.md#p-0011)). Email login and the flashcards passed
on this build ([P-0006](pitfalls.md#p-0006)).

### D-0012

Status: Decided

Choice: One Electron main process and one window. No packaged UI.
`contextIsolation` is on, `nodeIntegration` is off, and `sandbox` is
on. There is no preload API. The only script the shell puts in the
page is the timer wrapper from [D-0013](#d-0013), installed with
`webContents.executeJavaScript` on `dom-ready`.

Source: User request on 2026-11-15. A preload cannot patch the
page's `setTimeout` while context isolation is on
([P-0007](pitfalls.md#p-0007)).

Consequence: Architecture and requirements describe that process.
The page's own bundle keeps the card loop. [D-0017](#d-0017)
adds the night colors, until the study page has night colors of
its own. [D-0018](#d-0018) adds the notice script.

### D-0013

Status: Decided

Choice: Shorten the correct-answer hold to 100ms. Wrap the page's
`setTimeout`. When the delay is 500 or 250, the callback is a
function, and its source contains `final-answer-submit`, call the
original timer with 100ms. Leave sentence playback, its 6s cap, and
wrong answers alone. If that marker string is gone, leave the delay
alone. The cards then keep the site's original hold.

Source: User request on 2026-11-15. With sentence audio off, three
correct submits used a 500ms timer. With sentence audio on, the same
path waits for Howler `end` (6s cap) and then 250ms. The account
studied that day had sentence audio off.

Consequence: Requirements specify the wrapper. 100ms keeps one beat
of the correct state. The save still runs.

### D-0014

Status: Decided

Choice: Persist `userData` so login survives a restart. A second
launch focuses the existing window. Strip the `Electron/` token from
the default Chrome user agent and keep that Chrome version.
`gapi.auth2` rejects an Electron token. Turn the session spellchecker
off. Use an empty menu, so the page's keys stay the keys.

Allow the microphone once: audio only, main frame, origin
`https://learn.lingvist.com`. Deny camera, notifications, and
geolocation.

In-app navigation stays on the study origin and the login hosts that
can return a session there. `about:blank` is allowed only as a popup.
Any other `https` URL opened by the page goes to the system browser.
Drop `http:`, `file:`, `javascript:`, and `data:` from the page. Do
not filter the page's own request loads.

Source: User request on 2026-11-15. The host list, the OAuth cases,
and the reason request filtering is rejected are in
[requirements](requirements.md).

Consequence: Payment and help leave the app, because their hosts are
not in-app hosts. Card JSON, progress sync, and audio stay ordinary
page loads ([P-0008](pitfalls.md#p-0008)).

### D-0015

Status: Decided

Choice: The project is licensed under the GNU General Public License
version 3 only. The license text is `LICENSE`. The SPDX identifier
is `GPL-3.0-only`.

Source: User request on 2026-11-15.

Consequence: `package.json` names that identifier. The README states
it. Contributions stay under the same license.

### D-0016

Status: Decided

Choice: Publish AppImage, deb, and rpm for Linux, DMG for macOS, and
MSI for Windows. Each format is built for amd64 (`x64`) and aarch64
(`arm64`). macOS is not signed and is not notarized. Windows is not
Authenticode-signed. electron-builder 26.18.0 packs Electron 45.3.3.
A version tag `vX.Y.Z` on GitHub Actions builds the packages and
publishes the GitHub release. The tag matches `package.json`.

Source: User request on 2026-11-15.

Consequence: The workflow is `.github/workflows/release.yml`. The
Nix devshell does not build these packages
([P-0015](pitfalls.md#p-0015)). The arm64 MSI is produced by the
x64 WiX toolset in this electron-builder release and installs the
arm64 app.

### D-0017

Status: Decided

Choice: The study page has no night colors, and learners need them
at night. This is one study function, not a set of themes. There is
no other color theme.

Derive each night color from the color in the live page stylesheet.
Keep that color's hue. Light surfaces become dark. Dark text becomes
light. A later change to the official palette changes the night
colors with it. Do not copy today's hex values into the shell.

Install the treatment from `src/night-theme.js` on the study origin,
the same way as the timer wrapper. Skip it when the page background
is already dark, or when the page CSS uses `prefers-color-scheme`.
Delete the script when the official page has night colors.

Source: User request on 2026-11-16. The study page had no night
colors and no `prefers-color-scheme` rule.

Consequence: Requirements, architecture, and UI design describe this
one treatment ([P-0017](pitfalls.md#p-0017)). [D-0003](#d-0003) still
excludes every other theme.

### D-0018

Status: Decided

Choice: Hide Lingvist's send-feedback control, `div.survey`. Leave
the reCAPTCHA badge, its iframe, and its token field in place.

Press the "OK, got it" button in `section.app-cookie-consent`. On
the live page that button stores Lingvist's consent cookie for one
year and hides the notice. Do not press "Find out more". That link
opens Lingvist's terms of service. Do not filter the page's
requests ([P-0008](pitfalls.md#p-0008),
[P-0019](pitfalls.md#p-0019)).

The study site remains Lingvist's. Lingvist's terms and privacy
notice apply to the account. The README says that this program
presses "OK, got it".

Source: User request on 2026-11-16. A logged-in session showed the
notice, the feedback control, and the reCAPTCHA badge. The button's
action sets the consent cookie and hides the notice.

Consequence: `src/study-notices.js` runs on the study origin with
the other page scripts. Requirements, architecture, UI design, and
the README describe it.

### D-0019

Status: Decided

Choice: Night colors are on from 20:00 to 06:00 in the computer's
local time. From 06:00 to 20:00 the study page keeps its own colors.
The shell switches at those hours while the page stays open. There
is no other schedule and no manual switch.

A white card stays lighter than the pale page behind it. A pale
tinted surface stays lighter than that card, so a selected control
and a correct-answer wash remain visible. Dark colored text is
lifted into a readable band and its saturation is capped, so a teal
word does not become a bright cyan. Mid-tone colored text is lifted
as well, so it stays readable on the night card. The mark in
`.navigation-header` is painted with that same night ink, because
its fill is an SVG attribute outside the stylesheets. The
control that folds the sentence translation is painted the same
way.

Source: User request on 2026-11-16. A logged-in comparison showed
white cards and the pale page collapsing together, the selected
navigation control turning a bright purple, and the card prompt
turning `rgb(125, 236, 252)` from `rgb(3, 120, 137)`. A later pass
showed the selected control darker than the rail, the correct-answer
wash `rgb(224, 235, 239)` collapsing into the page, and purple text
`rgb(172, 110, 209)` left too close to its day color.

Consequence: `src/night-theme.js` owns the clock and the conversion
([P-0020](pitfalls.md#p-0020)). Requirements and the README name
the hours.

## Undecided

| Id | Summary |
| --- | --- |
| [D-0020](#d-0020) | A timed-out study load is not retried |

### D-0020

Status: Undecided

The shell loads `https://learn.lingvist.com/` once.
`BrowserWindow.loadURL` rejects when the main frame fails, from
`did-fail-load`. `ERR_TIMED_OUT` (-7) means an operation timed out.
`createMainWindow` and `openInMainWindow` discard that rejection.
Electron already attaches an empty rejection handler, so the failure
is not an unhandled rejection and does not open a dialog. The window
keeps the product title `lv-desktop`, because the study document
never arrives to set a title. The page scripts do not run. They wait
for `dom-ready`.

On 2026-11-21 a slow network still loaded the study site in a normal
browser. The client console reported a timeout loading
`learn.lingvist.com`, and the title stayed `lv-desktop`. A later
attempt can succeed after that timeout. This client does not start
one.

Reloading is not chosen. The schedule and the pattern stay open:

- Which failures count. `ERR_ABORTED` (-3) also rejects `loadURL`,
  including when a newer navigation replaces the current one.
- Main frame only. `did-fail-load` also fires for a subframe.
- How long to wait, and how many times. An immediate second
  `loadURL` is the wrong shape. A failed load can still emit
  `did-finish-load`, and that event can settle the next `loadURL`
  promise.
- A retry must not replace a login page the reader is already on.
  `openInMainWindow` loads the URL it was given, which is not always
  the study URL.

Source: User report on 2026-11-21.

Consequence: No recovery is implemented.
[P-0025](pitfalls.md#p-0025) records the trap.
