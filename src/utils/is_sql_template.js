"use strict";

const isObject = require("./is_object");

module.exports = (x) =>
  isObject(x) && "type" in x && x.type === "SLONIK_TOKEN_SQL";
