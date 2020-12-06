"use strict";

const { sql } = require("slonik");

exports.startTransaction = async (slonik, callback, isolationLevel) => {
  return await slonik.connect(
    async (conn) =>
      await conn.transaction(async (trx) => {
        if (isolationLevel === undefined) isolationLevel = sql`SERIALIZABLE`;
        await trx.query(sql`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);

        await callback(trx);
      })
  );
};

exports.SERIALIZABLE = sql`SERIALIZABLE`;
exports.REPEATABLE_READ = sql`REPEATABLE READ`;
exports.READ_COMMITTED = sql`READ COMMITTED`;
exports.READ_UNCOMMITTED = sql`READ UNCOMMITTED`;
