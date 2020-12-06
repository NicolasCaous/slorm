"use strict";

const assert = require("assert");
const { sql } = require("slonik");

const escape = require("../utils/escape");
const joinSqlTemplates = require("../utils/join_sql_templates");

class SlormField {
  constructor(args) {
    assert(typeof args === "object", "args must be an object");

    this.columnName = "columnName" in args ? args.columnName : undefined;
    if (this.columnName !== undefined) {
      assert(
        typeof this.columnName === "object" &&
          "type" in this.columnName &&
          this.columnName.type === "SLONIK_TOKEN_SQL",
        "columnName must be a slonik sql template and must not be undefined"
      );
      this.columnName = escape(this.columnName);
    }

    this.sqlType = "sqlType" in args ? args.sqlType : undefined;
    assert(
      this.sqlType !== undefined &&
        typeof this.sqlType === "object" &&
        "type" in this.sqlType &&
        this.sqlType.type === "SLONIK_TOKEN_SQL",
      "Slorm fields must have a sqlType attribute that is a slonik sql template"
    );

    this.collation = "collation" in args ? args.collation : undefined;
    if (this.collation !== undefined)
      assert(
        typeof this.collation === "object" &&
          "type" in this.collation &&
          this.collation.type === "SLONIK_TOKEN_SQL",
        "collation must be a slonik sql template"
      );

    this.constraintName =
      "constraintName" in args ? args.constraintName : undefined;
    if (this.constraintName !== undefined)
      assert(
        typeof this.constraintName === "object" &&
          "type" in this.constraintName &&
          this.constraintName.type === "SLONIK_TOKEN_SQL",
        "constraintName must be a slonik sql template and must not be undefined"
      );

    this.null = "null" in args ? args.null : false;
    assert(typeof this.null === "boolean", "null must be a boolean");

    this.check = "check" in args ? args.check : undefined;
    if (this.check !== undefined)
      assert(
        typeof this.check === "object" &&
          "type" in this.check &&
          this.check.type === "SLONIK_TOKEN_SQL",
        "check must be a slonik sql template"
      );

    this.checkNoInherit =
      "checkNoInherit" in args ? args.checkNoInherit : false;
    assert(
      typeof this.checkNoInherit === "boolean",
      "checkNoInherit must be a boolean"
    );

    this.default = "default" in args ? args.default : undefined;
    if (this.default !== undefined)
      assert(
        (typeof this.default === "object" &&
          "type" in this.default &&
          this.default.type === "SLONIK_TOKEN_SQL") ||
          typeof this.default === "function",
        "default must be a slonik sql template or a function"
      );

    this.generatedStored =
      "generatedStored" in args ? args.generatedStored : undefined;
    if (this.generatedStored !== undefined)
      assert(
        typeof this.generatedStored === "object" &&
          "type" in this.generatedStored &&
          this.generatedStored.type === "SLONIK_TOKEN_SQL",
        "generatedStored must be a slonik sql template"
      );

    this.generatedAsIdentity =
      "generatedAsIdentity" in args ? args.generatedAsIdentity : undefined;
    if (this.generatedAsIdentity !== undefined)
      assert(
        typeof this.generatedAsIdentity === "object" &&
          "type" in this.generatedAsIdentity &&
          this.generatedAsIdentity.type === "SLONIK_TOKEN_SQL" &&
          ["ALWAYS", "BY DEFAULT"].includes(this.generatedAsIdentity.sql),
        "generatedAsIdentity must be a slonik sql template and can only be 'ALWAYS' or 'BY DEFAULT'"
      );

    this.generatedAsIdentitySequenceOptions =
      "generatedAsIdentitySequenceOptions" in args
        ? args.generatedAsIdentitySequenceOptions
        : undefined;
    if (this.generatedAsIdentitySequenceOptions !== undefined)
      assert(
        typeof this.generatedAsIdentitySequenceOptions === "object" &&
          "type" in this.generatedAsIdentitySequenceOptions &&
          this.generatedAsIdentitySequenceOptions.type === "SLONIK_TOKEN_SQL",
        "generatedAsIdentitySequenceOptions must be a slonik sql template"
      );

    assert(
      (this.generatedStored === undefined &&
        this.generatedAsIdentity === undefined) ||
        ((this.default === undefined || typeof this.default === "function") &&
          this.generatedAsIdentity === undefined) ||
        ((this.default === undefined || typeof this.default === "function") &&
          this.generatedStored === undefined),
      "default, generatedStored and generatedAsIdentity can only be defined alone"
    );

    this.unique = "unique" in args ? args.unique : false;
    assert(
      typeof this.unique === "boolean" ||
        (typeof this.unique === "object" &&
          "type" in this.unique &&
          this.unique.type === "SLONIK_TOKEN_SQL"),
      "unique must be a boolean or a slonik sql template"
    );

    this.uniqueDeferrable =
      "uniqueDeferrable" in args ? args.uniqueDeferrable : undefined;
    if (this.uniqueDeferrable !== undefined)
      assert(
        typeof this.uniqueDeferrable === "boolean",
        "uniqueDeferrable must be a boolean"
      );

    this.uniqueDeferrableImmediate =
      "uniqueDeferrableImmediate" in args
        ? args.uniqueDeferrableImmediate
        : undefined;
    if (this.uniqueDeferrableImmediate !== undefined)
      assert(
        typeof this.uniqueDeferrableImmediate === "boolean",
        "uniqueDeferrableImmediate must be a boolean"
      );

    this.primaryKey = "primaryKey" in args ? args.primaryKey : false;
    assert(
      typeof this.primaryKey === "boolean" ||
        (typeof this.primaryKey === "object" &&
          "type" in this.primaryKey &&
          this.primaryKey.type === "SLONIK_TOKEN_SQL"),
      "primaryKey must be a boolean or a slonik sql template"
    );

    this.primaryKeyDeferrable =
      "primaryKeyDeferrable" in args ? args.primaryKeyDeferrable : undefined;
    if (this.primaryKeyDeferrable !== undefined)
      assert(
        typeof this.primaryKeyDeferrable === "boolean",
        "primaryKeyDeferrable must be a boolean"
      );

    this.primaryKeyDeferrableImmediate =
      "primaryKeyDeferrableImmediate" in args
        ? args.primaryKeyDeferrableImmediate
        : undefined;
    if (this.primaryKeyDeferrableImmediate !== undefined)
      assert(
        typeof this.primaryKeyDeferrableImmediate === "boolean",
        "primaryKeyDeferrableImmediate must be a boolean"
      );

    this.refTable = "refTable" in args ? args.refTable : undefined;
    if (this.refTable !== undefined)
      assert(
        typeof this.refTable === "object" &&
          "type" in this.refTable &&
          this.refTable.type === "SLONIK_TOKEN_SQL",
        "refTable must be a slonik sql template"
      );

    this.refColumn = "refColumn" in args ? args.refColumn : undefined;
    if (this.refColumn !== undefined)
      assert(
        typeof this.refColumn === "object" &&
          "type" in this.refColumn &&
          this.refColumn.type === "SLONIK_TOKEN_SQL",
        "refColumn must be a slonik sql template"
      );

    this.refMatch = "refMatch" in args ? args.refMatch : undefined;
    if (this.refMatch !== undefined)
      assert(
        typeof this.refMatch === "object" &&
          "type" in this.refMatch &&
          this.refMatch.type === "SLONIK_TOKEN_SQL" &&
          ["MATCH FULL", "MATCH PARTIAL", "MATCH SIMPLE"].includes(
            this.refMatch.sql
          ),
        "refMatch must be a slonik sql template and can only be 'MATCH FULL', 'MATCH PARTIAL', 'MATCH SIMPLE'"
      );

    this.refOnDelete = "refOnDelete" in args ? args.refOnDelete : undefined;
    if (this.refOnDelete !== undefined)
      assert(
        typeof this.refOnDelete === "object" &&
          "type" in this.refOnDelete &&
          this.refOnDelete.type === "SLONIK_TOKEN_SQL" &&
          [
            "NO ACTION",
            "RESTRICT",
            "CASCADE",
            "SET NULL",
            "SET DEFAULT",
          ].includes(this.refOnDelete.sql),
        "refOnDelete must be a slonik sql template and can only be 'NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT'"
      );

    this.refOnUpdate = "refOnUpdate" in args ? args.refOnUpdate : undefined;
    if (this.refOnUpdate !== undefined)
      assert(
        typeof this.refOnUpdate === "object" &&
          "type" in this.refOnUpdate &&
          this.refOnUpdate.type === "SLONIK_TOKEN_SQL" &&
          [
            "NO ACTION",
            "RESTRICT",
            "CASCADE",
            "SET NULL",
            "SET DEFAULT",
          ].includes(this.refOnUpdate.sql),
        "refOnUpdate must be a slonik sql template and can only be 'NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT'"
      );

    this.refDeferrable =
      "refDeferrable" in args ? args.refDeferrable : undefined;
    if (this.refDeferrable !== undefined)
      assert(
        typeof this.refDeferrable === "boolean",
        "refDeferrable must be a boolean"
      );

    this.refDeferrableImmediate =
      "refDeferrableImmediate" in args
        ? args.refDeferrableImmediate
        : undefined;
    if (this.refDeferrableImmediate !== undefined)
      assert(
        typeof this.refDeferrableImmediate === "boolean",
        "refDeferrableImmediate must be a boolean"
      );
  }

