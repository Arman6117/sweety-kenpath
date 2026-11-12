/**
 * Pure validation utilities for glucose readings.
 * Decoupled from Prisma and database dependencies for fast, deterministic unit testing.
 */

const ALLOWED_SLOTS = [
  "MORNING",
  "AFTER_BREAKFAST",
  "AFTER_LUNCH",
  "AFTER_DINNER"
];

const SLOT_ORDER = {
  MORNING: 1,
  AFTER_BREAKFAST: 2,
  AFTER_LUNCH: 3,
  AFTER_DINNER: 4
};

const MIN_GLUCOSE_VALUE = 40;
const MAX_GLUCOSE_VALUE = 600;

// UUID v4 / RFC 4122 regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a string is a valid UUID.
 * @param {string} id
 * @returns {boolean}
 */
function isValidUuid(id) {
  if (typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Convert slot name into human-readable label.
 * @param {string} slot
 * @returns {string}
 */
function getSlotLabel(slot) {
  if (typeof slot !== "string") return "reading";
  return slot.toLowerCase().replaceAll("_", " ");
}

/**
 * Generate duplicate reading error message.
 * @param {string} slot
 * @returns {string}
 */
function getDuplicateMessage(slot) {
  return `You already have an ${getSlotLabel(slot)} reading for this date.`;
}

/**
 * Returns today's calendar date in IST (Asia/Kolkata) as 'YYYY-MM-DD'.
 * @returns {string}
 */
function getTodayInIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

/**
 * Validates date in YYYY-MM-DD format and ensures it is not a future date.
 * Returns null if invalid or in the future; otherwise returns a Date object.
 * @param {string} dateString
 * @returns {Date|null}
 */
function validateReadingDate(dateString) {
  if (typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const date = new Date(`${dateString}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateString) {
    return null;
  }

  const indiaToday = getTodayInIndia();

  if (dateString > indiaToday) {
    return null;
  }

  return date;
}

/**
 * Validates glucose reading value.
 * Must be a whole integer between 40 and 600 inclusive.
 * @param {any} value
 * @returns {{ isValid: boolean, error?: string }}
 */
function validateReadingValue(value) {
  if (value === undefined || value === null || value === "") {
    return { isValid: false, error: "Please enter a glucose value." };
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { isValid: false, error: "Glucose value must be a whole number." };
  }

  if (value < MIN_GLUCOSE_VALUE || value > MAX_GLUCOSE_VALUE) {
    return {
      isValid: false,
      error: `Value must be between ${MIN_GLUCOSE_VALUE} and ${MAX_GLUCOSE_VALUE} mg/dl.`
    };
  }

  return { isValid: true };
}

/**
 * Validates slot identifier.
 * @param {string} slot
 * @returns {{ isValid: boolean, error?: string }}
 */
function validateReadingSlot(slot) {
  if (!slot) {
    return { isValid: false, error: "Reading slot is required." };
  }

  if (!ALLOWED_SLOTS.includes(slot)) {
    return { isValid: false, error: "Invalid reading slot." };
  }

  return { isValid: true };
}

/**
 * Validates glucose reading creation payload.
 * Returns string error message or null if valid (matching legacy interface).
 * @param {{ date: string, slot: string, value: any }} payload
 * @returns {string|null}
 */
function validateReading({ date, slot, value }) {
  if (!date || !slot) {
    return "Date and slot are required.";
  }

  const valueValidation = validateReadingValue(value);
  if (!valueValidation.isValid) {
    // If value is missing/empty, return specific message
    if (value === undefined || value === null || value === "") {
      return "Please enter a glucose value.";
    }
  }

  const readingDate = validateReadingDate(date);

  if (!readingDate) {
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const parsedDate = new Date(`${date}T00:00:00.000Z`);
      if (!Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date) {
        return "Date cannot be in the future.";
      }
    }
    return "Please provide a valid date.";
  }

  const slotValidation = validateReadingSlot(slot);
  if (!slotValidation.isValid) {
    return slotValidation.error;
  }

  if (!valueValidation.isValid) {
    return "Value must be between 40 and 600 mg/dl.";
  }

  return null;
}

/**
 * Validates date filter query parameter.
 * @param {string} dateString
 * @returns {boolean}
 */
function isValidDateFilter(dateString) {
  if (typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const date = new Date(`${dateString}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString;
}

module.exports = {
  ALLOWED_SLOTS,
  SLOT_ORDER,
  MIN_GLUCOSE_VALUE,
  MAX_GLUCOSE_VALUE,
  isValidUuid,
  getSlotLabel,
  getDuplicateMessage,
  getTodayInIndia,
  validateReadingDate,
  validateReadingValue,
  validateReadingSlot,
  validateReading,
  isValidDateFilter
};
