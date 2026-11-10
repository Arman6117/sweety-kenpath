
const prisma = require("../config/prisma");

// Helper: Calculate report statistics
const calculateSummary = (readings) => {
  if (readings.length === 0) {
    return {
      highest: null,
      lowest: null,
      average: null,
      count: 0
    };
  }

  const values = readings.map((reading) => reading.value);

  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const average =
    Math.round(
      (values.reduce((total, value) => total + value, 0) /
        values.length) * 10
    ) / 10;

  return {
    highest,
    lowest,
    average,
    count: readings.length
  };
};

// Helper: Fetch readings belonging only to the logged-in user
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
      { createdAt: "asc" }
    ]
  });
};

// 1. Daily Report
const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date in YYYY-MM-DD format."
      });
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid calendar date."
      });
    }

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    if (date > today) {
      return res.status(400).json({
        success: false,
        message: "Future dates are not allowed."
      });
    }

    const readings = await fetchReadings(
      req.user.userId,
      parsedDate,
      parsedDate
    );

    return res.status(200).json({
      success: true,
      report: {
        type: "daily",
        date,
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

// 2. Month-to-Date Report
const getMonthToDateReport = async (req, res) => {
  try {
    const todayString = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    const [year, month, day] = todayString.split("-").map(Number);

    const startDate = new Date(
      Date.UTC(year, month - 1, 1)
    );

    const endDate = new Date(
      Date.UTC(year, month - 1, day)
    );

    const readings = await fetchReadings(
      req.user.userId,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      report: {
        type: "month-to-date",
        startDate: todayString.slice(0, 7) + "-01",
        endDate: todayString,
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

// 3. Previous Full Month Report
const getPreviousMonthReport = async (req, res) => {
  try {
    const todayString = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    const [year, month] = todayString.split("-").map(Number);

    const startDate = new Date(
      Date.UTC(year, month - 2, 1)
    );

    const endDate = new Date(
      Date.UTC(year, month - 1, 0)
    );

    const readings = await fetchReadings(
      req.user.userId,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      report: {
        type: "previous-month",
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
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
  calculateSummary
};
