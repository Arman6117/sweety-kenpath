const { verifyToken } = require("../utils/jwt");

/**
 * Authentication middleware that verifies the incoming Bearer JWT.
 * Rejects missing, malformed, invalid, and expired tokens with HTTP 401.
 * Attaches verified user identity { userId } to req.user.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required."
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Malformed authentication header. Format must be 'Bearer <token>'."
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment variables.");
      return res.status(500).json({
        success: false,
        message: "Authentication service configuration error."
      });
    }

    // Verify JWT signature and expiration
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Authentication token has expired."
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
      });
    }

    if (!decoded || typeof decoded !== "object" || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token payload."
      });
    }

    // Attach verified user identity. Never trust userId from body or query.
    req.user = {
      userId: decoded.userId
    };

    next();
  } catch (error) {
    console.error("Auth middleware unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal authentication error."
    });
  }
};

module.exports = authMiddleware;
