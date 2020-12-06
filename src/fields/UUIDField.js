"use strict";

const { sql } = require("slonik");

const SlormField = require("./SlormField");

class UUIDField extends SlormField {
  constructor(args) {
    super({ sqlType: sql`uuid`, ...args });
  }
}

module.exports = UUIDField;
