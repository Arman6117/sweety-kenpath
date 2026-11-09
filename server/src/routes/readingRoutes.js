
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
} = require("../controllers/readingController");

// Protect all reading routes
router.use(authMiddleware);

// Create reading
router.post("/", createReading);

// Get all readings
router.get("/", getReadings);

// Get one reading
router.get("/:id", getReadingById);

// Update reading
router.put("/:id", updateReading);

// Delete reading
router.delete("/:id", deleteReading);

module.exports = router;
