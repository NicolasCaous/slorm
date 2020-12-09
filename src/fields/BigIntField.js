"use strict";

const { sql } = require("slonik");

const SlormField = require("./SlormField");

class BigIntField extends SlormField {
  constructor(args) {
    super({ sqlType: sql`bigint`, ...args });
  }

  fromDb(value) {
    return BigInt(value);
  }

  toDb(value) {
    return sql`${value.toString()}`;
  }
}

module.exports = BigIntField;
