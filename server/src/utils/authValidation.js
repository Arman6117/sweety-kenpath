/**
 * Pure authentication validation utilities.
 * Tested in isolation without requiring database or Prisma dependencies.
 */

// RFC 5322 compliant simplified email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const MIN_PASSWORD_LENGTH = 8;

/**
 * Normalizes email address by trimming and converting to lower case.
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/**
 * Validates whether the given email format is valid.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;
  return EMAIL_REGEX.test(normalized);
}

/**
 * Validates whether the password meets length requirements.
 * @param {string} password
 * @returns {boolean}
 */
function isValidPassword(password) {
  if (typeof password !== "string") return false;
  return password.length >= MIN_PASSWORD_LENGTH;
}

/**
 * Validates user registration payload.
 * @param {object} payload
 * @returns {{ isValid: boolean, error?: string, data?: { name: string, email: string, password: string } }}
 */
function validateRegistration(payload) {
  if (!payload || typeof payload !== "object") {
    return { isValid: false, error: "Registration payload must be a valid JSON object." };
  }

  const { name, email, password } = payload;

  if (name === undefined || name === null || email === undefined || email === null || password === undefined || password === null) {
    return { isValid: false, error: "Name, email and password are required." };
  }

  if (typeof name !== "string" || !name.trim()) {
    return { isValid: false, error: "Name must be a non-empty string." };
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 100) {
    return { isValid: false, error: "Name must not exceed 100 characters." };
  }

  if (typeof email !== "string" || !email.trim()) {
    return { isValid: false, error: "Email is required." };
  }

  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { isValid: false, error: "Please provide a valid email address." };
  }

  if (typeof password !== "string") {
    return { isValid: false, error: "Password must be a string." };
  }

  if (!isValidPassword(password)) {
    return {
      isValid: false,
      error: `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`
    };
  }

  return {
    isValid: true,
    data: {
      name: trimmedName,
      email: normalized,
      password
    }
  };
}

/**
 * Validates user login payload.
 * @param {object} payload
 * @returns {{ isValid: boolean, error?: string, data?: { email: string, password: string } }}
 */
function validateLogin(payload) {
  if (!payload || typeof payload !== "object") {
    return { isValid: false, error: "Login payload must be a valid JSON object." };
  }

  const { email, password } = payload;

  if (!email || !password) {
    return { isValid: false, error: "Email and password are required." };
  }

  if (typeof email !== "string" || !email.trim()) {
    return { isValid: false, error: "Email is required." };
  }

  if (typeof password !== "string") {
    return { isValid: false, error: "Password must be a string." };
  }

  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { isValid: false, error: "Please provide a valid email address." };
  }

  return {
    isValid: true,
    data: {
      email: normalized,
      password
    }
  };
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  validateRegistration,
  validateLogin
};
