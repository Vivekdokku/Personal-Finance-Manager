const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { User, Role } = require("../models/database");

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
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "User with this email already exists",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Get role data
      const roleData = await Role.findByName(role);
      if (!roleData) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ROLE",
            message: "Invalid role specified",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userData = {
        email,
        password: hashedPassword,
        roleid: roleData.id,
        status: "active",
      };

      const newUser = await User.create(userData);

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
          message: error.message || "Failed to register user",
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
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
          timestamp: new Date().toISOString(),
        });
      }

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
          role: user.roleid,
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
          roleid: user.roleid,
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
          message: error.message || "Failed to authenticate user",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get current user info
  static async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          roleid: user.roleid,
          status: user.status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "USER_INFO_ERROR",
          message: error.message || "Failed to get user information",
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
