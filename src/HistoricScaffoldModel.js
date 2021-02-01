"use strict";

const assert = require("assert");
const uuid = require("uuid");
const { sql } = require("slonik");

const BooleanField = require("./fields/BooleanField");
const joinSqlTemplates = require("./utils/join_sql_templates");
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
        [className]: class extends SlormModel {
          static tableName = historyTableName;

          static hid = new UUIDField({
            default: uuid.v4,
            primaryKey: true,
          });
          static updated_by = new UUIDField({ null: true });
          static deleted = new BooleanField({ default: sql`false` });
        },
      }[className]))(this.name + "History");

    for (let attr in this)
      if (this[attr] instanceof SlormField)
        this._history[attr] = this[attr].toHistory();
  }

  static toSQL(args) {
    assert(
      this._history !== undefined,
      "setUpHistory must be called before toSQL"
    );
    return [...super.toSQL(args), ...this._history.toSQL(args)];
  }

  async _save(trx, author, override) {
    assert(
      this.constructor._history !== undefined,
      "setUpHistory must be called before _save"
    );
    if (author !== undefined)
      assert(uuid.validate(author), "author must be a valid UUID");

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

      let removeUpdatedAt = false;
      let removeCreatedAt = false;

      if (this.updated_at !== undefined)
        assert(
          override === true,
          "editing updated_at is forbidden without override flag"
        );
      else {
        removeUpdatedAt = true;
        this.updated_at = now;
      }

      if (this.created_at !== undefined)
        assert(
          override === true,
          "editing created_at is forbidden without override flag"
        );
      else {
        removeCreatedAt = true;
        this.created_at = now;
      }

      try {
        await trx.query(this.toInsertSQL());

        let history = new this.constructor._history(this);
        history.hid = await this.constructor._history.hid.default();
        history.deleted = false;
        history.updated_by = author !== undefined ? author : null;

        await trx.query(history.toInsertSQL());
      } catch (err) {
        if (removeUpdatedAt) delete this.updated_at;
        if (removeCreatedAt) delete this.created_at;

        throw err;
      }

      return true;
    } else {
      if (!this.isDirty(this.#dbTruth)) return false;

      let revertUpdatedAt = undefined;

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
      else {
        revertUpdatedAt = this.updated_at;
        this.updated_at = new Date();
      }

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

      try {
        await trx.query(this.toUpdateSQL(this.#dbTruth));

        let history = new this.constructor._history(this);
        history.hid = await this.constructor._history.hid.default();
        history.deleted = false;
        history.updated_by = author !== undefined ? author : null;

        await trx.query(history.toInsertSQL());
      } catch (err) {
        if (revertUpdatedAt !== undefined) this.updated_at = revertUpdatedAt;
        throw err;
      }

      return true;
    }
  }

  async _delete(trx, author) {
    assert(
      this.constructor._history !== undefined,
      "setUpHistory must be called before _delete"
    );
    if (author !== undefined)
      assert(uuid.validate(author), "author must be a valid UUID");

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

    this.updated_at = new Date();

    let history = new this.constructor._history(this);
    history.hid = await this.constructor._history.hid.default();
    history.deleted = true;
    history.updated_by = author !== undefined ? author : null;

    await trx.query(
      joinSqlTemplates(
        [
          sql`DELETE FROM ${this.constructor.getTableName()} WHERE "id" =`,
          sql`${this.constructor.id.toDb(this.id)}`,
        ],
        sql` `
      )
    );
    await trx.query(history.toInsertSQL());

    return true;
  }

  static async _undelete(trx, id, author) {
    assert(
      this._history !== undefined,
      "setUpHistory must be called before _undelete"
    );

    assert(uuid.validate(id), "id must be a valid UUID");

    if (author !== undefined) {
      assert(uuid.validate(author), "author must be a valid UUID");
    }

    let result = await trx.query(
      joinSqlTemplates(
        [
          sql`SELECT count(*) FROM`,
          sql`${this.getTableName()}`,
          sql`WHERE "id" =`,
          sql`${this.id.toDb(id)}`,
        ],
        sql` `
      )
    );

    if (parseInt(result.rows[0].count) > 0) return;

    result = await trx.query(
      joinSqlTemplates(
        [
          sql`SELECT * FROM`,
          sql`${this._history.getTableName()}`,
          sql`WHERE "id" =`,
          sql`${this._history.id.toDb(id)}`,
          sql`ORDER BY updated_at DESC LIMIT 1`,
        ],
        sql` `
      )
    );

    if (result.rowCount === 0) return;

    let undeleted = result.rows[0];

    delete undeleted.deleted;
    delete undeleted.hid;
    delete undeleted.updated_by;

    undeleted = new this(undeleted);

    undeleted.updated_at = new Date();
    await undeleted._save(trx, true, author);

    return undeleted;
  }
}

module.exports = HistoricScaffoldModel;
