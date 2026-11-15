const assert = require("node:assert/strict");
const test = require("node:test");
const pkg = require("../package.json");
const { releaseTagError } = require("../scripts/check-release-tag");

function targetArches(targets, name) {
  const match = targets.find((item) => item.target === name);
  assert.ok(match, name);
  assert.deepEqual(match.arch, ["x64", "arm64"]);
}

test("release packages are unsigned and cover both arches", () => {
  const build = pkg.build;
  assert.equal(pkg.version, "0.4.0");
  assert.equal(pkg.license, "GPL-3.0-only");
  assert.equal(pkg.devDependencies["electron-builder"], "26.18.0");
  assert.equal(build.electronVersion, "45.3.3");
  assert.notEqual(build.forceCodeSigning, true);
  targetArches(build.linux.target, "AppImage");
  targetArches(build.linux.target, "deb");
  targetArches(build.linux.target, "rpm");
  targetArches(build.mac.target, "dmg");
  targetArches(build.win.target, "msi");
  assert.equal(build.mac.identity, null);
  assert.equal(build.mac.notarize, false);
  assert.equal(build.win.signExecutable, false);
});

test("a version tag has to match package.json", () => {
  assert.equal(releaseTagError("refs/heads/main", "main", "0.1.0"), "");
  assert.equal(releaseTagError("refs/tags/v0.1.0", "v0.1.0", "0.1.0"), "");
  assert.match(releaseTagError("refs/tags/v0.2.0", "v0.2.0", "0.1.0"), /does not match/);
});
