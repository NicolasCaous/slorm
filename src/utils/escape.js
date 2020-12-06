"use strict";

const { sql } = require("slonik");

module.exports = (template) => {
  return template.sql[0] !== '"' || template.sql.substr(-1) !== '"'
    ? sql`${sql.identifier([template.sql])}`
    : template;
};
