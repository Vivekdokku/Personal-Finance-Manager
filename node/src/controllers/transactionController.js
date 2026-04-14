const { body, query, validationResult } = require("express-validator");
const { transactionQueries } = require("../models/database");

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

      const userId = req.user.userId;
      const transactions = await transactionQueries.findByUserId(userId);

      res.json({
        success: true,
        transactions,
        count: transactions.length,
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
      const userId = req.user.userId;

      const transactionData = {
        user_id: userId,
        amount: parseFloat(amount),
        category,
        description: description || null,
        notes: notes || null,
        transaction_date:
          transaction_date || new Date().toISOString().split("T")[0],
      };

      const newTransaction = await transactionQueries.create(transactionData);

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
      const userId = req.user.userId;

      // Get category summary
      const categorySummary = await transactionQueries.getSummaryByUser(userId);

      // Get totals
      const totals = await transactionQueries.getTotalsByUser(userId);

      // Format category summary
      const summary = {};
      categorySummary.forEach((item) => {
        summary[item.category] = parseFloat(item.total);
      });

      res.json({
        success: true,
        summary,
        totals: {
          totalIncome: totals.totalIncome,
          totalExpenses: totals.totalExpenses,
          netBalance: totals.totalIncome - totals.totalExpenses,
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
      const userId = req.user.userId;

      // Check if transaction exists and belongs to user
      const existingTransaction = await transactionQueries.findByIdAndUser(
        id,
        userId,
      );
      if (!existingTransaction) {
        return res.status(404).json({
          success: false,
          error: {
            code: "TRANSACTION_NOT_FOUND",
            message: "Transaction not found or access denied",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const updateData = {
        amount:
          amount !== undefined
            ? parseFloat(amount)
            : existingTransaction.amount,
        category: category || existingTransaction.category,
        description:
          description !== undefined
            ? description
            : existingTransaction.description,
        notes: notes !== undefined ? notes : existingTransaction.notes,
        transaction_date:
          transaction_date || existingTransaction.transaction_date,
      };

      const updatedTransaction = await transactionQueries.update(
        id,
        updateData,
      );

      res.json({
        success: true,
        message: "Transaction updated successfully",
        transaction: updatedTransaction,
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
      const userId = req.user.userId;

      // Check if transaction exists and belongs to user
      const existingTransaction = await transactionQueries.findByIdAndUser(
        id,
        userId,
      );
      if (!existingTransaction) {
        return res.status(404).json({
          success: false,
          error: {
            code: "TRANSACTION_NOT_FOUND",
            message: "Transaction not found or access denied",
          },
          timestamp: new Date().toISOString(),
        });
      }

      await transactionQueries.delete(id);

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
