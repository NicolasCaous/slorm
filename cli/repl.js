global.uuid = require("uuid");
global.slonik = require("slonik");
global.sql = slonik.sql;
global.pool = slonik.createPool(
  "postgresql://postgres:postgres@localhost:5432/slorm",
  {
    maximumPoolSize: 10,
  }
);

global.slorm = require("../src");

for (let attr in global.slorm) {
  global[attr] = global.slorm[attr];
}
