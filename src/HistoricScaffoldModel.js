"use strict";

const assert = require("assert");
const uuid = require("uuid");
const { sql } = require("slonik");

const joinSqlTemplates = require("./utils/join_sql_templates");
const ScaffoldModel = require("./ScaffoldModel");
const SlormModel = require("./SlormModel");
const SlormField = require("./fields/SlormField");
const TimestampField = require("./fields/TimestampField");
const UUIDField = require("./fields/UUIDField");

class HistoricScaffoldModel extends SlormModel {
  #dbTruth;

  static id = new UUIDField({
    default: uuid.v4,
    primaryKey: true,
  });

  static updated_at = new TimestampField();
  static created_at = new TimestampField();

  static _history;
  static setUpHistory() {
    let historyTableName = this.historyTableName;

    if (historyTableName === undefined) {
      let tableName = this.getTableName();
      tableName = tableName.sql.slice().slice(1, tableName.sql.length - 1);
      historyTableName = sql`${sql.identifier([tableName + "_history"])}`;
    }

    assert(
      typeof historyTableName === "object" &&
        "type" in historyTableName &&
        historyTableName.type === "SLONIK_TOKEN_SQL",
      "historyTableName must be a slonik sql template"
    );

    this._history = ((className) =>
      ({
        [className]: class extends ScaffoldModel {
          static tableName = historyTableName;

          static hid = new UUIDField({
            default: uuid.v4,
            primaryKey: true,
          });
        },
      }[className]))(this.name + "History");

    for (let attr in this)
      if (this[attr] instanceof SlormField)
        this._history[attr] = this[attr].toHistory();
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

    assert(
      this._history !== undefined,
      "setUpHistory must be called before toSQL"
    );

    let columns = [];
    let constraints = [];

    for (let attr in this._history)
      if (this._history[attr] instanceof SlormField) columns.push(attr);
      else if (this._history[attr] instanceof SlormConstraint)
        constraints.push(attr);

    columns = joinSqlTemplates(
      columns.map((attr) =>
        this._history[attr].toSQL(sql`${sql.identifier([attr])}`)
      ),
      sql`, `
    );
    constraints = joinSqlTemplates(
      constraints.map((attr) =>
        this._history[attr].toSQL(sql`${sql.identifier([attr])}`)
      ),
      sql`, `
    );

    return [
      ...super.toSQL(args),
      joinSqlTemplates(
        [
          sql`CREATE`,
          sql`${args.temporary ? sql`TEMPORARY` : sql``}`,
          sql`${args.unlogged ? sql`UNLOGGED` : sql``}`,
          sql`TABLE`,
          sql`${args.ifNotExists ? sql`IF NOT EXISTS` : sql``}`,
          sql`${this._history.getTableName()} (`,
          sql`${joinSqlTemplates([columns, constraints], sql`, `)}`,
          sql`)`,
        ],
        sql` `
      ),
    ];
  }

  async _save(trx, override) {
    assert(
      this.constructor._history !== undefined,
      "setUpHistory must be called before toSQL"
    );

    let newRow = this.id === undefined;

    if (this.id !== undefined) {
      let result = await trx.query(
        joinSqlTemplates(
          [
            sql`SELECT * FROM`,
            sql`${this.constructor.getTableName()}`,
            sql`WHERE "id" =`,
            sql`${this.constructor.id.toDb(this.id)}`,
          ],
          sql` `
        )
      );

      newRow = result.rowCount === 0;

      if (!newRow) {
        this.#dbTruth = {};
        for (let attr in result.rows[0]) {
          this.#dbTruth[attr] = this.constructor[attr].fromDb(
            result.rows[0][attr]
          );
        }
      }
    }

