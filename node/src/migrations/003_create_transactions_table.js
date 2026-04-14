exports.up = function (knex) {
  return knex.schema.createTable("transactions", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .integer("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.decimal("amount", 12, 2).notNullable();
    table.string("category", 100).notNullable();
    table.text("description");
    table.text("notes");
    table.date("transaction_date").notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index("user_id");
    table.index("transaction_date");
    table.index("category");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("transactions");
};
