const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const timerSource = fs.readFileSync(path.join(__dirname, "..", "src", "timer-wrapper.js"), "utf8");

function installTimer() {
  const seen = [];
  const context = {
    window: {
      setTimeout(fn, delay, ...args) {
        seen.push({ fn, delay, args, thisValue: this });
        return delay;
      },
    },
  };
  vm.runInNewContext(timerSource, context);
  return { window: context.window, seen };
}

function finishCard() {
  return "final-answer-submit";
}

test("correct-answer hold of 500ms or 250ms becomes 100ms", () => {
  const { window, seen } = installTimer();

  assert.equal(window.setTimeout(finishCard, 500, "saved"), 100);
  assert.equal(window.setTimeout(finishCard, 250), 100);
  assert.deepEqual(seen.map((call) => call.delay), [100, 100]);
  assert.deepEqual(seen[0].args, ["saved"]);
  assert.equal(seen[0].thisValue, window);
});

test("other timers, including audio and wrong answers, stay unchanged", () => {
  const { window, seen } = installTimer();

  function playSentence() {
    return "playContext";
  }

  assert.equal(window.setTimeout(playSentence, 500), 500);
  assert.equal(window.setTimeout(finishCard, 2000), 2000);
  assert.equal(window.setTimeout(finishCard, 6000), 6000);
  assert.equal(window.setTimeout(finishCard, 100), 100);
  assert.equal(window.setTimeout("final-answer-submit", 500), 500);
  assert.equal(window.setTimeout(finishCard, "500"), "500");
  assert.deepEqual(seen.map((call) => call.delay), [500, 2000, 6000, 100, 500, "500"]);
});

test("a second installation on the same page leaves the first wrapper in place", () => {
  const seen = [];
  const context = {
    window: {
      setTimeout(fn, delay, ...args) {
        seen.push(delay);
        return delay;
      },
    },
  };
  vm.runInNewContext(timerSource, context);
  assert.throws(() => vm.runInNewContext(timerSource, context), /orig/);

  assert.equal(context.window.setTimeout(finishCard, 500), 100);
  assert.deepEqual(seen, [100]);
});
