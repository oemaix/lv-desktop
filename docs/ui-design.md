# UI design

Status: the page is the UI ([D-0003](decisions.md#d-0003),
[D-0012](decisions.md#d-0012)).

## No packaged UI

The shell ships no screens of its own. There is no theme picker and
no touch layout. The Lingvist page is the whole study surface, on a
large display, driven by a keyboard. Its colors are shifted to night
([D-0017](decisions.md#d-0017), [D-0019](decisions.md#d-0019)).
That shift keeps each page hue. It is on from 20:00 to 06:00 local
time, and it is removed when the page has night colors of its own.
The mark in the navigation header is painted with the night ink for
that same stretch ([P-0021](pitfalls.md#p-0021)). The control that
folds the sentence translation takes that ink as well
([P-0022](pitfalls.md#p-0022)). The
send-feedback control is hidden. The shell presses the page's
"OK, got it" button ([D-0018](decisions.md#d-0018)). The reCAPTCHA
badge stays.

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
