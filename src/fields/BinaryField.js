"use strict";

const { sql } = require("slonik");

const SlormField = require("./SlormField");

class BinaryField extends SlormField {
  constructor(args) {
    super({ sqlType: sql`bytea`, ...args });
  }

  fromDb(value) {
    return value;
  }

  toDb(value) {
    return sql`${sql.binary(value)}`;
  }

  isDifferent(a, b) {
    return Boolean(Buffer.compare(a, b));
  }
}

module.exports = BinaryField;
