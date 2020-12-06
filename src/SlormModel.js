"use strict";

const assert = require("assert");
const { sql } = require("slonik");

const escape = require("./utils/escape");
const joinSqlTemplates = require("./utils/join_sql_templates");
const SlormConstraint = require("./constraints/SlormConstraint");
const SlormField = require("./fields/SlormField");

class SlormModel {
  static tableName;

  constructor(args) {
    args = args !== undefined ? args : {};

    for (let attr in args) {
      assert(
        attr in this.constructor,
        `${attr} is not a field in ${this.constructor}`
      );

      this[attr] = this.constructor[attr].fromDb(args[attr]);
    }
  }

  static getTableName() {
    let tableName = this.tableName;
    if (tableName === undefined)
      tableName = sql`${sql.identifier([this.name])}`;

    assert(
      typeof tableName === "object" &&
        "type" in tableName &&
        tableName.type === "SLONIK_TOKEN_SQL",
      "tableName must be a slonik sql template"
    );
    tableName = escape(tableName);

    return tableName;
  }

  static toSQL(args) {
    if (args === undefined) args = {};
    assert(typeof args === "object", "args must be an object");

    args.temporary = "temporary" in args ? args.temporary : false;
    assert(typeof args.temporary === "boolean", "temporary must be a boolean");

    args.unlogged = "unlogged" in args ? args.unlogged : false;
    assert(typeof args.unlogged === "boolean", "unlogged must be a boolean");

    args.ifNotExists = "ifNotExists" in args ? args.ifNotExists : false;
    assert(
      typeof args.ifNotExists === "boolean",
      "ifNotExists must be a boolean"
    );

    let columns = [];
    let constraints = [];

    for (let attr in this)
      if (this[attr] instanceof SlormField) columns.push(attr);
      else if (this[attr] instanceof SlormConstraint) constraints.push(attr);

    columns = joinSqlTemplates(
      columns.map((attr) => this[attr].toSQL(sql`${sql.identifier([attr])}`)),
      sql`, `
    );
    constraints = joinSqlTemplates(
      constraints.map((attr) =>
        this[attr].toSQL(sql`${sql.identifier([attr])}`)
      ),
      sql`, `
    );

    return [
      joinSqlTemplates(
        [
          sql`CREATE`,
          sql`${args.temporary ? sql`TEMPORARY` : sql``}`,
          sql`${args.unlogged ? sql`UNLOGGED` : sql``}`,
          sql`TABLE`,
          sql`${args.ifNotExists ? sql`IF NOT EXISTS` : sql``}`,
          sql`${this.getTableName()} (`,
          sql`${joinSqlTemplates([columns, constraints], sql`, `)}`,
          sql`)`,
        ],
        sql` `
      ),
    ];
  }
}

module.exports = SlormModel;
