const bcrypt = require("bcryptjs");
const { body, query, validationResult } = require("express-validator");
const { userQueries, roleQueries } = require("../models/database");

class UserController {
  // Get all users with optional search filtering
  static async getUsers(req, res) {
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

      const users = await userQueries.getAll();

      res.json({
        success: true,
        users,
        count: users.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "FETCH_USERS_ERROR",
          message: "Failed to fetch users",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Create new user
  static async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid user data",
            details: errors.array(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { email, password, role = "user", status = "active" } = req.body;

      // Check if user already exists
      const existingUser = await userQueries.findByEmail(email);
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
      const roleData = await roleQueries.findByName(role);
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
        status,
      };

      const newUser = await userQueries.create(userData);

      // Get user with role information
      const userWithRole = await userQueries.findById(newUser.id);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          id: userWithRole.id,
          email: userWithRole.email,
          role: userWithRole.role,
          status: userWithRole.status,
          created_at: userWithRole.created_at,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "CREATE_USER_ERROR",
          message: "Failed to create user",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid user data",
            details: errors.array(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { id } = req.params;
      const { email, role, status, password } = req.body;

      // Check if user exists
      const existingUser = await userQueries.findById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Prepare update data
      const updateData = {};

      if (email && email !== existingUser.email) {
        // Check if new email already exists
        const emailExists = await userQueries.findByEmail(email);
        if (emailExists && emailExists.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            error: {
              code: "EMAIL_EXISTS",
              message: "Email already exists",
            },
            timestamp: new Date().toISOString(),
          });
        }
        updateData.email = email;
      }

      if (role) {
        const roleData = await roleQueries.findByName(role);
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
        updateData.roleid = roleData.id;
      }

      if (status) {
        updateData.status = status;
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 12);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "NO_UPDATES",
            message: "No valid fields to update",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Update user
      await userQueries.update(parseInt(id), updateData);

      // Get updated user with role information
      const updatedUser = await userQueries.findById(parseInt(id));

      res.json({
        success: true,
        message: "User updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "UPDATE_USER_ERROR",
          message: "Failed to update user",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await userQueries.findById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Prevent admin from deleting themselves
      if (parseInt(id) === req.user.userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "CANNOT_DELETE_SELF",
            message: "Cannot delete your own account",
          },
          timestamp: new Date().toISOString(),
        });
      }

      await userQueries.delete(parseInt(id));

      res.json({
        success: true,
        message: "User deleted successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "DELETE_USER_ERROR",
          message: "Failed to delete user",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get user statistics
  static async getUserStats(req, res) {
    try {
      // This would need custom queries for stats - keeping simple for now
      const users = await userQueries.getAll();

      const stats = {
        total: users.length,
        active: users.filter((u) => u.status === "active").length,
        inactive: users.filter((u) => u.status === "inactive").length,
        admins: users.filter((u) => u.role === "admin").length,
        regular: users.filter((u) => u.role === "user").length,
      };

      res.json({
        success: true,
        stats: {
          users: stats,
          transactions: {
            total: 0,
            usersWithTransactions: 0,
            totalIncome: 0,
            totalExpenses: 0,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "STATS_ERROR",
          message: "Failed to get user statistics",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Validation middleware
const createUserValidation = [
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
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),
];

const updateUserValidation = [
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be either admin or user"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),
];

const searchValidation = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),
];

module.exports = {
  UserController,
  createUserValidation,
  updateUserValidation,
  searchValidation,
};
