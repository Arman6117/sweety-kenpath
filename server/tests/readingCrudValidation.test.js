const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  validateReading,
  validateReadingDate,
  validateReadingValue,
  validateReadingSlot,
  isValidUuid,
  isValidDateFilter,
  ALLOWED_SLOTS
} = require("../src/utils/readingValidation");

function getPastDate(daysAgo = 1) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

describe("Reading CRUD — Pure Validation Unit Tests", () => {
  const validDate = getPastDate(2);

  describe("Glucose Value Bounds & Types", () => {
    it("accepts minimum valid value of 40", () => {
      const res = validateReadingValue(40);
      assert.equal(res.isValid, true);
    });

    it("accepts maximum valid value of 600", () => {
      const res = validateReadingValue(600);
      assert.equal(res.isValid, true);
    });

    it("accepts typical clinical values (e.g. 95, 120, 180)", () => {
      assert.equal(validateReadingValue(95).isValid, true);
      assert.equal(validateReadingValue(120).isValid, true);
      assert.equal(validateReadingValue(180).isValid, true);
    });

    it("rejects value 39 (below lower bound)", () => {
      const res = validateReadingValue(39);
      assert.equal(res.isValid, false);
      assert.match(res.error, /between 40 and 600/i);
    });

    it("rejects value 601 (above upper bound)", () => {
      const res = validateReadingValue(601);
      assert.equal(res.isValid, false);
      assert.match(res.error, /between 40 and 600/i);
    });

    it("rejects decimal values (e.g. 100.5, 40.1, 599.9)", () => {
      assert.equal(validateReadingValue(100.5).isValid, false);
      assert.equal(validateReadingValue(40.1).isValid, false);
      assert.equal(validateReadingValue(599.9).isValid, false);
      assert.match(validateReadingValue(100.5).error, /whole number/i);
    });

    it("rejects missing, null, undefined, and empty values", () => {
      assert.equal(validateReadingValue(undefined).isValid, false);
      assert.equal(validateReadingValue(null).isValid, false);
      assert.equal(validateReadingValue("").isValid, false);
    });

    it("rejects string number values (e.g. '120')", () => {
      const res = validateReadingValue("120");
      assert.equal(res.isValid, false);
      assert.match(res.error, /whole number/i);
    });
  });

  describe("Allowed Reading Slots", () => {
    it("recognizes exactly four clinical reading slots", () => {
      assert.deepEqual(ALLOWED_SLOTS, [
        "MORNING",
        "AFTER_BREAKFAST",
        "AFTER_LUNCH",
        "AFTER_DINNER"
      ]);
    });

    it("accepts each of the four allowed slots", () => {
      for (const slot of ALLOWED_SLOTS) {
        assert.equal(validateReadingSlot(slot).isValid, true);
      }
    });

    it("rejects unlisted slot identifiers", () => {
      assert.equal(validateReadingSlot("FASTING").isValid, false);
      assert.equal(validateReadingSlot("BEDTIME").isValid, false);
      assert.equal(validateReadingSlot("SNACK").isValid, false);
      assert.equal(validateReadingSlot("random_slot").isValid, false);
    });

    it("rejects missing slot", () => {
      assert.equal(validateReadingSlot(null).isValid, false);
      assert.equal(validateReadingSlot("").isValid, false);
    });
  });

  describe("Reading Date Validation", () => {
    it("accepts valid past calendar date", () => {
      const date = validateReadingDate("2026-01-15");
      assert.ok(date instanceof Date);
    });

    it("rejects future dates", () => {
      assert.equal(validateReadingDate("2999-12-31"), null);
      assert.equal(validateReadingDate("2030-01-01"), null);
    });

    it("rejects impossible calendar dates", () => {
      assert.equal(validateReadingDate("2026-02-30"), null);
      assert.equal(validateReadingDate("2026-04-31"), null);
      assert.equal(validateReadingDate("2026-13-01"), null);
    });

    it("rejects malformed date strings", () => {
      assert.equal(validateReadingDate("15-01-2026"), null);
      assert.equal(validateReadingDate("2026/01/15"), null);
      assert.equal(validateReadingDate("not-a-date"), null);
      assert.equal(validateReadingDate(null), null);
    });
  });

  describe("Combined validateReading Payload Checker", () => {
    it("accepts valid reading payload", () => {
      const err = validateReading({
        date: validDate,
        slot: "MORNING",
        value: 110
      });
      assert.equal(err, null);
    });

    it("rejects missing date", () => {
      const err = validateReading({
        slot: "MORNING",
        value: 110
      });
      assert.match(err, /date and slot are required/i);
    });

    it("rejects missing slot", () => {
      const err = validateReading({
        date: validDate,
        value: 110
      });
      assert.match(err, /date and slot are required/i);
    });

    it("rejects missing value with specific message", () => {
      const err = validateReading({
        date: validDate,
        slot: "MORNING"
      });
      assert.match(err, /please enter a glucose value/i);
    });

    it("rejects future date with specific message", () => {
      const err = validateReading({
        date: "2099-01-01",
        slot: "MORNING",
        value: 110
      });
      assert.match(err, /future/i);
    });
  });

  describe("UUID and Date Filter Helpers", () => {
    it("validates UUID v4 format correctly", () => {
      assert.equal(isValidUuid("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"), true);
      assert.equal(isValidUuid("550e8400-e29b-41d4-a716-446655440000"), true);
      assert.equal(isValidUuid("not-a-uuid"), false);
      assert.equal(isValidUuid("12345"), false);
      assert.equal(isValidUuid(null), false);
    });

    it("validates date filter query parameter correctly", () => {
      assert.equal(isValidDateFilter("2026-11-10"), true);
      assert.equal(isValidDateFilter("2026-02-30"), false);
      assert.equal(isValidDateFilter("invalid"), false);
    });
  });
});
