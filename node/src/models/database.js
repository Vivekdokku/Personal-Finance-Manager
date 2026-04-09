const { pool } = require("../config/database");

class Database {
  static async query(text, params) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log("Executed query", { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

  static async getClient() {
    return await pool.connect();
  }

  // Initialize database schema
  static async initializeSchema() {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create roles table
      await client.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          roleid INTEGER REFERENCES roles(id) DEFAULT 1,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create transactions table with UUID primary key
      await client.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          amount NUMERIC(12,2) NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT,
          notes TEXT,
          transaction_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)
      `);

      await client.query("COMMIT");
      console.log("Database schema initialized successfully");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error initializing database schema:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Seed initial data
  static async seedData() {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert roles
      await client.query(`
        INSERT INTO roles (id, name) VALUES 
        (1, 'admin'), 
        (2, 'user')
        ON CONFLICT (id) DO NOTHING
      `);

      await client.query("COMMIT");
      console.log("Database seeded successfully");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error seeding database:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Database;
