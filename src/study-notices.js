// Hide the send-feedback control and press the study page's
// "OK, got it" button. That button stores Lingvist's consent cookie.
// The reCAPTCHA badge stays.

const feedbackCss = ".survey{display:none !important}";

function consentButton(root) {
  if (!root || typeof root.querySelector !== "function") {
    return null;
  }
  const section = root.querySelector(".app-cookie-consent");
  if (!section || typeof section.querySelectorAll !== "function") {
    return null;
  }
  const buttons = Array.from(section.querySelectorAll("button"));
  return buttons.find((button) => {
    const text = String(button.textContent || "").replace(/\s+/g, " ").trim();
    return /^ok, got it$/i.test(text);
  }) || null;
}

function pressConsent(root, readStyle) {
  const button = consentButton(root);
  if (!button) {
    return false;
  }
  const section = root.querySelector(".app-cookie-consent");
  const display = readStyle(section).display;
  if (display === "none") {
    return false;
  }
  button.click();
  return true;
}

function install() {
  const root = document.documentElement;
  if (!root || root.dataset.lvNotices) {
    return;
  }
  root.dataset.lvNotices = "1";
  const style = document.createElement("style");
  style.dataset.lvNotices = "1";
  style.textContent = feedbackCss;
  root.appendChild(style);

  let observer;
  const press = () => {
    if (pressConsent(document, getComputedStyle)) {
      observer.disconnect();
    }
  };
  observer = new MutationObserver(press);
  observer.observe(root, { childList: true, subtree: true });
  press();
}

if (typeof module === "object" && module.exports) {
  module.exports = {
    consentButton,
    feedbackCss,
    pressConsent,
  };
}

if (typeof document !== "undefined" && document.documentElement) {
  install();
}
