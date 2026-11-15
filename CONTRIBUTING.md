# Contributing

lv-desktop is a desktop window for the Lingvist study site.
Contributions stay under the GNU General Public License version 3
only ([D-0015](docs/decisions.md#d-0015)).

## Setup

Install Nix. From the repository root:

```sh
nix develop
npm test
npm start
```

`npm test` checks the shell and does not open a window. `npm start`
opens the study site. The environment is described in
[Operations](docs/operations.md).

## Changes

`README.md` and `docs/` stay English
([D-0002](docs/decisions.md#d-0002)). Branch names and commit
messages follow [Operations](docs/operations.md#git).

Bug reports and feature requests use the GitHub issue templates.
Open an issue before a large change.
