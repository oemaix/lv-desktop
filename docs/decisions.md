# Decisions

Status: scope, engine, and release are decided ([D-0003](#d-0003),
[D-0004](#d-0004), [D-0011](#d-0011)).

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

### D-0001

Status: Decided

Choice: This directory is a Git repository. The branch is `main`.
History was empty at bootstrap, so `git init -b main` created it.

Source: Bootstrap procedure.

Consequence: Nix reads the flake from the Git index
([P-0001](pitfalls.md#p-0001)). `.gitignore` ignores `tmp/`,
`.cursor/`, `.env`, `.env.*` (not `.env.example`), `result`,
`result-*`, and `.direnv/`. `.vscode/` and `.cursorignore` stay
tracked. Electron 45 build outputs are ignored when that toolchain
is added ([D-0011](#d-0011)).

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
design describe this client. There is still no application code.

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

Consequence: Implementation uses Electron 45. Node.js and Electron
join the devshell in that implementation change
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
`cacert`, `coreutils`, `python3`. No `shellHook`.

Source: Bootstrap procedure. Node.js and Electron 45 are added with
the implementation ([D-0011](#d-0011)).

Consequence: The Cursor shell hook and the editor terminal both enter
this shell. It is impure ([P-0005](pitfalls.md#p-0005)).

### D-0007

Status: Decided

Choice: Recommended extensions are `jnoortheen.nix-ide`,
`editorconfig.editorconfig`, and `DavidAnson.vscode-markdownlint`.

Source: Bootstrap procedure. Those three match `flake.nix`,
`.editorconfig`, and the doc suite. No JavaScript extension until
the tree has JavaScript to edit.

Consequence: The reasons are in [operations](operations.md).
`.vscode/extensions.json` is the list.

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
No language-specific section until source files exist.

### D-0011

Status: Decided

Choice: The shell uses Electron 45, the stable line `45-x-y`. On
2026-11-15 that line's stable release is 45.3.3 (Chromium
156.0.8078.100, Node.js 24.22.3).

Source: User request on 2026-11-15.
<https://releases.electronjs.org/?channel=stable> listed 45.3.3 as
the stable release that day.

Consequence: Implementation targets Electron 45. Email login, one
wrong card, and one correct card are confirmed on that major before
the port is treated as done ([P-0006](pitfalls.md#p-0006)). Node.js
and the `electron` package join the devshell in the implementation
change ([D-0006](#d-0006)).

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
The page's own bundle keeps the card loop.

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

## Undecided

No open decisions.
