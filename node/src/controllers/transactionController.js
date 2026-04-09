const { body, query, validationResult } = require("express-validator");
const Database = require("../models/database");

class TransactionController {
  // Get user transactions with optional date filtering
  static async getTransactions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: errors.array(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { startDate, endDate } = req.query;
      const userId = req.user.id;

      let queryText = `
        SELECT id, user_id, amount, category, description, notes, 
               transaction_date, created_at, updated_at
        FROM transactions 
        WHERE user_id = $1
      `;
      let queryParams = [userId];

      // Add date filtering if provided
      if (startDate && endDate) {
        queryText += " AND transaction_date BETWEEN $2 AND $3";
        queryParams.push(startDate, endDate);
      } else if (startDate) {
        queryText += " AND transaction_date >= $2";
        queryParams.push(startDate);
      } else if (endDate) {
        queryText += " AND transaction_date <= $2";
        queryParams.push(endDate);
      }

      queryText += " ORDER BY transaction_date DESC, created_at DESC";

      const result = await Database.query(queryText, queryParams);

      res.json({
        success: true,
        transactions: result.rows,
        count: result.rows.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "FETCH_TRANSACTIONS_ERROR",
          message: "Failed to fetch transactions",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Create new transaction
  static async createTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid transaction data",
            details: errors.array(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { amount, category, description, notes, transaction_date } =
        req.body;
      const userId = req.user.id;

      const result = await Database.query(
        `INSERT INTO transactions (user_id, amount, category, description, notes, transaction_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, amount, category, description, notes, transaction_date, created_at`,
        [
          userId,
          amount,
          category,
          description || null,
          notes || null,
          transaction_date,
        ],
      );

      const newTransaction = result.rows[0];

      res.status(201).json({
        success: true,
        message: "Transaction created successfully",
        transaction: newTransaction,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "CREATE_TRANSACTION_ERROR",
          message: "Failed to create transaction",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get spending summary by category
  static async getSpendingSummary(req, res) {
    try {
      const userId = req.user.id;

      const result = await Database.query(
        `SELECT 
           category,
           SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
           SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expense,
           SUM(amount) as net_total
         FROM transactions 
         WHERE user_id = $1
         GROUP BY category
         ORDER BY category`,
        [userId],
      );

      // Calculate overall totals
      const totalsResult = await Database.query(
        `SELECT 
           SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
           SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses,
           SUM(amount) as net_balance
         FROM transactions 
         WHERE user_id = $1`,
        [userId],
      );

      const totals = totalsResult.rows[0];

      // Format summary data
      const summary = {};
      result.rows.forEach((row) => {
        summary[row.category] = {
          income: parseFloat(row.income) || 0,
          expense: parseFloat(row.expense) || 0,
          net: parseFloat(row.net_total) || 0,
        };
      });

      res.json({
        success: true,
        summary,
        totals: {
          totalIncome: parseFloat(totals.total_income) || 0,
          totalExpenses: parseFloat(totals.total_expenses) || 0,
          netBalance: parseFloat(totals.net_balance) || 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Get spending summary error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "SUMMARY_ERROR",
          message: "Failed to get spending summary",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Update transaction
  static async updateTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid transaction data",
            details: errors.array(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { id } = req.params;
      const { amount, category, description, notes, transaction_date } =
        req.body;
      const userId = req.user.id;

      // Check if transaction exists and belongs to user
      const existingTransaction = await Database.query(
        "SELECT id FROM transactions WHERE id = $1 AND user_id = $2",
        [id, userId],
      );

      if (existingTransaction.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: "TRANSACTION_NOT_FOUND",
            message: "Transaction not found or access denied",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await Database.query(
        `UPDATE transactions 
         SET amount = $1, category = $2, description = $3, notes = $4, 
             transaction_date = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND user_id = $7
         RETURNING id, user_id, amount, category, description, notes, transaction_date, updated_at`,
        [
          amount,
          category,
          description || null,
          notes || null,
          transaction_date,
          id,
          userId,
        ],
      );

      res.json({
        success: true,
        message: "Transaction updated successfully",
        transaction: result.rows[0],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "UPDATE_TRANSACTION_ERROR",
          message: "Failed to update transaction",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Delete transaction
  static async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await Database.query(
        "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
        [id, userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: "TRANSACTION_NOT_FOUND",
            message: "Transaction not found or access denied",
          },
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        message: "Transaction deleted successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Delete transaction error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "DELETE_TRANSACTION_ERROR",
          message: "Failed to delete transaction",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Validation middleware
const transactionValidation = [
  body("amount")
    .isNumeric()
    .withMessage("Amount must be a valid number")
    .custom((value) => {
      if (Math.abs(value) > 999999999.99) {
        throw new Error("Amount exceeds maximum allowed value");
      }
      return true;
    }),
  body("category")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Category is required and must be less than 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be less than 1000 characters"),
  body("transaction_date")
    .isISO8601()
    .toDate()
    .withMessage("Transaction date must be a valid date"),
];

const dateFilterValidation = [
  query("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Start date must be a valid date"),
  query("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("End date must be a valid date"),
];

module.exports = {
  TransactionController,
  transactionValidation,
  dateFilterValidation,
};
