const bcrypt = require("bcryptjs");
const { body, query, validationResult } = require("express-validator");
const Database = require("../models/database");

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

      const { search, status } = req.query;

      let queryText = `
        SELECT u.id, u.email, u.status, u.created_at, u.updated_at, r.name as role
        FROM users u
        JOIN roles r ON u.roleid = r.id
        WHERE 1=1
      `;
      let queryParams = [];
      let paramCount = 0;

      // Add search filtering
      if (search) {
        paramCount++;
        queryText += ` AND (u.email ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }

      // Add status filtering
      if (status) {
        paramCount++;
        queryText += ` AND u.status = $${paramCount}`;
        queryParams.push(status);
      }

      queryText += " ORDER BY u.created_at DESC";

      const result = await Database.query(queryText, queryParams);

      res.json({
        success: true,
        users: result.rows,
        count: result.rows.length,
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
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, status, created_at`,
        [email, hashedPassword, roleId, status],
      );

      const newUser = userResult.rows[0];

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          role: role,
          status: newUser.status,
          created_at: newUser.created_at,
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
      const existingUser = await Database.query(
        "SELECT id, email FROM users WHERE id = $1",
        [id],
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if email is already taken by another user
      if (email && email !== existingUser.rows[0].email) {
        const emailCheck = await Database.query(
          "SELECT id FROM users WHERE email = $1 AND id != $2",
          [email, id],
        );

        if (emailCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: "EMAIL_EXISTS",
              message: "Email is already taken by another user",
            },
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Build update query dynamically
      let updateFields = [];
      let queryParams = [];
      let paramCount = 0;

      if (email) {
        paramCount++;
        updateFields.push(`email = $${paramCount}`);
        queryParams.push(email);
      }

      if (role) {
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

        paramCount++;
        updateFields.push(`roleid = $${paramCount}`);
        queryParams.push(roleResult.rows[0].id);
      }

      if (status) {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        queryParams.push(status);
      }

      if (password) {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        paramCount++;
        updateFields.push(`password = $${paramCount}`);
        queryParams.push(hashedPassword);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "NO_UPDATES",
            message: "No valid fields to update",
          },
          timestamp: new Date().toISOString(),
        });
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      paramCount++;
      queryParams.push(id);

      const queryText = `
        UPDATE users 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING id, email, status, updated_at
      `;

      const result = await Database.query(queryText, queryParams);

      // Get updated user with role information
      const updatedUserResult = await Database.query(
        `SELECT u.id, u.email, u.status, u.updated_at, r.name as role
         FROM users u
         JOIN roles r ON u.roleid = r.id
         WHERE u.id = $1`,
        [id],
      );

      res.json({
        success: true,
        message: "User updated successfully",
        user: updatedUserResult.rows[0],
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

      // Prevent admin from deleting themselves
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          error: {
            code: "CANNOT_DELETE_SELF",
            message: "Cannot delete your own account",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await Database.query(
        "DELETE FROM users WHERE id = $1 RETURNING id, email",
        [id],
      );

      if (result.rows.length === 0) {
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
        message: "User deleted successfully",
        deletedUser: result.rows[0],
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
      const statsResult = await Database.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
          COUNT(CASE WHEN r.name = 'admin' THEN 1 END) as admin_users,
          COUNT(CASE WHEN r.name = 'user' THEN 1 END) as regular_users
        FROM users u
        JOIN roles r ON u.roleid = r.id
      `);

      const transactionStatsResult = await Database.query(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(DISTINCT user_id) as users_with_transactions,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses
        FROM transactions
      `);

      const stats = statsResult.rows[0];
      const transactionStats = transactionStatsResult.rows[0];

      res.json({
        success: true,
        stats: {
          users: {
            total: parseInt(stats.total_users),
            active: parseInt(stats.active_users),
            inactive: parseInt(stats.inactive_users),
            admins: parseInt(stats.admin_users),
            regular: parseInt(stats.regular_users),
          },
          transactions: {
            total: parseInt(transactionStats.total_transactions),
            usersWithTransactions: parseInt(
              transactionStats.users_with_transactions,
            ),
            totalIncome: parseFloat(transactionStats.total_income) || 0,
            totalExpenses: parseFloat(transactionStats.total_expenses) || 0,
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
