/**
 * Pure utility functions for blood glucose report calculations and calendar date ranges.
 * Fully decoupled from Prisma and external databases for deterministic unit testing.
 */

const { getTodayInIndia } = require("./readingValidation");

/**
 * Calculates summary statistics for a collection of readings:
 * - highest: maximum glucose value, or null if empty
 * - lowest: minimum glucose value, or null if empty
 * - average: mean glucose value rounded to exactly one decimal place, or null if empty
 * - count: total number of readings
 * 
 * @param {Array<{ value: number }>} readings
 * @returns {{ highest: number|null, lowest: number|null, average: number|null, count: number }}
 */
function calculateSummary(readings) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return {
      highest: null,
      lowest: null,
      average: null,
      count: 0
    };
  }

  const values = readings.map((r) => r.value).filter((v) => typeof v === "number" && !Number.isNaN(v));

  if (values.length === 0) {
    return {
      highest: null,
      lowest: null,
      average: null,
      count: 0
    };
  }

  const highest = Math.max(...values);
  const lowest = Math.min(...values);

  const sum = values.reduce((total, val) => total + val, 0);
  const average = Math.round((sum / values.length) * 10) / 10;

  return {
    highest,
    lowest,
    average,
    count: values.length
  };
}

/**
 * Validates report date string (YYYY-MM-DD), ensuring calendar validity and preventing future dates.
 * @param {string} dateString
 * @returns {{ isValid: boolean, error?: string, parsedDate?: Date, dateString?: string }}
 */
function validateReportDate(dateString) {
  if (!dateString || typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return {
      isValid: false,
      error: "Please provide a valid date in YYYY-MM-DD format."
    };
  }

  const parsedDate = new Date(`${dateString}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateString) {
    return {
      isValid: false,
      error: "Please provide a valid calendar date."
    };
  }

  const today = getTodayInIndia();

  if (dateString > today) {
    return {
      isValid: false,
      error: "Future dates are not allowed."
    };
  }

  return {
    isValid: true,
    parsedDate,
    dateString
  };
}

/**
 * Computes Month-to-Date range for a given date.
 * Starts from day 1 of that month and ends on the selected date (inclusive).
 * Does NOT extend past the selected date.
 * 
 * @param {string} dateString - Validated date in YYYY-MM-DD format
 * @returns {{ startDate: Date, endDate: Date, startDateString: string, endDateString: string }}
 */
function getMonthToDateRange(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month - 1, day));

  const startDateString = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDateString = dateString;

  return {
    startDate,
    endDate,
    startDateString,
    endDateString
  };
}

/**
 * Computes the Previous Full Month range immediately before the selected date's month.
 * Correctly handles:
 * - December to November
 * - January to December of previous year (year boundary crossing)
 * - Leap years and non-leap years (28 or 29 days in February)
 * - 30-day and 31-day months
 * 
 * @param {string} dateString - Validated date in YYYY-MM-DD format
 * @returns {{ startDate: Date, endDate: Date, startDateString: string, endDateString: string }}
 */
function getPreviousMonthRange(dateString) {
  const [year, month] = dateString.split("-").map(Number);

  let prevYear = year;
  let prevMonth = month - 1;

  if (prevMonth === 0) {
    prevYear = year - 1;
    prevMonth = 12;
  }

  const prevMonthIndex = prevMonth - 1;

  // First day of previous month
  const startDate = new Date(Date.UTC(prevYear, prevMonthIndex, 1));

  // Last day of previous month: day 0 of (prevMonthIndex + 1)
  const endDate = new Date(Date.UTC(prevYear, prevMonthIndex + 1, 0));

  const startDateString = startDate.toISOString().slice(0, 10);
  const endDateString = endDate.toISOString().slice(0, 10);

  return {
    startDate,
    endDate,
    startDateString,
    endDateString
  };
}

module.exports = {
  calculateSummary,
  validateReportDate,
  getMonthToDateRange,
  getPreviousMonthRange
};
