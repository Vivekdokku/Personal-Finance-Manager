const requireRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "NOT_AUTHENTICATED",
            message: "User not authenticated",
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user has required role
      if (req.user.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: `Access denied. Required role: ${requiredRole}`,
          },
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      console.error("RBAC error:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "RBAC_ERROR",
          message: "Role-based access control failed",
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
};

const requireAdmin = requireRole("admin");

const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "NOT_AUTHENTICATED",
            message: "User not authenticated",
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
          },
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      console.error("RBAC error:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "RBAC_ERROR",
          message: "Role-based access control failed",
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireAnyRole,
};
