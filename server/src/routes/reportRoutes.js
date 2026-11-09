
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport
} = require("../controllers/reportController");

// All report endpoints require authentication
router.use(authMiddleware);

router.get("/daily", getDailyReport);
router.get("/month-to-date", getMonthToDateReport);
router.get("/previous-month", getPreviousMonthReport);

module.exports = router;
