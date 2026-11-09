
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// REGISTER USER
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters."
      });
    }

    // Check whether user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration."
    });
  }
};

// LOGIN USER
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Compare entered password with stored hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during login."
    });
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required."
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters."
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password."
      });
    }

    // Find the user to get existing password hash
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // Verify current password with bcrypt
    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect."
      });
    }

    // Hash new password with 12 salt rounds
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update passwordHash in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash
      }
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully."
    });

  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password. Please try again later."
    });
  }
};

// UPDATE USER PROFILE
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request."
      });
    }

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required."
      });
    }

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Name is required."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    // Check whether the email is already used by another user account
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: trimmedName,
        email: normalizedEmail
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update profile error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update profile. Please try again later."
    });
  }
};

module.exports = {
  register,
  login,
  changePassword,
  updateProfile
};
