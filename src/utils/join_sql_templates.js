"use strict";

const { sql } = require("slonik");

module.exports = (array, separator = sql``) => {
  array = array.filter((x) => x.sql !== "");
  return array.length > 0 ? sql`${sql.join(array, separator)}` : sql``;
};
