const { db } = require("../config/database");

class User {
  /**
   * Find user by email with role information
   * @param {string} email - User email
   * @returns {Object|null} User object with role info or null
   */
  static async findByEmail(email) {
    try {
      const user = await db("users")
        .join("roles", "users.roleid", "roles.id")
        .select(
          "users.id",
          "users.email",
          "users.password",
          "users.status",
          "users.roleid",
          "roles.name as role",
        )
        .where("users.email", email)
        .first();

      return user || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw new Error("Failed to find user by email");
    }
  }

  /**
   * Find user by ID with role information
   * @param {number} id - User ID
   * @returns {Object|null} User object with role info or null
   */
  static async findById(id) {
    try {
      const user = await db("users")
        .join("roles", "users.roleid", "roles.id")
        .select(
          "users.id",
          "users.email",
          "users.status",
          "users.roleid",
          "roles.name as role",
          "users.created_at",
        )
        .where("users.id", id)
        .first();

      return user || null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw new Error("Failed to find user by ID");
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data object
   * @returns {Object} Created user object
   */
  static async create(userData) {
    try {
      const [user] = await db("users")
        .insert(userData)
        .returning(["id", "email", "roleid", "status", "created_at"]);

      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.code === "23505") {
        // Unique constraint violation
        throw new Error("User with this email already exists");
      }
      throw new Error("Failed to create user");
    }
  }

  /**
   * Get all users with role information (admin function)
   * @returns {Array} Array of user objects
   */
  static async getAll() {
    try {
      const users = await db("users")
        .join("roles", "users.roleid", "roles.id")
        .select(
          "users.id",
          "users.email",
          "users.status",
          "users.roleid",
          "roles.name as role",
          "users.created_at",
        )
        .orderBy("users.created_at", "desc");

      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw new Error("Failed to retrieve users");
    }
  }

  /**
   * Update user data
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user object
   */
  static async update(id, updateData) {
    try {
      const [user] = await db("users")
        .where("id", id)
        .update({
          ...updateData,
          updated_at: db.fn.now(),
        })
        .returning(["id", "email", "roleid", "status"]);

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.code === "23505") {
        // Unique constraint violation
        throw new Error("Email already exists");
      }
      throw new Error("Failed to update user");
    }
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {number} Number of deleted rows
   */
  static async delete(id) {
    try {
      const deletedCount = await db("users").where("id", id).del();

      if (deletedCount === 0) {
        throw new Error("User not found");
      }

      return deletedCount;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  }

  /**
   * Search users by email or status
   * @param {Object} filters - Search filters
   * @returns {Array} Array of matching users
   */
  static async search(filters = {}) {
    try {
      let query = db("users")
        .join("roles", "users.roleid", "roles.id")
        .select(
          "users.id",
          "users.email",
          "users.status",
          "users.roleid",
          "roles.name as role",
          "users.created_at",
        );

      if (filters.email) {
        query = query.where("users.email", "ilike", `%${filters.email}%`);
      }

      if (filters.status) {
        query = query.where("users.status", filters.status);
      }

      if (filters.role) {
        query = query.where("roles.name", filters.role);
      }

      const users = await query.orderBy("users.created_at", "desc");
      return users;
    } catch (error) {
      console.error("Error searching users:", error);
      throw new Error("Failed to search users");
    }
  }

  /**
   * Count users by status and role
   * @returns {Object} User statistics
   */
  static async getStats() {
    try {
      const stats = await db("users")
        .join("roles", "users.roleid", "roles.id")
        .select(
          db.raw("COUNT(*) as total"),
          db.raw(
            "COUNT(CASE WHEN users.status = 'active' THEN 1 END) as active",
          ),
          db.raw(
            "COUNT(CASE WHEN users.status = 'inactive' THEN 1 END) as inactive",
          ),
          db.raw("COUNT(CASE WHEN roles.name = 'admin' THEN 1 END) as admins"),
          db.raw(
            "COUNT(CASE WHEN roles.name = 'user' THEN 1 END) as regular_users",
          ),
        )
        .first();

      return {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        inactive: parseInt(stats.inactive) || 0,
        admins: parseInt(stats.admins) || 0,
        regular: parseInt(stats.regular_users) || 0,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw new Error("Failed to get user statistics");
    }
  }
}

module.exports = User;
