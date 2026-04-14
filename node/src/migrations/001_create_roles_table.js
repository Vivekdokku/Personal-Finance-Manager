exports.up = function (knex) {
  return knex.schema.createTable("roles", function (table) {
    table.integer("id").primary();
    table.string("name", 50).unique().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("roles");
};
