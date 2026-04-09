const jwt = require("jsonwebtoken");
const Database = require("../models/database");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "NO_TOKEN",
          message: "Access token is required",
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user details from database
    const userResult = await Database.query(
      `SELECT u.id, u.email, u.status, r.name as role 
       FROM users u 
       JOIN roles r ON u.roleid = r.id 
       WHERE u.id = $1`,
      [decoded.userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
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

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid access token",
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Access token has expired",
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "Authentication failed",
      },
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = {
  authenticateToken,
};
