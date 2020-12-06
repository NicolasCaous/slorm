"use strict";

const assert = require("assert");
const uuid = require("uuid");

const joinSqlTemplates = require("./utils/join_sql_templates");
const SlormField = require("./fields/SlormField");
const SlormModel = require("./SlormModel");
const TimestampField = require("./fields/TimestampField");
const UUIDField = require("./fields/UUIDField");

class ScaffoldModel extends SlormModel {
  #dbTruth;

  static id = new UUIDField({
    default: uuid.v4,
    primaryKey: true,
  });

  static updated_at = new TimestampField();
  static created_at = new TimestampField();

  async _save(trx, override) {
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

      for (let attr in this.constructor) {
        if (this.constructor[attr] instanceof SlormField) {
          let value = this[attr];
          value = value === undefined ? null : value;

          if (this.constructor[attr].isDifferent(value, this.#dbTruth[attr])) {
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

      this.updated_at = columns[0][2];

      return true;
    }
  }
}

module.exports = ScaffoldModel;
