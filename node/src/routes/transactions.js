const express = require("express");
const {
  TransactionController,
  transactionValidation,
  dateFilterValidation,
} = require("../controllers/transactionController");
const { authenticateToken } = require("../middleware/auth");
const { requireAnyRole } = require("../middleware/rbac");

const router = express.Router();

// Apply authentication to all transaction routes
router.use(authenticateToken);
router.use(requireAnyRole(["admin", "user"]));

// GET /api/transactions - Get user transactions with optional date filtering
router.get("/", dateFilterValidation, TransactionController.getTransactions);

// POST /api/transactions - Create new transaction
router.post(
  "/",
  transactionValidation,
  TransactionController.createTransaction,
);

// GET /api/transactions/summary - Get spending summary
router.get("/summary", TransactionController.getSpendingSummary);

// PUT /api/transactions/:id - Update transaction
router.put(
  "/:id",
  transactionValidation,
  TransactionController.updateTransaction,
);

// DELETE /api/transactions/:id - Delete transaction
router.delete("/:id", TransactionController.deleteTransaction);

module.exports = router;
