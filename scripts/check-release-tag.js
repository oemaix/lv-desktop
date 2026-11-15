function releaseTagError(ref, tag, version) {
  if (!String(ref || "").startsWith("refs/tags/")) {
    return "";
  }
  if (tag !== `v${version}`) {
    return `tag ${tag} does not match package version ${version}`;
  }
  return "";
}

if (require.main === module) {
  const version = require("../package.json").version;
  const message = releaseTagError(process.env.GITHUB_REF, process.env.GITHUB_REF_NAME, version);
  if (message) {
    console.error(message);
    process.exit(1);
  }
}

module.exports = { releaseTagError };
