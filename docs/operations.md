# Operations

Status: the devshell builds and runs the shell. No deploy.
The nixpkgs pin is [D-0005](decisions.md#d-0005). Packages are
[D-0006](decisions.md#d-0006). Extensions are
[D-0007](decisions.md#d-0007).

## Devshell

Requires Nix. From the repository root:

```sh
nix develop
```

The shell provides bash, zsh, git, curl, CA certificates, coreutils,
Python 3, Node.js 24, and Electron 45.3.3. Electron is built with
the pinned nixpkgs binary builder because that channel has no
`electron_45` attribute ([P-0011](pitfalls.md#p-0011)).

`ELECTRON_OVERRIDE_DIST_PATH` points at that Electron dist directory.
`ELECTRON_SKIP_BINARY_DOWNLOAD=1` keeps npm from fetching a second
binary. There is no `shellHook`. Agent commands enter this shell on
every invocation, so a banner would repeat.

The default `nix develop` is impure: the caller's `PATH` is still
searched, so a host binary is not a devshell package
([P-0005](pitfalls.md#p-0005)).

If `flake.nix` is not in the Git index yet, stage `flake.nix` and
`flake.lock` before the command above
([P-0001](pitfalls.md#p-0001)). A clone that already contains those
files does not need that step.

The default terminal profile on Linux and macOS is "Nix Develop".
Its `path` is `/bin/sh`, and its arguments are
`.vscode/nix-develop-terminal.sh`. The script moves to the repository
root and executes `nix develop -c zsh`, or bash when the host has no
zsh. When that account has no zsh startup file, the script sets
`ZDOTDIR` to `.vscode/zsh` so closing the terminal is a zero exit
([P-0024](pitfalls.md#p-0024)). The tab title is "Nix Develop". Task automation is not pointed
at that script. A profile path that still contains
`${workspaceFolder}` is dropped from the terminal list
([P-0023](pitfalls.md#p-0023)).

A Dev Container is optional. The flake is still the environment.
Opening the folder on the host without Docker leaves this shell and
the terminal profile unchanged.

## Run

From the repository root, inside the devshell:

```sh
npm test
npm start
```

`npm test` checks the shell without opening a window. `npm start`
opens `https://learn.lingvist.com/`. `electron` on `PATH` is the
devshell's Electron 45.3.3. This Dev Container is uid 0, so
`npm start` adds `--no-sandbox` before Electron's startup check
([P-0012](pitfalls.md#p-0012)). `electron .` alone exits here.

## CI

GitHub Actions runs `npm test` on Ubuntu with Node.js 24 for every
push and pull request. The workflow is
`.github/workflows/test.yml`. It checks the shell. It does not
launch Electron.

## Packages

AppImage, deb, rpm, DMG, and MSI are built for amd64 and aarch64
([D-0016](decisions.md#d-0016)). electron-builder calls those arches
`x64` and `arm64`. macOS is not signed and is not notarized. Windows
is not Authenticode-signed.

The Nix devshell does not build them
([P-0015](pitfalls.md#p-0015)). GitHub Actions does, from
`.github/workflows/release.yml`, when a tag `vX.Y.Z` is pushed.
That tag matches the `version` in `package.json`. The same workflow
can be started by hand. A hand start uploads the artifacts and does
not publish a release.

The arm64 MSI is built by the x64 WiX toolset in electron-builder
26.18.0. It installs the arm64 app.

## Editor extensions

| Extension | Why it is required |
| --- | --- |
| `jnoortheen.nix-ide` | Edit `flake.nix` |
| `editorconfig.editorconfig` | Apply the root `.editorconfig` ([D-0010](decisions.md#d-0010)) |
| `DavidAnson.vscode-markdownlint` | Lint the doc suite |

Install them from `.vscode/extensions.json`. `src/` and `test/` are
JavaScript. The editor's built-in JavaScript support covers them, so
no extra extension is recommended
([D-0007](decisions.md#d-0007)).

## Cursor hook

`.cursor/` is gitignored ([D-0001](decisions.md#d-0001)). A fresh clone
does not contain the shell hook or the Cursor rules. Bootstrap installs:

- `.cursor/hooks.json` — `preToolUse` matcher `^Shell$`, command
  `.cursor/hooks/nix-develop.py`, timeout 10 seconds
- `.cursor/hooks/nix-develop.py` — wraps a command in
  `nix develop -c` unless `IN_NIX_SHELL` is already set or the command
  already uses `nix develop`
- `.cursor/rules/` — pointers at these docs

Re-run bootstrap to restore them.

## Git

The long-lived branch is `main`
([D-0001](decisions.md#d-0001)).

A topic branch is `category/short-topic`. After the slash, use
lowercase kebab-case, a few words, and one concern.

| Category | Use |
| --- | --- |
| shell | Window, session, page script, permissions |
| build | Flake, devshell, packages, Dev Container |
| docs | Doc suite and README |
| test | Checks for the shell |
| ci | Workflows |
| chore | Repo maintenance that fits no category above |

A commit subject is one line, `type: summary`. The summary is
imperative and specific, has no trailing period, and stays within
about 72 characters. Add a body only when the subject cannot say why.

| Type | Use |
| --- | --- |
| feat | New behavior |
| fix | A bugfix |
| docs | Documentation only |
| refactor | Restructure with the same behavior |
| perf | Speed or size, with the same behavior |
| test | Checks only |
| build | Flake, devshell, packages, or the Dev Container |
| ci | Workflows |
| chore | Repo maintenance that fits no type above |
| revert | Revert an earlier commit |

A breaking change uses `type!:` and names what breaks.

```text
feat: shorten the correct-answer hold to 100ms
docs: record the branch name shape
```

```text
docs/commit-message-shape
build/electron-45-devshell
```

## Secrets

Do not commit `.env`. `.gitignore` and `.cursorignore` list `.env` and
`.env.*`, and they keep `.env.example`.
