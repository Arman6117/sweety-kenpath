
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
    validateReading,
    validateReadingDate,
    ALLOWED_SLOTS
} = require("../src/controllers/readingController");

function getYesterday() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

describe("Glucose Reading Validation", () => {
    const validDate = getYesterday();

    it("accepts a valid glucose reading", () => {
        assert.equal(
            validateReading({
                date: validDate,
                slot: "MORNING",
                value: 100
            }),
            null
        );
    });

    it("rejects a missing glucose value", () => {
        assert.notEqual(
            validateReading({
                date: validDate,
                slot: "MORNING",
                value: undefined
            }),
            null
        );
    });

    it("rejects values below 40", () => {
        assert.notEqual(
            validateReading({
                date: validDate,
                slot: "MORNING",
                value: 39
            }),
            null
        );
    });

    it("rejects values above 600", () => {
        assert.notEqual(
            validateReading({
                date: validDate,
                slot: "MORNING",
                value: 601
            }),
            null
        );
    });

    it("rejects decimal glucose values", () => {
        assert.notEqual(
            validateReading({
                date: validDate,
                slot: "MORNING",
                value: 100.5
            }),
            null
        );
    });

    it("accepts the minimum valid value", () => {
        assert.equal(
            validateReading({
                date: validDate,
                slot: "MORNING",
                value: 40
            }),
            null
        );
    });

    it("accepts the maximum valid value", () => {
        assert.equal(
            validateReading({
                date: validDate,
                slot: "MORNING",
                value: 600
            }),
            null
        );
    });

    it("rejects an invalid reading slot", () => {
        assert.notEqual(
            validateReading({
                date: validDate,
                slot: "INVALID_SLOT",
                value: 100
            }),
            null
        );
    });

    it("rejects an invalid date format", () => {
        assert.equal(validateReadingDate("09-11-2026"), null);
    });

    it("rejects an impossible calendar date", () => {
        assert.equal(validateReadingDate("2026-02-30"), null);
    });

    it("rejects a future date", () => {
        assert.equal(validateReadingDate("2999-01-01"), null);
    });

    it("accepts all four configured reading slots", () => {
        assert.deepEqual(ALLOWED_SLOTS, [
            "MORNING",
            "AFTER_BREAKFAST",
            "AFTER_LUNCH",
            "AFTER_DINNER"
        ]);
    });
});
