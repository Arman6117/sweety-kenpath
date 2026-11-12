const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT for the given user ID.
 * @param {string} userId - UUID of the authenticated user
 * @param {object} [options]
 * @param {string} [options.expiresIn] - Token expiration duration (e.g., '1d', '24h')
 * @returns {string} - Signed JWT
 */
function generateToken(userId, options = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured.");
  }

  if (!userId) {
    throw new Error("userId is required to generate an authentication token.");
  }

  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || "1d";

  return jwt.sign(
    { userId },
    secret,
    { expiresIn }
  );
}

/**
 * Verifies and decodes a JWT.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 * @param {string} token
 * @returns {{ userId: string, iat: number, exp: number }}
 */
function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured.");
  }

  return jwt.verify(token, secret);
}

module.exports = {
  generateToken,
  verifyToken
};
