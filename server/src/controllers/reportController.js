const prisma = require("../config/prisma");
const { getTodayInIndia } = require("../utils/readingValidation");
const {
  calculateSummary,
  validateReportDate,
  getMonthToDateRange,
  getPreviousMonthRange
} = require("../utils/reportUtils");

/**
 * Fetch readings belonging only to the authenticated user within a date range.
 * @param {string} userId - UUID of authenticated user
 * @param {Date} startDate - Inclusive start date
 * @param {Date} endDate - Inclusive end date
 * @returns {Promise<Array>}
 */
const fetchReadings = async (userId, startDate, endDate) => {
  return prisma.reading.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: [
      { date: "asc" },
      { slot: "asc" }
    ]
  });
};

/**
 * 1. DAILY REPORT
 * GET /api/reports/daily?date=YYYY-MM-DD
 * Returns readings for the selected date, highest, lowest, 1-decimal average, and count.
 */
const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    const validation = validateReportDate(date);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const readings = await fetchReadings(
      req.user.userId,
      validation.parsedDate,
      validation.parsedDate
    );

    return res.status(200).json({
      success: true,
      report: {
        type: "daily",
        date: validation.dateString,
        readings,
        summary: calculateSummary(readings)
      }
    });
  } catch (error) {
    console.error("Daily report error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate daily report."
    });
  }
};

/**
 * 2. MONTH-TO-DATE REPORT
 * GET /api/reports/month-to-date?date=YYYY-MM-DD
 * Calculates from day 1 of selected month through selected date (inclusive).
 * If date query param is omitted, defaults to today's date in IST.
 */
const getMonthToDateReport = async (req, res) => {
  try {
    const targetDate = req.query.date || getTodayInIndia();

    const validation = validateReportDate(targetDate);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const { startDate, endDate, startDateString, endDateString } = getMonthToDateRange(validation.dateString);

    const readings = await fetchReadings(
      req.user.userId,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      report: {
        type: "month-to-date",
        startDate: startDateString,
        endDate: endDateString,
        readings,
        summary: calculateSummary(readings)
      }
    });
  } catch (error) {
    console.error("Month-to-date report error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate month-to-date report."
    });
  }
};

/**
 * 3. PREVIOUS FULL MONTH REPORT
 * GET /api/reports/previous-month?date=YYYY-MM-DD
 * Calculates the entire previous calendar month immediately preceding the selected date's month.
 * Handles month lengths (28, 29, 30, 31) and year boundary crossings (January -> December of previous year).
 */
const getPreviousMonthReport = async (req, res) => {
  try {
    const targetDate = req.query.date || getTodayInIndia();

    const validation = validateReportDate(targetDate);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const { startDate, endDate, startDateString, endDateString } = getPreviousMonthRange(validation.dateString);

    const readings = await fetchReadings(
      req.user.userId,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      report: {
        type: "previous-month",
        startDate: startDateString,
        endDate: endDateString,
        readings,
        summary: calculateSummary(readings)
      }
    });
  } catch (error) {
    console.error("Previous month report error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate previous month report."
    });
  }
};

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
  calculateSummary,
  fetchReadings
};
