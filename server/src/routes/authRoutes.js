
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  changePassword
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const prisma = require("../config/prisma");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Change password
router.put("/change-password", authMiddleware, changePassword);

// Get currently logged-in user
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
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user profile."
    });
  }
});

module.exports = router;
