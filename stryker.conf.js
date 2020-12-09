/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  packageManager: "yarn",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  testRunner: "mocha",
  mochaOptions: {
    require: ["test/_helper.js"],
  },
  coverageAnalysis: "perTest",
};
