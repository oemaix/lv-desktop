const assert = require("node:assert/strict");
const test = require("node:test");
const { electronLaunchArgs } = require("../src/launch");

test("a normal account starts Electron with the process sandbox", () => {
  assert.deepEqual(electronLaunchArgs(1000), ["."]);
  assert.deepEqual(electronLaunchArgs(1000, ["--remote-debugging-port=9222"]), [
    "--remote-debugging-port=9222",
    ".",
  ]);
});

test("uid 0 passes --no-sandbox before Electron's startup check", () => {
  assert.deepEqual(electronLaunchArgs(0), ["--no-sandbox", "."]);
  assert.deepEqual(electronLaunchArgs(0, ["--remote-debugging-port=9222"]), [
    "--no-sandbox",
    "--remote-debugging-port=9222",
    ".",
  ]);
});
