# Roadmap

Status: scope and Electron 45 are decided
([D-0003](decisions.md#d-0003), [D-0004](decisions.md#d-0004),
[D-0011](decisions.md#d-0011)).

## Current status

Phase: specified, not built. The doc suite describes the desk client
on Electron 45. No application code exists. The Nix devshell is the
only environment.

## Next

1. Add the Electron 45 toolchain to the devshell, and ignore its
   build outputs in the same change.
2. Implement the shell in [architecture](architecture.md) and
   [requirements](requirements.md).
3. On that build, confirm email login, one wrong card, and one
   correct card.

Dates are not set.
