# Requirements

Status: required shell behavior ([D-0003](decisions.md#d-0003),
[D-0012](decisions.md#d-0012), [D-0013](decisions.md#d-0013),
[D-0014](decisions.md#d-0014)). The shell is Electron 45
([D-0011](decisions.md#d-0011)).

The site facts below were measured in a logged-in session on
2026-11-15. Sentence audio was off for that account. Auto-advance was
on. That setting does not remove the hold.

## Study surface

The shell does not keep a route table. The study screen is
`https://learn.lingvist.com/#guess`. Home is `#hub`. Account,
classrooms, and insights are other hashes on the same origin. Help
is `window.open`.

The card is a cloze. The answer field has `spellcheck=false` and
`autocomplete=off`. The bar under the card is diacritics, a
microphone, and submit.

## Keys

The page handles the keys:

- Arrows move between cards and open or close diacritics.
- Space replays the sentence.
- Enter reveals or confirms.

The shell does not bind those keys ([P-0009](pitfalls.md#p-0009)).
The menu is empty, so the page's keys are the keys. The shell turns
the session spellchecker off. Desktop red underlines then stay away
from the answer.

## Answers

A wrong answer, including a one-character-short answer, leaves the
same card up. The gap is marked `wrong`. Nothing is auto-advanced.

A correct answer locks the card, shows the word, holds, then saves
and draws the next card. The locked card and the `correct` gap are
already painted by about 40–120ms. The rest of the site's 500ms is a
fixed beat.

## The hold

The hold is in the site's `submit` path, not in the network.

When sentence audio is off, the site sets a `setTimeout` of 500ms,
then emits `guess:final-answer-submit`. That event saves the answer
and shows the next card. Three correct submits in the session fired
that timer at 500ms. The next word was on screen about 40ms later.
One of the three finished nearer 640ms. The visible wait is the
timer.

When sentence audio is on, the same path waits for Howler `end`,
with a 6s cap, and then waits 250ms before the same event.
`autoPlayDelay` of 2000ms is a debug auto-player. It did not run in
the session.

The shell installs one page-world wrapper around `setTimeout` before
the user is answering ([D-0013](decisions.md#d-0013)):

```js
const orig = window.setTimeout;
window.setTimeout = function (fn, delay, ...args) {
  if ((delay === 500 || delay === 250)
      && typeof fn === "function"
      && String(fn).includes("final-answer-submit")) {
    delay = 100;
  }
  return orig.call(this, fn, delay, ...args);
};
```

100ms keeps a single beat of the correct state. The save still
happens. `playContext()` is left alone, so the sentence still plays
through. The 6s audio cap is left alone. Wrong answers do not use
this timer, so they still stay on the card.

Install it with `webContents.executeJavaScript` on `dom-ready`
([P-0007](pitfalls.md#p-0007)). The page calls the global
`setTimeout` at answer time, so the wrapper still applies if it is
installed after the bundle loads.

If Lingvist renames `final-answer-submit`, the check matches nothing
and the original 500ms returns. The cards keep working.

## Window and session

- Persistent `userData`, so the login survives a restart.
- Single instance. A second launch focuses the window.
- Strip the `Electron/` token from the default Chrome user agent and
  keep that Chrome version.
- `setSpellCheckerEnabled(false)`.
- Empty application menu.

## Permissions

Microphone: one prompt, audio only, main frame, origin
`https://learn.lingvist.com`. Camera, notifications, and geolocation
are denied.

## Links

In-app navigation stays on the study origin and the login hosts that
can return a session there:

- `learn.lingvist.com`
- `accounts.google.com`
- `apis.google.com`
- `www.google.com`
- `www.gstatic.com`
- `www.recaptcha.net`
- `appleid.apple.com`
- `facebook.com`
- `weibo.com`
- `dataporten.no` (Feide)

`about:blank` is allowed only as a popup. Google opens one, then
navigates it. Any other `https` URL from `window.open` or a
main-frame navigation goes to the system browser. `http:`, `file:`,
`javascript:`, and `data:` from the page are dropped.

Apple sign-in is a full-page redirect to `appleid.apple.com` and
back to `learn.lingvist.com/oauth.html`. Facebook, Weibo, and Feide
post the result to `window.opener` from that OAuth page, so those
popups are real child windows.

Payment hosts are not on the in-app list. Checkout is not this
program.

Do not filter requests ([P-0008](pitfalls.md#p-0008)). Card JSON,
progress sync, and audio are ordinary loads from the page.

## Not this program

No second scheduler, no theme, no global hotkeys, no offline cache,
no tracker blocklist, and no speech engine of our own.
