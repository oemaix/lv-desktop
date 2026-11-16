const assert = require("node:assert/strict");
const test = require("node:test");
const { consentButton, feedbackCss, pressConsent } = require("../src/study-notices");

function fakePage() {
  const button = {
    textContent: "OK, got it",
    clicked: false,
    click() {
      this.clicked = true;
    },
  };
  const section = {
    className: "app-cookie-consent",
    buttons: [button],
    querySelectorAll(selector) {
      return selector === "button" ? this.buttons : [];
    },
  };
  const badge = { className: "grecaptcha-badge", clicked: false };
  return {
    badge,
    button,
    section,
    querySelector(selector) {
      if (selector === ".app-cookie-consent") return section;
      if (selector === ".grecaptcha-badge") return badge;
      return null;
    },
  };
}

test("the feedback control is hidden and the consent button is pressed once", () => {
  assert.equal(feedbackCss, ".survey{display:none !important}");
  assert.equal(feedbackCss.includes("grecaptcha"), false);

  const page = fakePage();
  assert.equal(consentButton(page), page.button);
  assert.equal(pressConsent(page, () => ({ display: "block" })), true);
  assert.equal(page.button.clicked, true);
  assert.equal(page.badge.clicked, false);
  assert.equal(pressConsent(page, () => ({ display: "none" })), false);
});

test("a hidden consent notice is left alone", () => {
  const page = fakePage();
  assert.equal(pressConsent(page, () => ({ display: "none" })), false);
  assert.equal(page.button.clicked, false);
});
