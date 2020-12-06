"use strict";

const assert = require("assert");
const { sql } = require("slonik");

const SlormField = require("./SlormField");

class VarCharField extends SlormField {
  constructor(args) {
    if (args === undefined) args = {};
    assert(typeof args === "object", "args must be an object");

    args.maxLength = "maxLength" in args ? args.maxLength : sql`255`;

    assert(
      typeof args.maxLength === "object" &&
        "type" in args.maxLength &&
        args.maxLength.type === "SLONIK_TOKEN_SQL",
      "maxLength must be a slonik sql template"
    );
    super({ sqlType: sql`varchar(${args.maxLength})`, ...args });

    this.maxLength = args.maxLength;
  }
}

module.exports = VarCharField;
