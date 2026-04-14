exports.up = function (knex) {
  return knex.schema.createTable("users", function (table) {
    table.integer("id").primary();
    table.string("email", 255).unique().notNullable();
    table.string("password", 255).notNullable();
    table.integer("roleid").references("id").inTable("roles");
    table.string("status", 20).defaultTo("active");
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};
