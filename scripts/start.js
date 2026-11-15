const { spawn } = require("node:child_process");
const { electronLaunchArgs } = require("../src/launch");

const uid = typeof process.getuid === "function" ? process.getuid() : null;
const child = spawn("electron", electronLaunchArgs(uid, process.argv.slice(2)), {
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
