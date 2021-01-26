"use strict";

const SlormConstraint = require("../../src/constraints/SlormConstraint");

const { sql } = require("slonik");

describe("SlormConstraint", () => {
  describe("constructor", () => {
    it("should throw when instantiated with null", () => {
      expect(() => new SlormConstraint(null)).to.throw(
        "args must be an object"
      );
    });

    it("should throw when instantiated with nothing", () => {
      expect(() => new SlormConstraint()).to.throw(
        "There must be exacly one constraint defined"
      );
    });

    it("should throw when instantiated with []", () => {
      expect(() => new SlormConstraint([])).to.throw("args must be an object");
    });

    it("should throw when constraintName is string", () => {
      expect(
        () =>
          new SlormConstraint({ check: sql`dummy`, constraintName: "dummy" })
      ).to.throw("constraintName must be a slonik sql template");
    });

    it("should set constraintName when a valid constraintName is passed", () => {
      expect(
        new SlormConstraint({ check: sql`dummy`, constraintName: sql`dummy` })
          .constraintName
      ).to.deep.include(sql`dummy`);
    });

    it("should throw if check is string", () => {
      expect(() => new SlormConstraint({ check: "dummy" })).to.throw(
        "check must be a slonik sql template"
      );
    });

    it("should set deferrable when deferrable is passed", () => {
      expect(
        new SlormConstraint({ unique: [sql`dummy`], deferrable: true })
          .deferrable
      ).to.equal(true);
    });

    it("should throw if deferrable is not a boolean", () => {
      expect(
        () => new SlormConstraint({ unique: "dummy", deferrable: "dummy" })
      ).to.throw("deferrable must be a boolean");
    });

    it("should set deferrableImmediate when deferrableImmediate is passed", () => {
      expect(
        new SlormConstraint({
          unique: [sql`dummy`],
          deferrable: true,
          deferrableImmediate: true,
        }).deferrableImmediate
      ).to.equal(true);
    });

    it("should throw if deferrableImmediate is not a boolean", () => {
      expect(
        () =>
          new SlormConstraint({ unique: "dummy", deferrableImmediate: "dummy" })
      ).to.throw("deferrableImmediate must be a boolean");
    });

    it("should throw if check is marked as deferrable", () => {
      expect(
        () => new SlormConstraint({ check: sql`dummy`, deferrable: true })
      ).to.throw("check constraints cannot be marked deferrable");
    });

    it("should throw if check is marked as deferrableImmediate", () => {
      expect(
        () =>
          new SlormConstraint({ check: sql`dummy`, deferrableImmediate: true })
      ).to.throw("check constraints cannot be marked deferrable");
    });

    it("should throw if check is not an object", () => {
      expect(() => new SlormConstraint({ check: "dummy" })).to.throw(
        "check must be a slonik sql template"
      );
    });

    it("should throw if checkNoInherit is not a boolean", () => {
      expect(
        () =>
          new SlormConstraint({ check: sql`dummy`, checkNoInherit: "dummy" })
      ).to.throw("checkNoInherit must be a boolean");
    });

    it("should set checkNoInherit when checkNoInherit is passed", () => {
      expect(
        new SlormConstraint({
          check: sql`dummy`,
          checkNoInherit: true,
        }).checkNoInherit
      ).to.equal(true);
    });

    it("should throw when instantiated with multiple constraints", () => {
      expect(
        () =>
          new SlormConstraint({
            unique: [sql`dummy`],
            primaryKey: [sql`dummy`],
            exclude: [sql`dummy`],
          })
      ).to.throw("There must be exacly one constraint defined");
    });

    it("should throw if unique is not an array", () => {
      expect(() => new SlormConstraint({ unique: {} })).to.throw(
        "unique must be an array of slonik sql templates"
      );
    });

    it("should throw if unique length is 0", () => {
      expect(() => new SlormConstraint({ unique: [] })).to.throw(
        "unique can't be an empty array"
      );
    });

    it("should throw if unique length is 0", () => {
      expect(() => new SlormConstraint({ unique: [sql``] })).to.throw(
        "unique can't be an empty array"
      );
    });

    it("should throw if unique is not an array of slonik sql templates", () => {
      expect(() => new SlormConstraint({ unique: ["dummy"] })).to.throw(
        "uniqueColumn 0 (dummy) must be a slonik sql template"
      );
    });

    it("should throw when instantiated with multiple constraints", () => {
      expect(
        () =>
          new SlormConstraint({
            primaryKey: [sql`dummy`],
            unique: [sql`dummy`],
            exclude: [sql`dummy`],
          })
      ).to.throw("There must be exacly one constraint defined");
    });

    it("should throw if primaryKey is not an array", () => {
      expect(() => new SlormConstraint({ primaryKey: {} })).to.throw(
        "primaryKey must be an array of slonik sql templates"
      );
    });

    it("should throw if primaryKey length is 0", () => {
      expect(() => new SlormConstraint({ primaryKey: [] })).to.throw(
        "primaryKey can't be an empty array"
      );
    });

    it("should throw if primaryKey length is 0", () => {
      expect(() => new SlormConstraint({ primaryKey: [sql``] })).to.throw(
        "primaryKey can't be an empty array"
      );
    });

    it("should throw if primaryKey is not an array of slonik sql templates", () => {
      expect(() => new SlormConstraint({ primaryKey: ["dummy"] })).to.throw(
        "primaryKeyColumn 0 (dummy) must be a slonik sql template"
      );
    });

    it("should throw when instantiated with multiple constraints", () => {
      expect(
        () =>
          new SlormConstraint({
            exclude: [sql`dummy`],
            unique: [sql`dummy`],
            primaryKey: [sql`dummy`],
          })
      ).to.throw("There must be exacly one constraint defined");
    });

    it("should throw if exclude is not an array", () => {
      expect(() => new SlormConstraint({ exclude: {} })).to.throw(
        "exclude must be an array of slonik sql templates"
      );
    });

    it("should throw if exclude length is 0", () => {
      expect(() => new SlormConstraint({ exclude: [] })).to.throw(
        "exclude can't be an empty array"
      );
    });

    it("should throw if exclude length is 0", () => {
      expect(() => new SlormConstraint({ exclude: [sql``] })).to.throw(
        "exclude can't be an empty array"
      );
    });

    it("should throw if exclude is not an array of slonik sql templates", () => {
      expect(() => new SlormConstraint({ exclude: ["dummy"] })).to.throw(
        "excludeExpression 0 (dummy) must be a slonik sql template"
      );
    });

    it("should throw if indexMethod is not a slonik sql template", () => {
      expect(
        () =>
          new SlormConstraint({ exclude: [sql`dummy`], indexMethod: "dummy" })
      ).to.throw("indexMethod must be a slonik sql template");
    });

    it("should throw if predicate is not a slonik sql template", () => {
      expect(
        () => new SlormConstraint({ exclude: [sql`dummy`], predicate: "dummy" })
      ).to.throw("predicate must be a slonik sql template");
    });

    it("should throw when instantiated with multiple constraints", () => {
      expect(
        () =>
          new SlormConstraint({
            foreignKey: [sql`dummy`],
            refTable: sql`dummy`,
            unique: [sql`dummy`],
            exclude: [sql`dummy`],
          })
      ).to.throw("There must be exacly one constraint defined");
    });

    it("should throw when instantiated foreignKey without refTable", () => {
      expect(
        () =>
          new SlormConstraint({
            foreignKey: [sql`dummy`],
            unique: [sql`dummy`],
            exclude: [sql`dummy`],
          })
      ).to.throw(
        "refTable must be a slonik sql template and must not be undefined"
      );
    });

    it("should throw if foreignKey is not an array", () => {
      expect(() => new SlormConstraint({ foreignKey: {} })).to.throw(
        "foreignKey must be an array of slonik sql templates"
      );
    });

    it("should throw if foreignKey length is 0", () => {
      expect(() => new SlormConstraint({ foreignKey: [] })).to.throw(
        "foreignKey can't be an empty array"
      );
    });

    it("should throw if foreignKey length is 0", () => {
      expect(() => new SlormConstraint({ foreignKey: [sql``] })).to.throw(
        "foreignKey can't be an empty array"
      );
    });

    it("should throw if foreignKey is not an array of slonik sql templates", () => {
      expect(() => new SlormConstraint({ foreignKey: ["dummy"] })).to.throw(
        "column 0 (dummy) must be a slonik sql template"
      );
    });

    it("should throw when refColumn", () => {
      expect(
        () =>
          new SlormConstraint({
            foreignKey: [sql`dummy`],
            refTable: sql`dummy`,
            refColumn: [],
          })
      ).to.throw("refColumn can't be an empty array");
    });

    it("should throw when refColumn is an empty array", () => {
      expect(
        () =>
          new SlormConstraint({
            foreignKey: [sql`dummy`],
            refTable: sql`dummy`,
            refColumn: [],
          })
      ).to.throw("refColumn can't be an empty array");
    });

    it("should throw when refColumn is an object", () => {
      expect(
        () =>
          new SlormConstraint({
            foreignKey: [sql`dummy`],
            refTable: sql`dummy`,
            refColumn: {},
          })
      ).to.throw("refColumn must be an array of slonik sql templates");
    });

    it("should throw when refColumn is an array of strings", () => {
      expect(
        () =>
          new SlormConstraint({
            foreignKey: [sql`dummy`],
            refTable: sql`dummy`,
            refColumn: ["dummy"],
          })
      ).to.throw("column 0 (dummy) must be a slonik sql template");
    });

    it("should throw when refColumn is an array of empty slonik sql templates", () => {
      expect(
        () =>
          new SlormConstraint({
            foreignKey: [sql`dummy`],
            refTable: sql`dummy`,
            refColumn: [sql``],
          })
      ).to.throw("refColumn can't be an empty array");
    });
  });

  describe("toSQL", () => {
    it("should set constraintName when a valid constraintName is passed", () => {
      expect(
        new SlormConstraint({
          check: sql`dummy`,
          constraintName: sql`dummy`,
        }).toSQL()
      ).to.deep.include(sql`CONSTRAINT "dummy" CHECK ( dummy )`);
    });

    it("should not fail when constrintName is empty", () => {
      expect(
        new SlormConstraint({
          check: sql`dummy`,
        }).toSQL()
      ).to.deep.include(sql`CHECK ( dummy )`);
    });
  });
});
