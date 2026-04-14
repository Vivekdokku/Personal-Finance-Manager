const { db } = require("../config/database");

class Role {
  /**
   * Get all roles
   * @returns {Array} Array of role objects
   */
  static async getAll() {
    try {
      const roles = await db("roles").select("*").orderBy("id");
      return roles;
    } catch (error) {
      console.error("Error getting all roles:", error);
      throw new Error("Failed to retrieve roles");
    }
  }

  /**
   * Find role by ID
   * @param {number} id - Role ID
   * @returns {Object|null} Role object or null
   */
  static async findById(id) {
    try {
      const role = await db("roles").where("id", id).first();
      return role || null;
    } catch (error) {
      console.error("Error finding role by ID:", error);
      throw new Error("Failed to find role by ID");
    }
  }

  /**
   * Find role by name
   * @param {string} name - Role name
   * @returns {Object|null} Role object or null
   */
  static async findByName(name) {
    try {
      const role = await db("roles").where("name", name).first();
      return role || null;
    } catch (error) {
      console.error("Error finding role by name:", error);
      throw new Error("Failed to find role by name");
    }
  }

  /**
   * Create new role
   * @param {Object} roleData - Role data object
   * @returns {Object} Created role object
   */
  static async create(roleData) {
    try {
      const [role] = await db("roles").insert(roleData).returning("*");

      return role;
    } catch (error) {
      console.error("Error creating role:", error);
      if (error.code === "23505") {
        // Unique constraint violation
        throw new Error("Role with this name already exists");
      }
      throw new Error("Failed to create role");
    }
  }

  /**
   * Update role
   * @param {number} id - Role ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated role object
   */
  static async update(id, updateData) {
    try {
      const [role] = await db("roles")
        .where("id", id)
        .update({
          ...updateData,
          updated_at: db.fn.now(),
        })
        .returning("*");

      if (!role) {
        throw new Error("Role not found");
      }

      return role;
    } catch (error) {
      console.error("Error updating role:", error);
      if (error.code === "23505") {
        // Unique constraint violation
        throw new Error("Role name already exists");
      }
      throw new Error("Failed to update role");
    }
  }

  /**
   * Delete role
   * @param {number} id - Role ID
   * @returns {number} Number of deleted rows
   */
  static async delete(id) {
    try {
      // Check if role is being used by any users
      const usersWithRole = await db("users")
        .where("roleid", id)
        .count("* as count")
        .first();

      if (parseInt(usersWithRole.count) > 0) {
        throw new Error("Cannot delete role that is assigned to users");
      }

      const deletedCount = await db("roles").where("id", id).del();

      if (deletedCount === 0) {
        throw new Error("Role not found");
      }

      return deletedCount;
    } catch (error) {
      console.error("Error deleting role:", error);
      throw error; // Re-throw to preserve specific error messages
    }
  }

  /**
   * Check if role exists
   * @param {number} id - Role ID
   * @returns {boolean} True if role exists, false otherwise
   */
  static async exists(id) {
    try {
      const role = await db("roles").where("id", id).first();
      return !!role;
    } catch (error) {
      console.error("Error checking if role exists:", error);
      throw new Error("Failed to check role existence");
    }
  }

  /**
   * Get role usage statistics
   * @returns {Array} Array of roles with user counts
   */
  static async getUsageStats() {
    try {
      const stats = await db("roles")
        .leftJoin("users", "roles.id", "users.roleid")
        .select("roles.id", "roles.name")
        .count("users.id as user_count")
        .groupBy("roles.id", "roles.name")
        .orderBy("roles.id");

      return stats.map((stat) => ({
        id: stat.id,
        name: stat.name,
        userCount: parseInt(stat.user_count) || 0,
      }));
    } catch (error) {
      console.error("Error getting role usage stats:", error);
      throw new Error("Failed to get role usage statistics");
    }
  }

  /**
   * Validate role permissions (for future use)
   * @param {string} roleName - Role name
   * @param {string} permission - Permission to check
   * @returns {boolean} True if role has permission
   */
  static hasPermission(roleName, permission) {
    try {
      const rolePermissions = {
        admin: [
          "user.create",
          "user.read",
          "user.update",
          "user.delete",
          "transaction.read_all",
          "role.manage",
          "stats.view",
        ],
        user: [
          "transaction.create",
          "transaction.read_own",
          "transaction.update_own",
          "transaction.delete_own",
          "profile.update_own",
        ],
      };

      return rolePermissions[roleName]?.includes(permission) || false;
    } catch (error) {
      console.error("Error checking role permission:", error);
      return false;
    }
  }

  /**
   * Get default role for new users
   * @returns {Object} Default role object
   */
  static async getDefaultRole() {
    try {
      const defaultRole = await db("roles").where("name", "user").first();

      if (!defaultRole) {
        throw new Error("Default user role not found");
      }

      return defaultRole;
    } catch (error) {
      console.error("Error getting default role:", error);
      throw new Error("Failed to get default role");
    }
  }
}

module.exports = Role;
