function electronLaunchArgs(uid, extra = []) {
  const args = [];
  if (uid === 0) {
    args.push("--no-sandbox");
  }
  args.push(...extra);
  args.push(".");
  return args;
}

module.exports = { electronLaunchArgs };
