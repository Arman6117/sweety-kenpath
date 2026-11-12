const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateSummary,
  validateReportDate,
  getMonthToDateRange,
  getPreviousMonthRange
} = require("../src/utils/reportUtils");

describe("Report Utilities — Pure Function Unit Tests", () => {
  describe("calculateSummary", () => {
    it("returns null statistics and zero count for empty array", () => {
      assert.deepEqual(calculateSummary([]), {
        highest: null,
        lowest: null,
        average: null,
        count: 0
      });
    });

    it("returns null statistics for null or undefined input", () => {
      assert.deepEqual(calculateSummary(null), {
        highest: null,
        lowest: null,
        average: null,
        count: 0
      });
      assert.deepEqual(calculateSummary(undefined), {
        highest: null,
        lowest: null,
        average: null,
        count: 0
      });
    });

    it("handles a single reading correctly", () => {
      assert.deepEqual(calculateSummary([{ value: 135 }]), {
        highest: 135,
        lowest: 135,
        average: 135,
        count: 1
      });
    });

    it("calculates highest, lowest, count, and whole number average", () => {
      const readings = [
        { value: 90 },
        { value: 150 },
        { value: 120 }
      ];
      assert.deepEqual(calculateSummary(readings), {
        highest: 150,
        lowest: 90,
        average: 120,
        count: 3
      });
    });

    it("rounds average to exactly one decimal place", () => {
      // 100 + 101 = 201 / 2 = 100.5
      assert.equal(calculateSummary([{ value: 100 }, { value: 101 }]).average, 100.5);

      // 100 + 101 + 103 = 304 / 3 = 101.3333333333... -> 101.3
      assert.equal(calculateSummary([{ value: 100 }, { value: 101 }, { value: 103 }]).average, 101.3);

      // 100 + 100 + 102 = 302 / 3 = 100.6666666666... -> 100.7
      assert.equal(calculateSummary([{ value: 100 }, { value: 100 }, { value: 102 }]).average, 100.7);

      // 110 + 115 + 120 + 125 = 470 / 4 = 117.5
      assert.equal(calculateSummary([{ value: 110 }, { value: 115 }, { value: 120 }, { value: 125 }]).average, 117.5);
    });

    it("filters out items without numeric values safely", () => {
      const readings = [
        { value: 100 },
        { value: null },
        { value: "invalid" },
        { value: 200 }
      ];
      assert.deepEqual(calculateSummary(readings), {
        highest: 200,
        lowest: 100,
        average: 150,
        count: 2
      });
    });
  });

  describe("validateReportDate", () => {
    it("accepts valid past calendar date", () => {
      const res = validateReportDate("2026-05-15");
      assert.equal(res.isValid, true);
      assert.equal(res.dateString, "2026-05-15");
      assert.ok(res.parsedDate instanceof Date);
    });

    it("rejects future dates", () => {
      const res = validateReportDate("2099-01-01");
      assert.equal(res.isValid, false);
      assert.match(res.error, /future/i);
    });

    it("rejects invalid date formats", () => {
      assert.equal(validateReportDate("15-05-2026").isValid, false);
      assert.equal(validateReportDate("2026/05/15").isValid, false);
      assert.equal(validateReportDate("not-a-date").isValid, false);
      assert.equal(validateReportDate("").isValid, false);
      assert.equal(validateReportDate(null).isValid, false);
    });

    it("rejects impossible calendar dates", () => {
      assert.equal(validateReportDate("2026-02-30").isValid, false);
      assert.equal(validateReportDate("2026-04-31").isValid, false);
      assert.equal(validateReportDate("2026-13-01").isValid, false);
    });
  });

  describe("getMonthToDateRange", () => {
    it("starts on day 1 and ends on selected date (inclusive)", () => {
      const range = getMonthToDateRange("2026-10-15");
      assert.equal(range.startDateString, "2026-10-01");
      assert.equal(range.endDateString, "2026-10-15");
      assert.equal(range.startDate.toISOString().slice(0, 10), "2026-10-01");
      assert.equal(range.endDate.toISOString().slice(0, 10), "2026-10-15");
    });

    it("handles the first day of the month correctly", () => {
      const range = getMonthToDateRange("2026-07-01");
      assert.equal(range.startDateString, "2026-07-01");
      assert.equal(range.endDateString, "2026-07-01");
    });

    it("handles the end of the month correctly", () => {
      const range = getMonthToDateRange("2026-08-31");
      assert.equal(range.startDateString, "2026-08-01");
      assert.equal(range.endDateString, "2026-08-31");
    });
  });

  describe("getPreviousMonthRange — Month Boundaries & Leap Years", () => {
    it("handles January date by crossing year boundary to December of previous year", () => {
      const range = getPreviousMonthRange("2026-01-20");
      assert.equal(range.startDateString, "2025-12-01");
      assert.equal(range.endDateString, "2025-12-31");
    });

    it("handles March date in non-leap year (February 28 days)", () => {
      const range = getPreviousMonthRange("2026-03-15");
      assert.equal(range.startDateString, "2026-02-01");
      assert.equal(range.endDateString, "2026-02-28");
    });

    it("handles March date in leap year (February 29 days)", () => {
      const range = getPreviousMonthRange("2024-03-15");
      assert.equal(range.startDateString, "2024-02-01");
      assert.equal(range.endDateString, "2024-02-29");
    });

    it("handles May date (April has 30 days)", () => {
      const range = getPreviousMonthRange("2026-05-10");
      assert.equal(range.startDateString, "2026-04-01");
      assert.equal(range.endDateString, "2026-04-30");
    });

    it("handles August date (July has 31 days)", () => {
      const range = getPreviousMonthRange("2026-08-01");
      assert.equal(range.startDateString, "2026-07-01");
      assert.equal(range.endDateString, "2026-07-31");
    });

    it("handles December date (November has 30 days)", () => {
      const range = getPreviousMonthRange("2026-12-05");
      assert.equal(range.startDateString, "2026-11-01");
      assert.equal(range.endDateString, "2026-11-30");
    });
  });
});
