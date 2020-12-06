"use strict";

const assert = require("assert");
const { sql } = require("slonik");

const SlormField = require("./SlormField");
const SlormModel = require("../SlormModel");

class ForeignKeyField extends SlormField {
  constructor(args) {
    if (args === undefined) args = {};
    assert(typeof args === "object", "args must be an object");

    assert(
      args.table !== undefined &&
        args.table !== null &&
        args.table.prototype instanceof SlormModel,
      "table must be a SlormModel subclass"
    );
    assert(
      args.table[args.column] instanceof SlormField,
      "column must be a property of args.table and must be an instance of SlormField"
    );

    super({
      sqlType: args.table[args.column].sqlType,
      refTable: args.table.getTableName(),
      refColumn:
        args.table[args.column].columnName !== undefined
          ? args.table[args.column].columnName
          : sql`${sql.identifier([args.column])}`,
      ...args,
    });

    this.table = args.table;
    this.column = args.column;
  }
}

module.exports = ForeignKeyField;
