# lv-desktop

Status: shell implemented. Single-window Lingvist desk client
([D-0003](docs/decisions.md#d-0003)) on Electron 45
([D-0004](docs/decisions.md#d-0004), [D-0011](docs/decisions.md#d-0011)).

## Current status

The shell is `src/`. It runs in the Nix devshell on Electron 45.
Email login and the flashcards were confirmed on this build.

## Docs

- [Overview](docs/overview.md)
- [Vision and scope](docs/vision-and-scope.md)
- [Use cases](docs/use-cases.md)
- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [UI design](docs/ui-design.md)
- [Glossary](docs/glossary.md)
- [Roadmap](docs/roadmap.md)
- [Decisions](docs/decisions.md)
- [Pitfalls](docs/pitfalls.md)
- [Operations](docs/operations.md)

## Devshell

From the repository root, with the flake files in the Git index:

```sh
nix develop
```

The editor's default terminal runs `.vscode/nix-develop-terminal.sh`,
which opens the same shell. Nix ignores untracked files in a Git
repository ([P-0001](docs/pitfalls.md#p-0001)). Details are in
[Operations](docs/operations.md).

A Dev Container is optional. The flake is still the environment, and
the host shell is unchanged when Docker is not used.

## Run

Inside the devshell:

```sh
npm test
npm start
```

`npm start` opens the study site. Details are in
[Operations](docs/operations.md).
