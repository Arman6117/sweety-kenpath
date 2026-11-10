
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
    calculateSummary
} = require("../src/controllers/reportController");

describe("Report Summary Calculations", () => {
    it("calculates highest, lowest, average and count", () => {
        const readings = [
            { value: 100 },
            { value: 150 },
            { value: 125 }
        ];

        assert.deepEqual(calculateSummary(readings), {
            highest: 150,
            lowest: 100,
            average: 125,
            count: 3
        });
    });

    it("rounds the average to one decimal place", () => {
        const readings = [
            { value: 100 },
            { value: 101 },
            { value: 102 }
        ];

        assert.deepEqual(calculateSummary(readings), {
            highest: 102,
            lowest: 100,
            average: 101,
            count: 3
        });
    });

    it("returns null statistics for an empty report", () => {
        assert.deepEqual(calculateSummary([]), {
            highest: null,
            lowest: null,
            average: null,
            count: 0
        });
    });

    it("handles a report containing one reading", () => {
        assert.deepEqual(calculateSummary([{ value: 140 }]), {
            highest: 140,
            lowest: 140,
            average: 140,
            count: 1
        });
    });
});
