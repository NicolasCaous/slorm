"use strict";

const assert = require("assert");
const { sql } = require("slonik");

const escape = require("../utils/escape");
const isObject = require("../utils/is_object");
const isSQLTemplate = require("../utils/is_sql_template");
const joinSqlTemplates = require("../utils/join_sql_templates");

class SlormConstraint {
  constructor(args) {
    if (args === undefined) args = {};

    assert(isObject(args), "args must be an object");

    let constraintCount = 0;

    this.constraintName = args.constraintName;
    if (this.constraintName !== undefined)
      assert(
        isSQLTemplate(this.constraintName),
        "constraintName must be a slonik sql template"
      );

    this.deferrable = args.deferrable;
    if (this.deferrable !== undefined)
      assert(
        typeof this.deferrable === "boolean",
        "deferrable must be a boolean"
      );

    this.deferrableImmediate = args.deferrableImmediate;
    if (this.deferrableImmediate !== undefined)
      assert(
        typeof this.deferrableImmediate === "boolean",
        "deferrableImmediate must be a boolean"
      );

    this.check = args.check;
    if (this.check !== undefined) {
      ++constraintCount;
      assert(isSQLTemplate(this.check), "check must be a slonik sql template");
      assert(
        this.deferrable === undefined && this.deferrableImmediate === undefined,
        "check constraints cannot be marked deferrable"
      );
    }

    this.checkNoInherit =
      "checkNoInherit" in args ? args.checkNoInherit : false;
    assert(
      typeof this.checkNoInherit === "boolean",
      "checkNoInherit must be a boolean"
    );

    this.unique = args.unique;
    if (this.unique !== undefined) {
      ++constraintCount;
      assert(
        this.unique instanceof Array,
        "unique must be an array of slonik sql templates"
      );
      this.unique = this.unique.filter((x) => x.sql !== "");
      assert(this.unique.length > 0, "unique can't be an empty array");
      this.unique.forEach((uniqueColumn, i) => {
        assert(
          isSQLTemplate(uniqueColumn),
          `uniqueColumn ${i} (${uniqueColumn}) must be a slonik sql template`
        );
      });
    }

    this.primaryKey = args.primaryKey;
    if (this.primaryKey !== undefined) {
      ++constraintCount;
      assert(
        this.primaryKey instanceof Array,
        "primaryKey must be an array of slonik sql templates"
      );
      this.primaryKey = this.primaryKey.filter((x) => x.sql !== "");
      assert(this.primaryKey.length > 0, "primaryKey can't be an empty array");
      this.primaryKey.forEach((primaryKeyColumn, i) => {
        assert(
          isSQLTemplate(primaryKeyColumn),
          `primaryKeyColumn ${i} (${primaryKeyColumn}) must be a slonik sql template`
        );
      });
    }

    this.exclude = args.exclude;
    if (this.exclude !== undefined) {
      ++constraintCount;
      assert(
        this.exclude instanceof Array,
        "exclude must be an array of slonik sql templates"
      );
      this.exclude = this.exclude.filter((x) => x.sql !== "");
      assert(this.exclude.length > 0, "exclude can't be an empty array");
      this.exclude.forEach((excludeExpression, i) => {
        assert(
          isSQLTemplate(excludeExpression),
          `excludeExpression ${i} (${excludeExpression}) must be a slonik sql template`
        );
      });
    }

    this.indexMethod = args.indexMethod;
    if (this.indexMethod !== undefined)
      assert(
        isSQLTemplate(this.indexMethod),
        "indexMethod must be a slonik sql template"
      );

    this.predicate = args.predicate;
    if (this.predicate !== undefined)
      assert(
        isSQLTemplate(this.predicate),
        "predicate must be a slonik sql template"
      );

    this.foreignKey = args.foreignKey;
    if (this.foreignKey !== undefined) {
      ++constraintCount;
      assert(
        this.foreignKey instanceof Array,
        "foreignKey must be an array of slonik sql templates"
      );
      this.foreignKey = this.foreignKey.filter((x) => x.sql !== "");
      assert(this.foreignKey.length > 0, "foreignKey can't be an empty array");
      this.foreignKey.forEach((column, i) => {
        assert(
          isSQLTemplate(column),
          `column ${i} (${column}) must be a slonik sql template`
        );
      });
    }

    this.refTable = args.refTable;
    if (this.foreignKey !== undefined)
      assert(
        isSQLTemplate(this.refTable),
        "refTable must be a slonik sql template and must not be undefined"
      );

    this.refColumn = args.refColumn;
    if (this.refColumn !== undefined) {
      assert(
        this.refColumn instanceof Array,
        "refColumn must be an array of slonik sql templates"
      );
      this.refColumn = this.refColumn.filter((x) => x.sql !== "");
      assert(this.refColumn.length > 0, "refColumn can't be an empty array");
      this.refColumn.forEach((column, i) => {
        assert(
          isSQLTemplate(column),
          `column ${i} (${column}) must be a slonik sql template`
        );
      });
    }

    this.refMatch = "refMatch" in args ? args.refMatch : undefined;
    if (this.refMatch !== undefined)
      assert(
        isSQLTemplate(this.refMatch) &&
          ["MATCH FULL", "MATCH PARTIAL", "MATCH SIMPLE"].includes(
            this.refMatch.sql
          ),
        "refMatch must be a slonik sql template and can only be 'MATCH FULL', 'MATCH PARTIAL', 'MATCH SIMPLE'"
      );

    this.refOnDelete = "refOnDelete" in args ? args.refOnDelete : undefined;
    if (this.refOnDelete !== undefined)
      assert(
        isSQLTemplate(this.refOnDelete) &&
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
        isSQLTemplate(this.refOnUpdate) &&
          [
            "NO ACTION",
            "RESTRICT",
            "CASCADE",
            "SET NULL",
            "SET DEFAULT",
          ].includes(this.refOnUpdate.sql),
        "refOnUpdate must be a slonik sql template and can only be 'NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT'"
      );

    assert(
      constraintCount === 1,
      "There must be exacly one constraint defined"
    );

    this.indexParameters =
      "indexParameters" in args ? args.indexParameters : undefined;
    if (this.indexParameters !== undefined)
      assert(
        isSQLTemplate(this.indexParameters),
        "indexParameters must be a slonik sql template"
      );
  }

