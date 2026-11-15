# Use cases

Status: the client is the desk shell in
[D-0003](decisions.md#d-0003). No application code runs these yet.

## Study at the desk

The reader opens the client on a large display and types on a
keyboard. The window shows `https://learn.lingvist.com/`. Drilling
happens on `#guess`. The page handles arrows, space, and enter. The
shell does not add its own study UI.

## Miss a card

A wrong answer, including one that is a single character short, leaves
the same card up. The gap is marked `wrong`. Nothing advances.

## Answer a card correctly

The site locks the card and shows the word. That paint is done in
about 40–120ms. The shell then keeps 100ms of that correct state
instead of the site's 500ms or 250ms hold. The site still saves the
answer and draws the next card. The next word in the measured session
was on screen about 40ms after the timer fired.

Sentence audio, when it is on, still plays to the end before that
short hold. The shell does not cut the sentence.

## Come back later

The login is still in the window after the client is quit and opened
again. `userData` is persistent.

## Open the client twice

The second launch does not create a second window. It focuses the
one already open.

## Speak an answer

The page's microphone button asks once. The prompt is audio only, for
the main frame, on `https://learn.lingvist.com`. The site does the
recognition. This client has no speech engine of its own.

## Open help

Help is a `window.open`, not a route on the study site. The shell
sends that `https` URL to the system browser.

## Pay, or change a plan

Checkout, plan changes, and receipts are out of scope. If the site
opens a payment window, the shell sends it to the system browser.
The same job can be done in a normal browser or the mobile app.

## Sign in with a third party

Email login, Google, Apple, Facebook, Weibo, and Feide can run inside
the window when they use the hosts in
[requirements](requirements.md#links).

Apple replaces the page with `appleid.apple.com` and returns to
`learn.lingvist.com/oauth.html`. Facebook, Weibo, and Feide post the
result to `window.opener`, so those popups are real child windows.
Google may open `about:blank` and then navigate it.
