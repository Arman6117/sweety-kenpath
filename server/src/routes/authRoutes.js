const express = require("express");
const router = express.Router();

const {
  register,
  login,
  changePassword,
  updateProfile
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const { authRateLimiter } = require("../middleware/rateLimiter");
const prisma = require("../config/prisma");

// Public endpoints with brute-force / credential-stuffing rate limiting
router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);

// Protected endpoints requiring valid JWT
router.put("/change-password", authMiddleware, changePassword);
router.put("/profile", authMiddleware, updateProfile);

// Get current authenticated user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get /me error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user profile."
    });
  }
});

module.exports = router;
