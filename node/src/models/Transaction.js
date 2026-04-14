const { db } = require("../config/database");

class Transaction {
  /**
   * Get all transactions for a specific user
   * @param {number} userId - User ID
   * @returns {Array} Array of transaction objects
   */
  static async findByUserId(userId) {
    try {
      const transactions = await db("transactions")
        .where("user_id", userId)
        .orderBy("transaction_date", "desc")
        .orderBy("created_at", "desc");

      return transactions;
    } catch (error) {
      console.error("Error finding transactions by user ID:", error);
      throw new Error("Failed to retrieve user transactions");
    }
  }

  /**
   * Create new transaction
   * @param {Object} transactionData - Transaction data object
   * @returns {Object} Created transaction object
   */
  static async create(transactionData) {
    try {
      const [transaction] = await db("transactions")
        .insert(transactionData)
        .returning("*");

      return transaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error.code === "23503") {
        // Foreign key constraint violation
        throw new Error("Invalid user ID");
      }
      throw new Error("Failed to create transaction");
    }
  }

  /**
   * Update transaction
   * @param {string} id - Transaction ID (UUID)
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated transaction object
   */
  static async update(id, updateData) {
    try {
      const [transaction] = await db("transactions")
        .where("id", id)
        .update({
          ...updateData,
          updated_at: db.fn.now(),
        })
        .returning("*");

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      return transaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw new Error("Failed to update transaction");
    }
  }

  /**
   * Delete transaction
   * @param {string} id - Transaction ID (UUID)
   * @returns {number} Number of deleted rows
   */
  static async delete(id) {
    try {
      const deletedCount = await db("transactions").where("id", id).del();

      if (deletedCount === 0) {
        throw new Error("Transaction not found");
      }

      return deletedCount;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw new Error("Failed to delete transaction");
    }
  }

  /**
   * Find transaction by ID and user (for security)
   * @param {string} id - Transaction ID (UUID)
   * @param {number} userId - User ID
   * @returns {Object|null} Transaction object or null
   */
  static async findByIdAndUser(id, userId) {
    try {
      const transaction = await db("transactions")
        .where("id", id)
        .andWhere("user_id", userId)
        .first();

      return transaction || null;
    } catch (error) {
      console.error("Error finding transaction by ID and user:", error);
      throw new Error("Failed to find transaction");
    }
  }

  /**
   * Get spending summary by category for a user (backend grouping)
   * @param {number} userId - User ID
   * @returns {Array} Array of category summaries
   */
  static async getSummaryByUser(userId) {
    try {
      const summary = await db("transactions")
        .where("user_id", userId)
        .select("category")
        .sum("amount as total")
        .groupBy("category")
        .orderBy("total", "desc");

      return summary;
    } catch (error) {
      console.error("Error getting transaction summary:", error);
      throw new Error("Failed to get transaction summary");
    }
  }

  /**
   * Get total income and expenses for a user
   * @param {number} userId - User ID
   * @returns {Object} Totals object with income, expenses, and transaction count
   */
  static async getTotalsByUser(userId) {
    try {
      const result = await db("transactions")
        .where("user_id", userId)
        .select(
          db.raw(
            "SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income",
          ),
          db.raw(
            "SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses",
          ),
          db.raw("COUNT(*) as total_transactions"),
        )
        .first();

      return {
        totalIncome: parseFloat(result.total_income) || 0,
        totalExpenses: parseFloat(result.total_expenses) || 0,
        totalTransactions: parseInt(result.total_transactions) || 0,
      };
    } catch (error) {
      console.error("Error getting transaction totals:", error);
      throw new Error("Failed to get transaction totals");
    }
  }

  /**
   * Get transactions with date range filtering
   * @param {number} userId - User ID
   * @param {Object} filters - Date filters
   * @returns {Array} Array of filtered transactions
   */
  static async findByUserWithFilters(userId, filters = {}) {
    try {
      let query = db("transactions").where("user_id", userId);

      if (filters.startDate) {
        query = query.where("transaction_date", ">=", filters.startDate);
      }

      if (filters.endDate) {
        query = query.where("transaction_date", "<=", filters.endDate);
      }

      if (filters.category) {
        query = query.where("category", "ilike", `%${filters.category}%`);
      }

      if (filters.minAmount !== undefined) {
        query = query.where("amount", ">=", filters.minAmount);
      }

      if (filters.maxAmount !== undefined) {
        query = query.where("amount", "<=", filters.maxAmount);
      }

      const transactions = await query
        .orderBy("transaction_date", "desc")
        .orderBy("created_at", "desc");

      return transactions;
    } catch (error) {
      console.error("Error finding transactions with filters:", error);
      throw new Error("Failed to retrieve filtered transactions");
    }
  }

  /**
   * Get category-wise summary with date filtering
   * @param {number} userId - User ID
   * @param {Object} filters - Date filters
   * @returns {Array} Array of category summaries
   */
  static async getSummaryByUserWithFilters(userId, filters = {}) {
    try {
      let query = db("transactions").where("user_id", userId);

      if (filters.startDate) {
        query = query.where("transaction_date", ">=", filters.startDate);
      }

      if (filters.endDate) {
        query = query.where("transaction_date", "<=", filters.endDate);
      }

      const summary = await query
        .select("category")
        .sum("amount as total")
        .count("* as transaction_count")
        .groupBy("category")
        .orderBy("total", "desc");

      return summary;
    } catch (error) {
      console.error("Error getting filtered transaction summary:", error);
      throw new Error("Failed to get filtered transaction summary");
    }
  }

  /**
   * Get all unique categories for a user
   * @param {number} userId - User ID
   * @returns {Array} Array of unique categories
   */
  static async getCategoriesByUser(userId) {
    try {
      const categories = await db("transactions")
        .where("user_id", userId)
        .distinct("category")
        .orderBy("category");

      return categories.map((row) => row.category);
    } catch (error) {
      console.error("Error getting user categories:", error);
      throw new Error("Failed to get user categories");
    }
  }

  /**
   * Get transaction statistics for admin
   * @returns {Object} Transaction statistics
   */
  static async getGlobalStats() {
    try {
      const stats = await db("transactions")
        .select(
          db.raw("COUNT(*) as total_transactions"),
          db.raw("COUNT(DISTINCT user_id) as users_with_transactions"),
          db.raw(
            "SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income",
          ),
          db.raw(
            "SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses",
          ),
          db.raw("COUNT(DISTINCT category) as unique_categories"),
        )
        .first();

      return {
        totalTransactions: parseInt(stats.total_transactions) || 0,
        usersWithTransactions: parseInt(stats.users_with_transactions) || 0,
        totalIncome: parseFloat(stats.total_income) || 0,
        totalExpenses: parseFloat(stats.total_expenses) || 0,
        uniqueCategories: parseInt(stats.unique_categories) || 0,
      };
    } catch (error) {
      console.error("Error getting global transaction stats:", error);
      throw new Error("Failed to get global transaction statistics");
    }
  }

  /**
   * Bulk delete transactions for a user
   * @param {number} userId - User ID
   * @param {Array} transactionIds - Array of transaction IDs to delete
   * @returns {number} Number of deleted transactions
   */
  static async bulkDeleteByUser(userId, transactionIds) {
    try {
      const deletedCount = await db("transactions")
        .where("user_id", userId)
        .whereIn("id", transactionIds)
        .del();

      return deletedCount;
    } catch (error) {
      console.error("Error bulk deleting transactions:", error);
      throw new Error("Failed to delete transactions");
    }
  }
}

module.exports = Transaction;
