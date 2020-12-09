"use strict";

const SlormModel = require("../src/SlormModel");

const { sql } = require("slonik");

describe("SlormModel", () => {
  it("should have the class name as the table name if no table name is specified", () => {
    let Test = class Test extends SlormModel {};

    expect(Test.getTableName()).to.deep.equal(sql`"Test"`);
  });
});