    if (newRow) {
      let columns = [
        [
          "updated_at",
          sql`"updated_at"`,
          new Date(),
          (x) => this.constructor.updated_at.toDb(x),
        ],
        [
          "created_at",
          sql`"created_at"`,
          new Date(),
          (x) => this.constructor.created_at.toDb(x),
        ],
      ];

      for (let attr in this.constructor) {
        if (this.constructor[attr] instanceof SlormField) {
          let value = this[attr];

          if (
            value === undefined &&
            typeof this.constructor[attr].default === "function"
          ) {
            value = await this.constructor[attr].default(this);
          }

          if (value !== undefined)
            columns.push([
              attr,
              this.constructor[attr].columnName !== undefined
                ? this.constructor[attr].columnName
                : sql`${sql.identifier([attr])}`,
              value,
              (x) => this.constructor[attr].toDb(x),
            ]);
        }
      }

      if (
        columns.filter((x) => x[0] === "updated_at" || x[0] === "created_at")
          .length > 2
      ) {
        assert(
          override === true,
          "editing updated_at or created_at is forbidden without override flag"
        );

        let removeUpdatedAt =
          columns.filter((x) => x[0] === "updated_at").length === 2;
        let removeCreatedAt =
          columns.filter((x) => x[0] === "created_at").length === 2;

        if (removeUpdatedAt && removeCreatedAt) columns.splice(0, 2);
        else {
          if (removeUpdatedAt) columns.splice(0, 1);
          if (removeCreatedAt) columns.splice(1, 1);
        }
      }

      await trx.query(
        joinSqlTemplates(
          [
            sql`INSERT INTO ${this.constructor.getTableName()} (`,
            joinSqlTemplates(
              columns.map((x) => x[1]),
              sql`, `
            ),
            sql`) VALUES (`,
            joinSqlTemplates(
              columns.map((x) => x[3](x[2])),
              sql`, `
            ),
            sql`)`,
          ],
          sql` `
        )
      );

      for (let i in columns) {
        let attr = columns[i][0];
        let value = columns[i][2];
        this[attr] = value;
      }

      return true;
    } else {
      let columns = [
        [
          "updated_at",
          sql`"updated_at"`,
          new Date(),
          (x) => this.constructor.updated_at.toDb(x),
        ],
      ];
      let historyColumns = [
        [
          "hid",
          sql`"hid"`,
          await this.constructor._history.hid.default(),
          (x) => this.constructor._history.hid.toDb(x),
        ],
      ];

      for (let attr in this.constructor) {
        if (this.constructor[attr] instanceof SlormField) {
          let value = this[attr];
          value = value === undefined ? null : value;

          historyColumns.push([
            attr,
            this.constructor[attr].columnName !== undefined
              ? this.constructor[attr].columnName
              : sql`${sql.identifier([attr])}`,
            this.#dbTruth[attr],
            (x) => this.constructor[attr].toDb(x),
          ]);
          if (this.constructor[attr].isDifferent(value, this.#dbTruth[attr]))
            columns.push([
              attr,
              this.constructor[attr].columnName !== undefined
                ? this.constructor[attr].columnName
                : sql`${sql.identifier([attr])}`,
              value,
              (x) => this.constructor[attr].toDb(x),
            ]);
        }
      }

      if (columns.length === 1) return false;

      if (
        columns.filter((x) => x[0] === "updated_at" || x[0] === "created_at")
          .length > 1
      ) {
        assert(
          override === true,
          "editing updated_at or created_at is forbidden without override flag"
        );

        if (columns.filter((x) => x[0] === "updated_at").length === 2)
          columns.splice(0, 1);
      }

      await trx.query(
        joinSqlTemplates(
          [
            sql`UPDATE ${this.constructor.getTableName()} SET`,
            joinSqlTemplates(
              columns.map((x) => sql`${x[1]} = ${x[3](x[2])}`),
              sql`, `
            ),
            sql`WHERE "id" =`,
            sql`${this.constructor.id.toDb(this.id)}`,
          ],
          sql` `
        )
      );
      await trx.query(
        joinSqlTemplates(
          [
            sql`INSERT INTO ${this.constructor._history.getTableName()} (`,
            joinSqlTemplates(
              historyColumns.map((x) => x[1]),
              sql`, `
            ),
            sql`) VALUES (`,
            joinSqlTemplates(
              historyColumns.map((x) => x[3](x[2])),
              sql`, `
            ),
            sql`)`,
          ],
          sql` `
        )
      );

      this.updated_at = columns[0][2];

      return true;
    }
  }
}

module.exports = HistoricScaffoldModel;
