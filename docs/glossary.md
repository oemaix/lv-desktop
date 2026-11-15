# Glossary

Status: terms for the desk client ([D-0003](decisions.md#d-0003)).

## Desk

A person sitting at a PC, with a keyboard and a large display. This
client is built for that place.

## Shell

The Electron program. One main process and one window around the
study site. Also called the wrapper.

## Study site

`https://learn.lingvist.com/`. The study screen is `#guess`. Home is
`#hub`. Account, classrooms, and insights are other hashes on the
same origin. Help is `window.open`, not a hash.

## Card

A cloze on the study screen. The answer field has `spellcheck=false`
and `autocomplete=off`. The bar under the card is diacritics, a
microphone, and submit. The gap is the blank that receives the
answer. A wrong gap is marked `wrong`. A correct card becomes
`locked`, and the gap is marked `correct`.

## Hold

The fixed pause after a correct answer, before the site saves and
draws the next card. It is a `setTimeout` in the site's submit path,
not a network wait. Sentence audio off uses 500ms. Sentence audio on
uses 250ms after the sentence ends. The shell's wrapper turns those
two delays into 100ms ([D-0013](decisions.md#d-0013)).

## Page world

The page's own JavaScript realm. The timer wrapper runs there. It is
installed with `webContents.executeJavaScript` on `dom-ready`
([D-0012](decisions.md#d-0012)).

## System browser

The operating system's browser. Help, payment, and any other `https`
link that is not an in-app host open there.

## Child window

An OAuth popup that must talk to `window.opener`. Google, Facebook,
Weibo, and Feide need one. `about:blank` is allowed only in that role.

## Login host

A host the shell keeps inside the window because it can return a
session to the study site. The list is in
[requirements](requirements.md#links).

## Feide

The Norwegian login service. The shell knows it as `dataporten.no`.
It posts the result to `window.opener`.
