"use strict";

const { trim } = require("url-safe-base64");
const { sql } = require("slonik");

const SlormField = require("./SlormField");

class Base64BinaryField extends SlormField {
  constructor(args) {
    super({ sqlType: sql`bytea`, ...args });
  }

  fromDb(value) {
    return trim(value.toString("base64"));
  }

  toDb(value) {
    return sql`${sql.binary(Buffer.from(value, "base64"))}`;
  }
}

module.exports = Base64BinaryField;