  /*
  https://www.postgresql.org/docs/current/sql-createtable.html

  { column_name data_type [ COLLATE collation ] [ column_constraint [ ... ] ] }

  where column_constraint is:

  [ CONSTRAINT constraint_name ]
  { NOT NULL |
    NULL |
    CHECK ( expression ) [ NO INHERIT ] |
    DEFAULT default_expr |
    GENERATED ALWAYS AS ( generation_expr ) STORED |
    GENERATED { ALWAYS | BY DEFAULT } AS IDENTITY [ ( sequence_options ) ] |
    UNIQUE index_parameters |
    PRIMARY KEY index_parameters |
    REFERENCES reftable [ ( refcolumn ) ] [ MATCH FULL | MATCH PARTIAL | MATCH SIMPLE ]
      [ ON DELETE referential_action ] [ ON UPDATE referential_action ] }
  [ DEFERRABLE | NOT DEFERRABLE ] [ INITIALLY DEFERRED | INITIALLY IMMEDIATE ]

  index_parameters in UNIQUE, PRIMARY KEY, and EXCLUDE constraints are:

  [ WITH ( storage_parameter [= value] [, ... ] ) ]
  [ USING INDEX TABLESPACE tablespace_name ]

  referential_action:

  NO ACTION
  RESTRICT
  CASCADE
  SET NULL
  SET DEFAULT

  only UNIQUE, PRIMARY KEY, and REFERENCES constraints are deferrable
  only UNIQUE, PRIMARY KEY, and REFERENCES can be INITIALLY DEFERRED or INITIALLY IMMEDIATE
  */
  toSQL(columnName) {
    if (this.columnName !== undefined) columnName = this.columnName;

    return joinSqlTemplates(
      [
        sql`${escape(columnName)}`,
        sql`${this.sqlType}`,
        sql`${
          this.collation !== undefined ? sql`COLLATE ${this.collation}` : sql``
        }`,
        sql`${
          this.constraintName !== undefined
            ? sql`CONSTRAINT ${escape(this.constraintName)}`
            : sql``
        }`,
        sql`${this.null ? sql`NULL` : sql`NOT NULL`}`,
        sql`${
          this.check
            ? joinSqlTemplates(
                [
                  sql`CHECK ( ${this.check} )`,
                  sql`${this.checkNoInherit ? sql`NO INHERIT` : sql``}`,
                ],
                sql` `
              )
            : sql``
        }`,
        sql`${
          typeof this.default === "object"
            ? sql`DEFAULT ${this.default}`
            : sql``
        }`,
        sql`${
          this.generatedStored !== undefined
            ? sql`GENERATED ALWAYS AS ( ${this.generatedStored} ) STORED`
            : sql``
        }`,
        sql`${
          this.generatedAsIdentity !== undefined
            ? joinSqlTemplates(
                [
                  sql`GENERATED ${this.generatedAsIdentity} AS IDENTITY`,
                  sql`${
                    this.generatedAsIdentitySequenceOptions !== undefined
                      ? sql`( ${this.generatedAsIdentitySequenceOptions} )`
                      : sql``
                  }`,
                ],
                sql` `
              )
            : sql``
        }`,
        sql`${
          this.unique !== false
            ? joinSqlTemplates(
                [
                  sql`UNIQUE`,
                  sql`${
                    typeof this.unique === "object"
                      ? sql`${this.unique}`
                      : sql``
                  }`,
                  sql`${
                    this.uniqueDeferrable !== undefined
                      ? sql`${
                          this.uniqueDeferrable
                            ? sql`DEFERRABLE`
                            : sql`NOT DEFERRABLE`
                        }`
                      : sql``
                  }`,
                  sql`${
                    this.uniqueDeferrableImmediate !== undefined
                      ? sql`${
                          this.uniqueDeferrableImmediate
                            ? sql`INITIALLY IMMEDIATE`
                            : sql`INITIALLY DEFERRED`
                        }`
                      : sql``
                  }`,
                ],
                sql` `
              )
            : sql``
        }`,
        sql`${
          this.primaryKey !== false
            ? joinSqlTemplates(
                [
                  sql`PRIMARY KEY`,
                  sql`${
                    typeof this.primaryKey === "object"
                      ? sql`${this.primaryKey}`
                      : sql``
                  }`,
                  sql`${
                    this.primaryKeyDeferrable !== undefined
                      ? sql`${
                          this.primaryKeyDeferrable
                            ? sql`DEFERRABLE`
                            : sql`NOT DEFERRABLE`
                        }`
                      : sql``
                  }`,
                  sql`${
                    this.primaryKeyDeferrableImmediate !== undefined
                      ? sql`${
                          this.primaryKeyDeferrableImmediate
                            ? sql`INITIALLY IMMEDIATE`
                            : sql`INITIALLY DEFERRED`
                        }`
                      : sql``
                  }`,
                ],
                sql` `
              )
            : sql``
        }`,
        sql`${
          this.refTable !== undefined
            ? joinSqlTemplates(
                [
                  sql`REFERENCES ${escape(this.refTable)}`,
                  sql`${
                    this.refColumn !== undefined
                      ? sql`( ${escape(this.refColumn)} )`
                      : sql``
                  }`,
                  sql`${
                    this.refMatch !== undefined ? sql`${this.refMatch}` : sql``
                  }`,
                  sql`${
                    this.refOnDelete !== undefined
                      ? sql`ON DELETE ${this.refOnDelete}`
                      : sql``
                  }`,
                  sql`${
                    this.refOnUpdate !== undefined
                      ? sql`ON UPDATE ${this.refOnUpdate}`
                      : sql``
                  }`,
                  sql`${
                    this.refDeferrable !== undefined
                      ? sql`${
                          this.refDeferrable
                            ? sql`DEFERRABLE`
                            : sql`NOT DEFERRABLE`
                        }`
                      : sql``
                  }`,
                  sql`${
                    this.refDeferrableImmediate !== undefined
                      ? sql`${
                          this.refDeferrableImmediate
                            ? sql`INITIALLY IMMEDIATE`
                            : sql`INITIALLY DEFERRED`
                        }`
                      : sql``
                  }`,
                ],
                sql` `
              )
            : sql``
        }`,
      ],
      sql` `
    );
  }

  fromDb(value) {
    return value;
  }

  toDb(value) {
    return sql`${value}`;
  }

  isDifferent(a, b) {
    return a !== b;
  }

  toHistory() {
    return new this.constructor({
      ...this,
      check: undefined,
      default: undefined,
      generatedStored: undefined,
      generatedAsIdentity: undefined,
      unique: false,
      primaryKey: false,
      refTable: undefined,
    });
  }
}

module.exports = SlormField;
