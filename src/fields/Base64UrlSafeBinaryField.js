"use strict";

const { encode, decode, trim } = require("url-safe-base64");
const { sql } = require("slonik");

const SlormField = require("./SlormField");

class Base64UrlSafeBinaryField extends SlormField {
  constructor(args) {
    super({ sqlType: sql`bytea`, ...args });
  }

  fromDb(value) {
    return trim(encode(value.toString("base64")));
  }

  toDb(value) {
    return sql`${sql.binary(Buffer.from(decode(value), "base64"))}`;
  }
}

module.exports = Base64UrlSafeBinaryField;
