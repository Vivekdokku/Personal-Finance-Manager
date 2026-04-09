const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "helpdb",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Secure@123",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Function to test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Database connection successful");
    client.release();
    return true;
  } catch (err) {
    console.error("Database connection failed:", err.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
};
