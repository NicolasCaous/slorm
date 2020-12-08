"use strict";

const { sql } = require("slonik");

module.exports = (array, separator = sql``) => {
  array = array.filter((x) => x.sql !== "");
  return array.length > 0
    ? array.reduce(
        (accumulator, currentValue) =>
          sql`${accumulator}${separator}${currentValue}`
      )
    : sql``;
};
