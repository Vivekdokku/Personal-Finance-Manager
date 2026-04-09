const express = require("express");
const {
  UserController,
  createUserValidation,
  updateUserValidation,
  searchValidation,
} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/rbac");

const router = express.Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/users - Get all users with optional search
router.get("/users", searchValidation, UserController.getUsers);

// POST /api/admin/users - Create new user
router.post("/users", createUserValidation, UserController.createUser);

// PUT /api/admin/users/:id - Update user
router.put("/users/:id", updateUserValidation, UserController.updateUser);

// DELETE /api/admin/users/:id - Delete user
router.delete("/users/:id", UserController.deleteUser);

// GET /api/admin/stats - Get user and system statistics
router.get("/stats", UserController.getUserStats);

module.exports = router;
