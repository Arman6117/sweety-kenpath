const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");

const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Reports API — Integration Tests", () => {
  let server;
  let baseUrl;
  let isDbAvailable = false;
  let isLoopbackAvailable = false;

  const runId = crypto.randomUUID().slice(0, 8);
  const userAData = {
    name: "Dr. Carol Reports",
    email: `carol.${runId}@kenpath.reports.test`,
    password: "Password123!"
  };
  const userBData = {
    name: "Dr. Dave Reports",
    email: `dave.${runId}@kenpath.reports.test`,
    password: "Password123!"
  };

  let tokenA = null;
  let userIdA = null;
  let tokenB = null;
  let userIdB = null;

  before(async () => {
    server = http.createServer(app);
    try {
      await new Promise((resolve, reject) => {
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
          const port = server.address().port;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });

      const probeRes = await fetch(`${baseUrl}/`).catch(() => null);
      if (probeRes && probeRes.status === 200) {
        isLoopbackAvailable = true;
      }
    } catch (e) {
      isLoopbackAvailable = false;
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      if (isLoopbackAvailable) {
        // Register User A
        const regA = await fetch(`${baseUrl}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userAData)
        });
        const resA = await regA.json();
        tokenA = resA.token;
        userIdA = resA.user?.id;

        // Register User B
        const regB = await fetch(`${baseUrl}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userBData)
        });
        const resB = await regB.json();
        tokenB = resB.token;
        userIdB = resB.user?.id;

        // Seed readings for User A:
        // Day 1: 2026-09-15 (4 readings: 90, 140, 155, 115) -> total = 500, avg = 125.0
        const readingsDay1 = [
          { date: "2026-09-15", slot: "MORNING", value: 90 },
          { date: "2026-09-15", slot: "AFTER_BREAKFAST", value: 140 },
          { date: "2026-09-15", slot: "AFTER_LUNCH", value: 155 },
          { date: "2026-09-15", slot: "AFTER_DINNER", value: 115 }
        ];
        for (const r of readingsDay1) {
          await fetch(`${baseUrl}/api/readings`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify(r)
          });
        }

        // Day 2: 2026-09-20 (2 readings: 100, 160)
        const readingsDay2 = [
          { date: "2026-09-20", slot: "MORNING", value: 100 },
          { date: "2026-09-20", slot: "AFTER_LUNCH", value: 160 }
        ];
        for (const r of readingsDay2) {
          await fetch(`${baseUrl}/api/readings`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify(r)
          });
        }

        // Day 3: 2026-09-28 (1 reading: 130) -> test MTD cutoff
        await fetch(`${baseUrl}/api/readings`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
          body: JSON.stringify({ date: "2026-09-28", slot: "AFTER_DINNER", value: 130 })
        });

        // Previous Month: 2026-08-10 (2 readings: 95, 145) -> avg = 120.0
        const readingsPrevMonth = [
          { date: "2026-08-10", slot: "MORNING", value: 95 },
          { date: "2026-08-10", slot: "AFTER_LUNCH", value: 145 }
        ];
        for (const r of readingsPrevMonth) {
          await fetch(`${baseUrl}/api/readings`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify(r)
          });
        }

        // Seed a reading for User B on 2026-09-15 (value 500) to test isolation
        await fetch(`${baseUrl}/api/readings`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenB}` },
          body: JSON.stringify({ date: "2026-09-15", slot: "MORNING", value: 500 })
        });
      }
    } catch (e) {
      isDbAvailable = false;
    }
  });

  after(async () => {
    if (isDbAvailable) {
      try {
        if (userIdA) await prisma.user.delete({ where: { id: userIdA } });
        if (userIdB) await prisma.user.delete({ where: { id: userIdB } });
      } catch (e) {}
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. UNAUTHORIZED REQUESTS
  it("rejects unauthorized report requests without token (HTTP 401)", async (t) => {
    if (!isLoopbackAvailable) return t.skip("Loopback restricted");

    const resDaily = await fetch(`${baseUrl}/api/reports/daily?date=2026-09-15`);
    assert.equal(resDaily.status, 401);

    const resMtd = await fetch(`${baseUrl}/api/reports/month-to-date?date=2026-09-15`);
    assert.equal(resMtd.status, 401);

    const resPrev = await fetch(`${baseUrl}/api/reports/previous-month?date=2026-09-15`);
    assert.equal(resPrev.status, 401);
  });

  // 2. INPUT VALIDATION & FUTURE DATES
  it("rejects daily report request without date parameter (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/reports/daily`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /valid date in YYYY-MM-DD format/i);
  });

  it("rejects future dates for all report types (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const resDaily = await fetch(`${baseUrl}/api/reports/daily?date=2099-01-01`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resDaily.status, 400);

    const resMtd = await fetch(`${baseUrl}/api/reports/month-to-date?date=2099-01-01`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resMtd.status, 400);

    const resPrev = await fetch(`${baseUrl}/api/reports/previous-month?date=2099-01-01`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resPrev.status, 400);
  });

  it("rejects impossible calendar dates (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/reports/daily?date=2026-02-30`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(res.status, 400);
  });

  // 3. DAILY REPORT WITH READINGS & USER ISOLATION
  it("generates daily report with readings, accurate summary stats, and strict user isolation", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/reports/daily?date=2026-09-15`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.report.type, "daily");
    assert.equal(data.report.date, "2026-09-15");
    assert.equal(data.report.readings.length, 4);

    // Verify summary statistics
    assert.equal(data.report.summary.highest, 155);
    assert.equal(data.report.summary.lowest, 90);
    assert.equal(data.report.summary.average, 125);
    assert.equal(data.report.summary.count, 4);

    // CRITICAL USER ISOLATION CHECK: User B's reading (500) must NOT appear
    for (const r of data.report.readings) {
      assert.equal(r.userId, userIdA);
      assert.notEqual(r.value, 500);
    }
  });

  // 4. DAILY REPORT WITH NO READINGS (FRIENDLY EMPTY STATE)
  it("returns friendly empty state with null statistics and count 0 when no readings exist", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/reports/daily?date=2026-09-16`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.report.readings.length, 0);
    assert.deepEqual(data.report.summary, {
      highest: null,
      lowest: null,
      average: null,
      count: 0
    });
  });

  // 5. MONTH-TO-DATE REPORT WITH SELECTED DATE EARLIER THAN TODAY
  it("generates month-to-date report starting on day 1 through selected date (inclusive)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    // Selected date: 2026-09-20.
    // Must include readings from 2026-09-01 through 2026-09-20 (Day 1: 4 readings, Day 2: 2 readings = 6).
    // Must NOT include reading from 2026-09-28!
    const res = await fetch(`${baseUrl}/api/reports/month-to-date?date=2026-09-20`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.report.type, "month-to-date");
    assert.equal(data.report.startDate, "2026-09-01");
    assert.equal(data.report.endDate, "2026-09-20");
    assert.equal(data.report.readings.length, 6);
    assert.equal(data.report.summary.count, 6);

    // Confirm that 2026-09-28 reading is excluded
    const dates = data.report.readings.map((r) => r.date.slice(0, 10));
    assert.equal(dates.includes("2026-09-28"), false);
  });

  // 6. PREVIOUS FULL MONTH REPORT
  it("generates previous full month report covering entire calendar month immediately prior", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    // Selected date in September 2026 -> Previous month is August 2026 (2026-08-01 to 2026-08-31)
    const res = await fetch(`${baseUrl}/api/reports/previous-month?date=2026-09-15`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.report.type, "previous-month");
    assert.equal(data.report.startDate, "2026-08-01");
    assert.equal(data.report.endDate, "2026-08-31");
    assert.equal(data.report.readings.length, 2);

    // Values: 95, 145 -> sum: 240 / 2 = 120.0
    assert.equal(data.report.summary.highest, 145);
    assert.equal(data.report.summary.lowest, 95);
    assert.equal(data.report.summary.average, 120);
    assert.equal(data.report.summary.count, 2);
  });

  // 7. PREVIOUS MONTH ACROSS YEAR BOUNDARY & EMPTY REPORT
  it("handles previous month across January/December year boundary and returns empty stats if no readings exist", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    // Selected date in January 2026 -> Previous month is December 2025 (2025-12-01 to 2025-12-31)
    const res = await fetch(`${baseUrl}/api/reports/previous-month?date=2026-01-10`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.report.startDate, "2025-12-01");
    assert.equal(data.report.endDate, "2025-12-31");
    assert.equal(data.report.readings.length, 0);
    assert.deepEqual(data.report.summary, {
      highest: null,
      lowest: null,
      average: null,
      count: 0
    });
  });
});
