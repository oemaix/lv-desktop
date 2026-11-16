#!/bin/sh
# Installed path: .vscode/nix-develop-terminal.sh
# Interactive terminal inside the flake devshell.
# Prefer zsh when the host has it; otherwise bash.
# Both shells are provided by the devshell, so `nix develop -c` can find them.
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
zhome=${ZDOTDIR:-$HOME}
if [ ! -f "$zhome/.zshenv" ] && [ ! -f "$zhome/.zprofile" ] && [ ! -f "$zhome/.zshrc" ] && [ ! -f "$zhome/.zlogin" ]; then
  # Nix zsh runs zsh-newuser-install when these files are absent.
  # That function returns 1, and a later plain exit keeps that status.
  ZDOTDIR=$root/.vscode/zsh
  export ZDOTDIR
fi
if command -v zsh >/dev/null 2>&1 || [ -x /usr/bin/zsh ] || [ -x /bin/zsh ]; then
  exec nix develop -c zsh
fi
exec nix develop -c bash
