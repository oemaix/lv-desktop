# UI design

Status: the page is the UI ([D-0003](decisions.md#d-0003),
[D-0012](decisions.md#d-0012)).

## No packaged UI

The shell ships no screens of its own. There is no theme and no
touch layout. The Lingvist page is the whole study surface, on a
large display, driven by a keyboard.

## The window

One window. Its icon is a cream card on a navy field
(`assets/icon.png`). The menu bar is empty, so arrows, space, and
enter reach the page ([P-0009](pitfalls.md#p-0009)). The session
spellchecker is off, so the desktop does not draw red underlines in
the answer field.

A second launch focuses this window. It does not open another one.

## What the reader sees change

On a correct answer the page already paints the locked card. The
shell only shortens the beat before the next card
([D-0013](decisions.md#d-0013)). A wrong answer looks like the site's
wrong answer: the same card, the gap marked `wrong`.

Help and payment leave this window and open in the system browser.
An OAuth popup that must reach `window.opener` stays a child window
of this shell.
