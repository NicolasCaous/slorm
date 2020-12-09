"use strict";

const { sql } = require("slonik");

const SlormField = require("./SlormField");

class IntField extends SlormField {
  constructor(args) {
    super({ sqlType: sql`int`, ...args });
  }
}

module.exports = IntField;
