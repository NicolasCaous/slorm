/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  packageManager: "yarn",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  testRunner: "mocha",
  mochaOptions: {
    spec: ["test/**/*.test.js"],
    require: ["test/helper.js"],
  },
  coverageAnalysis: "perTest",
};
