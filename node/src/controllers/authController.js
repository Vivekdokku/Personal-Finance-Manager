const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Database = require("../models/database");

class AuthController {
  // User registration
  static async register(req, res) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: errors.array(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { email, password, role = "user" } = req.body;

      // Check if user already exists
      const existingUser = await Database.query(
        "SELECT id FROM users WHERE email = $1",
        [email],
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "User with this email already exists",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Get role ID
      const roleResult = await Database.query(
        "SELECT id FROM roles WHERE name = $1",
        [role],
      );

      if (roleResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ROLE",
            message: "Invalid role specified",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const roleId = roleResult.rows[0].id;

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userResult = await Database.query(
        `INSERT INTO users (email, password, roleid, status) 
         VALUES ($1, $2, $3, 'active') 
         RETURNING id, email, status`,
        [email, hashedPassword, roleId],
      );

      const newUser = userResult.rows[0];

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          role: role,
          status: newUser.status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "REGISTRATION_ERROR",
          message: "Failed to register user",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // User login
  static async login(req, res) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: errors.array(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { email, password } = req.body;

      // Find user with role information
      const userResult = await Database.query(
        `SELECT u.id, u.email, u.password, u.status, r.name as role 
         FROM users u 
         JOIN roles r ON u.roleid = r.id 
         WHERE u.email = $1`,
        [email],
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const user = userResult.rows[0];

      // Check if user is active
      if (user.status !== "active") {
        return res.status(401).json({
          success: false,
          error: {
            code: "USER_INACTIVE",
            message: "User account is inactive",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "LOGIN_ERROR",
          message: "Failed to authenticate user",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get current user info
  static async getCurrentUser(req, res) {
    try {
      res.json({
        success: true,
        user: req.user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "USER_INFO_ERROR",
          message: "Failed to get user information",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Validation middleware
const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be either admin or user"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = {
  AuthController,
  registerValidation,
  loginValidation,
};
