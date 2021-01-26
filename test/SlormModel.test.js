"use strict";

const SlormConstraint = require("../src/constraints/SlormConstraint");
const SlormModel = require("../src/SlormModel");
const VarCharField = require("../src/fields/VarCharField");

const { sql } = require("slonik");

describe("SlormModel", () => {
  describe("constructor", () => {
    it("should throw when instantiated with something other than an object", () => {
      let Test = class Test extends SlormModel {};

      expect(() => new Test(null)).to.throw("args must be an object");
    });

    it("should not throw when instantiated", () => {
      let Test = class Test extends SlormModel {};

      expect(() => new Test()).to.not.throw();
    });

    it("should assign args", () => {
      let Test = class Test extends SlormModel {
        static dummy = new VarCharField();
      };

      expect(new Test({ dummy: "abc" }).dummy).to.be.equal("abc");
    });

    it("should assign args with columnName", () => {
      let Test = class Test extends SlormModel {
        static dummy = new VarCharField({ columnName: sql`notDummy` });
      };

      expect(new Test({ notDummy: "abc" }).dummy).to.be.equal("abc");
    });

    it("should throw if args don't exist", () => {
      let Test = class Test extends SlormModel {};

      expect(() => new Test({ dummy: "abc" })).to.throw(
        "dummy is not a field in class Test extends SlormModel {}"
      );
    });
  });

  describe("getTableName", () => {
    it("should have the class name as the table name if no table name is specified", () => {
      let Test = class Test extends SlormModel {};

      expect(Test.getTableName()).to.deep.equal(sql`"Test"`);
    });

    it("should have the class name as the table name defined", () => {
      let Test = class Test extends SlormModel {
        static tableName = sql`dummy`;
      };

      expect(Test.getTableName()).to.deep.equal(sql`"dummy"`);
    });

    it("should throw if class name is not slonik template", () => {
      let Test = class Test extends SlormModel {
        static tableName = "dummy";
      };

      expect(() => Test.getTableName()).to.throw(
        "tableName must be a slonik sql template"
      );
    });

    it("should throw if class name is not slonik template", () => {
      let Test = class Test extends SlormModel {
        static tableName = { type: "dummy" };
      };

      expect(() => Test.getTableName()).to.throw(
        "tableName must be a slonik sql template"
      );
    });

    it("should throw if class name is not slonik template", () => {
      let f = () => {};
      f.type = "SLONIK_TOKEN_SQL";

      let Test = class Test extends SlormModel {
        static tableName = f;
      };

      expect(() => Test.getTableName()).to.throw(
        "tableName must be a slonik sql template"
      );
    });
  });

  describe("toSQL", () => {
    it("should create a table without columns", () => {
      let Test = class Test extends SlormModel {};

      expect(Test.toSQL()).to.deep.equal([sql`CREATE TABLE "Test" ( )`]);
    });

    it("should fail if args it not an object", () => {
      let Test = class Test extends SlormModel {};

      expect(() => Test.toSQL(() => {})).to.throw("args must be an object");
    });

    it("should create a temporary table", () => {
      let Test = class Test extends SlormModel {};

      expect(Test.toSQL({ temporary: true })).to.deep.equal([
        sql`CREATE TEMPORARY TABLE "Test" ( )`,
      ]);
    });

    it("should create a unlogged table", () => {
      let Test = class Test extends SlormModel {};

      expect(Test.toSQL({ temporary: true, unlogged: true })).to.deep.equal([
        sql`CREATE TEMPORARY UNLOGGED TABLE "Test" ( )`,
      ]);
    });

    it("should create a table ifNotExists", () => {
      let Test = class Test extends SlormModel {};

      expect(Test.toSQL({ ifNotExists: true })).to.deep.equal([
        sql`CREATE TABLE IF NOT EXISTS "Test" ( )`,
      ]);
    });

    it("should fail if temporary is not a boolean", () => {
      let Test = class Test extends SlormModel {};

      expect(() => Test.toSQL({ temporary: 1 })).to.throw(
        "temporary must be a boolean"
      );
    });

    it("should fail if unlogged is not a boolean", () => {
      let Test = class Test extends SlormModel {};

      expect(() => Test.toSQL({ unlogged: 1 })).to.throw(
        "unlogged must be a boolean"
      );
    });

    it("should fail if ifNotExists is not a boolean", () => {
      let Test = class Test extends SlormModel {};

      expect(() => Test.toSQL({ ifNotExists: 1 })).to.throw(
        "ifNotExists must be a boolean"
      );
    });

    it("should create table with columns", () => {
      let Test = class Test extends SlormModel {
        static dummy = new VarCharField();
      };

      expect(Test.toSQL({ ifNotExists: true })).to.deep.equal([
        sql`CREATE TABLE IF NOT EXISTS "Test" ( "dummy" varchar(255) NOT NULL )`,
      ]);
    });

    it("should create table with columns and constraints", () => {
      let Test = class Test extends SlormModel {
        static dummy = new VarCharField();

        static dummy2 = new SlormConstraint({ check: sql`dummy` });
      };

      expect(Test.toSQL({ ifNotExists: true })).to.deep.equal([
        sql`CREATE TABLE IF NOT EXISTS "Test" ( "dummy" varchar(255) NOT NULL, CONSTRAINT "dummy2" CHECK ( dummy ) )`,
      ]);
    });

    it("should create table with multiple columns", () => {
      let Test = class Test extends SlormModel {
        static dummy = new VarCharField();
        static dummy2 = new VarCharField();
      };

      expect(Test.toSQL({ ifNotExists: true })).to.deep.equal([
        sql`CREATE TABLE IF NOT EXISTS "Test" ( "dummy" varchar(255) NOT NULL, "dummy2" varchar(255) NOT NULL )`,
      ]);
    });

    it("should create table with multiple constraints", () => {
      let Test = class Test extends SlormModel {
        static dummy = new SlormConstraint({
          constraintName: sql`dummy`,
          check: sql`dummy`,
        });
        static dummy2 = new SlormConstraint({
          constraintName: sql`dummy2`,
          check: sql`dummy2`,
        });
      };

      expect(Test.toSQL({ ifNotExists: true })).to.deep.equal([
        sql`CREATE TABLE IF NOT EXISTS "Test" ( CONSTRAINT "dummy" CHECK ( dummy ), CONSTRAINT "dummy2" CHECK ( dummy2 ) )`,
      ]);
    });
  });
});
