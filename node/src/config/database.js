const knex = require("knex");
const config = require("../../knexfile");

const environment = process.env.NODE_ENV || "development";
const db = knex(config[environment]);

// Test database connection
const testConnection = async () => {
  try {
    await db.raw("SELECT 1");
    console.log("Database connection successful");
    return true;
  } catch (err) {
    console.error("Database connection failed:", err.message);
    return false;
  }
};

module.exports = {
  db,
  testConnection,
};