  /*
  https://www.postgresql.org/docs/current/sql-createtable.html

  and table_constraint is:

  [ CONSTRAINT constraint_name ]
  { CHECK ( expression ) [ NO INHERIT ] |
  UNIQUE ( column_name [, ... ] ) index_parameters |
  PRIMARY KEY ( column_name [, ... ] ) index_parameters |
  EXCLUDE [ USING index_method ] ( exclude_element WITH operator [, ... ] ) index_parameters [ WHERE ( predicate ) ] |
  FOREIGN KEY ( column_name [, ... ] ) REFERENCES reftable [ ( refcolumn [, ... ] ) ]
      [ MATCH FULL | MATCH PARTIAL | MATCH SIMPLE ] [ ON DELETE referential_action ] [ ON UPDATE referential_action ] }
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

  only UNIQUE, PRIMARY KEY, EXCLUDE and FOREIGN KEY constraints are deferrable
  only UNIQUE, PRIMARY KEY, EXCLUDE and FOREIGN KEY can be INITIALLY DEFERRED or INITIALLY IMMEDIATE

  exclude_element in an EXCLUDE constraint is:

  { column_name | ( expression ) } [ opclass ] [ ASC | DESC ] [ NULLS { FIRST | LAST } ]
  */
  toSQL(constraintName) {
    if (this.constraintName === undefined && constraintName !== undefined)
      this.constraintName = constraintName;
    return joinSqlTemplates(
      [
        sql`${
          this.constraintName !== undefined
            ? sql`CONSTRAINT ${escape(this.constraintName)}`
            : sql``
        }`,
        sql`${
          this.check !== undefined
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
          this.unique !== undefined
            ? joinSqlTemplates(
                [
                  sql`UNIQUE (`,
                  joinSqlTemplates(this.unique.map(escape), sql`, `),
                  sql`)`,
                  sql`${
                    this.indexParameters !== undefined
                      ? this.indexParameters
                      : sql``
                  }`,
                ],
                sql` `
              )
            : sql``
        }`,
        sql`${
          this.primaryKey !== undefined
            ? joinSqlTemplates(
                [
                  sql`PRIMARY KEY (`,
                  joinSqlTemplates(this.primaryKey.map(escape), sql`, `),
                  sql`)`,
                  sql`${
                    this.indexParameters !== undefined
                      ? this.indexParameters
                      : sql``
                  }`,
                ],
                sql` `
              )
            : sql``
        }`,
        sql`${
          this.exclude !== undefined
            ? joinSqlTemplates(
                [
                  sql`EXCLUDE`,
                  sql`${
                    this.indexMethod !== undefined
                      ? sql`USING ${this.indexMethod}`
                      : sql``
                  }`,
                  sql`(`,
                  joinSqlTemplates(this.exclude, sql`, `),
                  sql`)`,
                  sql`${
                    this.indexParameters !== undefined
                      ? this.indexParameters
                      : sql``
                  }`,
                  sql`${
                    this.predicate !== undefined
                      ? sql`WHERE ( ${this.predicate} )`
                      : sql``
                  }`,
                ],
                sql` `
              )
            : sql``
        }`,
        sql`${
          this.foreignKey !== undefined
            ? joinSqlTemplates(
                [
                  sql`FOREIGN KEY (`,
                  joinSqlTemplates(this.foreignKey.map(escape), sql`, `),
                  sql`) REFERENCES ${escape(this.refTable)}`,
                  sql`${
                    this.refColumn !== undefined
                      ? joinSqlTemplates(
                          [
                            sql`(`,
                            joinSqlTemplates(
                              this.refColumn.map(escape),
                              sql`, `
                            ),
                            sql`)`,
                          ],
                          sql` `
                        )
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
                ],
                sql` `
              )
            : sql``
        }`,
        sql`${
          this.deferrable !== undefined
            ? sql`${this.deferrable ? sql`DEFERRABLE` : sql`NOT DEFERRABLE`}`
            : sql``
        }`,
        sql`${
          this.deferrableImmediate !== undefined
            ? sql`${
                this.deferrableImmediate
                  ? sql`INITIALLY IMMEDIATE`
                  : sql`INITIALLY DEFERRED`
              }`
            : sql``
        }`,
      ],
      sql` `
    );
  }
}

module.exports = SlormConstraint;
