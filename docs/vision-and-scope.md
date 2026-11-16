# Vision and scope

Status: decided ([D-0003](decisions.md#d-0003)). The shell is
Electron 45 ([D-0011](decisions.md#d-0011)).

## The desk

This client is for someone sitting at a desk. A keyboard and a large
display are the study tools. That is a better place to drill
vocabulary than a phone or a tablet. The client does not try to feel
like those devices.

## Who teaches

Lingvist stays the teacher. The shell is one window on
`https://learn.lingvist.com/`. The card loop, the hints, the audio,
and the scheduling stay on that site.

The shell does three things around that page. It keeps the login
session. It stays out of the keyboard. It shortens one fixed pause
after a correct answer.

## In scope

- One window on the study site.
- A session that is still there after a restart.
- A second launch that focuses the window already open.
- The page's own keys: arrows, space, and enter.
- One shorter hold after a correct answer.
- Login hosts that can hand a session back to the study site.
- A microphone prompt for the page's own speech input.
- Help, payment, and any other off-list `https` link, sent to the
  system browser.

## Out of scope

- Subscription, checkout, plan changes, and receipts.
- A second scheduler.
- Any color theme besides the night treatment
  ([D-0017](decisions.md#d-0017)), or any packaged UI of our own.
- Global hotkeys.
- An offline cache.
- A tracker blocklist.
- A speech engine of our own.
- Phone and tablet layouts.
