const orig = window.setTimeout;
window.setTimeout = function (fn, delay, ...args) {
  if ((delay === 500 || delay === 250)
      && typeof fn === "function"
      && String(fn).includes("final-answer-submit")) {
    delay = 100;
  }
  return orig.call(this, fn, delay, ...args);
};
