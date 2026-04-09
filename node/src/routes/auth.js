const express = require("express");
const {
  AuthController,
  registerValidation,
  loginValidation,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerValidation, AuthController.register);

// POST /api/auth/login
router.post("/login", loginValidation, AuthController.login);

// GET /api/auth/me - Get current user info
router.get("/me", authenticateToken, AuthController.getCurrentUser);

module.exports = router;
