"use strict";

const assert = require("assert");
const uuid = require("uuid");
const { sql } = require("slonik");

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
        this.#dbTruth = new this.constructor(result.rows[0]);
      }
    }

    for (let attr in this.constructor)
      if (
        this.constructor[attr] instanceof SlormField &&
        this[attr] === undefined &&
        typeof this.constructor[attr].default === "function"
      )
        this[attr] = await this.constructor[attr].default(this);

    if (newRow) {
      let now = new Date();

      if (this.updated_at !== undefined)
        assert(
          override === true,
          "editing updated_at is forbidden without override flag"
        );
      else this.updated_at = now;

      if (this.created_at !== undefined)
        assert(
          override === true,
          "editing created_at is forbidden without override flag"
        );
      else this.created_at = now;

      await trx.query(this.toInsertSQL());

      return true;
    } else {
      if (!this.isDirty(this.#dbTruth)) return false;

      if (
        this.constructor.updated_at.isDifferent(
          this.updated_at,
          this.#dbTruth.updated_at
        )
      )
        assert(
          override === true,
          "editing updated_at is forbidden without override flag"
        );
      else this.updated_at = new Date();

      if (
        this.constructor.created_at.isDifferent(
          this.created_at,
          this.#dbTruth.created_at
        )
      )
        assert(
          override === true,
          "editing created_at is forbidden without override flag"
        );

      await trx.query(this.toUpdateSQL(this.#dbTruth));

      return true;
    }
  }

  async _delete(trx) {
    if (this.id === undefined) return false;

    let result = await trx.query(
      joinSqlTemplates(
        [
          sql`SELECT count(*) FROM`,
          sql`${this.constructor.getTableName()}`,
          sql`WHERE "id" =`,
          sql`${this.constructor.id.toDb(this.id)}`,
        ],
        sql` `
      )
    );

    if (parseInt(result.rows[0].count) === 0) return false;

    await trx.query(
      joinSqlTemplates(
        [
          sql`DELETE FROM ${this.constructor.getTableName()} WHERE "id" =`,
          sql`${this.constructor.id.toDb(this.id)}`,
        ],
        sql` `
      )
    );

    return true;
  }
}

module.exports = ScaffoldModel;
