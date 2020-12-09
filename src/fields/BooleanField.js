"use strict";

const { sql } = require("slonik");

const SlormField = require("./SlormField");

class BooleanField extends SlormField {
  constructor(args) {
    super({ sqlType: sql`bool`, ...args });
  }
}

module.exports = BooleanField;
