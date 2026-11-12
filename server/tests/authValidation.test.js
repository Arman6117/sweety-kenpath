const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  validateRegistration,
  validateLogin,
  isValidEmail,
  isValidPassword,
  normalizeEmail
} = require("../src/utils/authValidation");

describe("Auth Validation — Pure Utility Functions", () => {
  describe("normalizeEmail", () => {
    it("trims whitespace and converts to lower case", () => {
      assert.equal(normalizeEmail("  User.Test@Example.COM  "), "user.test@example.com");
    });

    it("returns empty string for non-string values", () => {
      assert.equal(normalizeEmail(null), "");
      assert.equal(normalizeEmail(undefined), "");
      assert.equal(normalizeEmail(12345), "");
    });
  });

  describe("isValidEmail", () => {
    it("accepts standard valid email addresses", () => {
      assert.equal(isValidEmail("user@example.com"), true);
      assert.equal(isValidEmail("first.last@clinical.org"), true);
      assert.equal(isValidEmail("user+tag@domain.co.uk"), true);
    });

    it("rejects emails missing @ symbol", () => {
      assert.equal(isValidEmail("userexample.com"), false);
    });

    it("rejects emails missing domain", () => {
      assert.equal(isValidEmail("user@"), false);
      assert.equal(isValidEmail("user@.com"), false);
    });

    it("rejects emails missing top-level domain", () => {
      assert.equal(isValidEmail("user@domain"), false);
    });

    it("rejects emails with internal whitespace", () => {
      assert.equal(isValidEmail("user name@example.com"), false);
    });

    it("rejects non-string values", () => {
      assert.equal(isValidEmail(null), false);
      assert.equal(isValidEmail(undefined), false);
      assert.equal(isValidEmail({}), false);
    });
  });

  describe("isValidPassword", () => {
    it("accepts passwords with 8 or more characters", () => {
      assert.equal(isValidPassword("12345678"), true);
      assert.equal(isValidPassword("ComplexPassword!2026"), true);
    });

    it("rejects passwords shorter than 8 characters", () => {
      assert.equal(isValidPassword("1234567"), false);
      assert.equal(isValidPassword("short"), false);
      assert.equal(isValidPassword(""), false);
    });

    it("rejects non-string values", () => {
      assert.equal(isValidPassword(null), false);
      assert.equal(isValidPassword(undefined), false);
      assert.equal(isValidPassword(12345678), false);
    });
  });

  describe("validateRegistration", () => {
    it("accepts a complete, valid registration payload", () => {
      const result = validateRegistration({
        name: "Dr. Jane Doe",
        email: "jane.doe@hospital.org",
        password: "SecurePassword123"
      });

      assert.equal(result.isValid, true);
      assert.equal(result.data.name, "Dr. Jane Doe");
      assert.equal(result.data.email, "jane.doe@hospital.org");
      assert.equal(result.data.password, "SecurePassword123");
    });

    it("trims name and normalizes email", () => {
      const result = validateRegistration({
        name: "   Dr. Jane Doe   ",
        email: "  JANE.DOE@Hospital.ORG  ",
        password: "SecurePassword123"
      });

      assert.equal(result.isValid, true);
      assert.equal(result.data.name, "Dr. Jane Doe");
      assert.equal(result.data.email, "jane.doe@hospital.org");
    });

    it("rejects missing name", () => {
      const result = validateRegistration({
        email: "jane.doe@hospital.org",
        password: "SecurePassword123"
      });

      assert.equal(result.isValid, false);
      assert.match(result.error, /required/i);
    });

    it("rejects whitespace-only name", () => {
      const result = validateRegistration({
        name: "    ",
        email: "jane.doe@hospital.org",
        password: "SecurePassword123"
      });

      assert.equal(result.isValid, false);
      assert.match(result.error, /non-empty/i);
    });

    it("rejects missing email", () => {
      const result = validateRegistration({
        name: "Jane Doe",
        password: "SecurePassword123"
      });

      assert.equal(result.isValid, false);
      assert.match(result.error, /required/i);
    });

    it("rejects malformed email format", () => {
      const result = validateRegistration({
        name: "Jane Doe",
        email: "not-an-email",
        password: "SecurePassword123"
      });

      assert.equal(result.isValid, false);
      assert.match(result.error, /valid email/i);
    });

    it("rejects missing password", () => {
      const result = validateRegistration({
        name: "Jane Doe",
        email: "jane.doe@hospital.org"
      });

      assert.equal(result.isValid, false);
      assert.match(result.error, /required/i);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = validateRegistration({
        name: "Jane Doe",
        email: "jane.doe@hospital.org",
        password: "short"
      });

      assert.equal(result.isValid, false);
      assert.match(result.error, /at least 8 characters/i);
    });

    it("accepts password with exactly 8 characters", () => {
      const result = validateRegistration({
        name: "Jane Doe",
        email: "jane.doe@hospital.org",
        password: "12345678"
      });

      assert.equal(result.isValid, true);
    });

    it("rejects non-object payload", () => {
      assert.equal(validateRegistration(null).isValid, false);
      assert.equal(validateRegistration(undefined).isValid, false);
      assert.equal(validateRegistration("string").isValid, false);
    });
  });

  describe("validateLogin", () => {
    it("accepts a valid login payload", () => {
      const result = validateLogin({
        email: "user@example.com",
        password: "SecretPassword123"
      });

      assert.equal(result.isValid, true);
      assert.equal(result.data.email, "user@example.com");
      assert.equal(result.data.password, "SecretPassword123");
    });

    it("rejects missing email", () => {
      const result = validateLogin({
        password: "SecretPassword123"
      });

      assert.equal(result.isValid, false);
      assert.match(result.error, /required/i);
    });

    it("rejects missing password", () => {
      const result = validateLogin({
        email: "user@example.com"
      });

      assert.equal(result.isValid, false);
      assert.match(result.error, /required/i);
    });

    it("rejects malformed email format", () => {
      const result = validateLogin({
        email: "invalid-email-address",
        password: "SecretPassword123"
      });

      assert.equal(result.isValid, false);
      assert.match(result.error, /valid email/i);
    });

    it("normalizes email on valid login", () => {
      const result = validateLogin({
        email: "  User@Example.COM  ",
        password: "SecretPassword123"
      });

      assert.equal(result.isValid, true);
      assert.equal(result.data.email, "user@example.com");
    });
  });
});
