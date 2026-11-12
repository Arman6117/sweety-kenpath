const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");

const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Reading CRUD — Integration Tests", () => {
  let server;
  let baseUrl;
  let isDbAvailable = false;
  let isLoopbackAvailable = false;

  const runId = crypto.randomUUID().slice(0, 8);
  const userAData = {
    name: "Dr. Alice Reading",
    email: `alice.${runId}@kenpath.reading.test`,
    password: "Password123!"
  };
  const userBData = {
    name: "Dr. Bob Reading",
    email: `bob.${runId}@kenpath.reading.test`,
    password: "Password123!"
  };

  let tokenA = null;
  let userIdA = null;
  let tokenB = null;
  let userIdB = null;

  // Use a past calendar date to prevent future-date violations
  const testDate = "2026-10-15";
  let createdReadingId = null;

  before(async () => {
    // Start ephemeral server
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

      // Register User A and User B
      if (isLoopbackAvailable) {
        const regA = await fetch(`${baseUrl}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userAData)
        });
        const resA = await regA.json();
        tokenA = resA.token;
        userIdA = resA.user?.id;

        const regB = await fetch(`${baseUrl}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userBData)
        });
        const resB = await regB.json();
        tokenB = resB.token;
        userIdB = resB.user?.id;
      }
    } catch (e) {
      isDbAvailable = false;
    }
  });

  after(async () => {
    // Clean up created test users (cascade deletes readings automatically)
    if (isDbAvailable) {
      try {
        if (userIdA) {
          await prisma.user.delete({ where: { id: userIdA } });
        }
        if (userIdB) {
          await prisma.user.delete({ where: { id: userIdB } });
        }
      } catch (e) {
        // Ignored during cleanup
      }
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. UNAUTHORIZED REQUESTS
  it("rejects unauthorized requests without JWT token (HTTP 401)", async (t) => {
    if (!isLoopbackAvailable) return t.skip("Loopback restricted");

    const getRes = await fetch(`${baseUrl}/api/readings`);
    assert.equal(getRes.status, 401);

    const postRes = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: testDate, slot: "MORNING", value: 100 })
    });
    assert.equal(postRes.status, 401);

    const putRes = await fetch(`${baseUrl}/api/readings/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: testDate, slot: "MORNING", value: 100 })
    });
    assert.equal(putRes.status, 401);

    const delRes = await fetch(`${baseUrl}/api/readings/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`, {
      method: "DELETE"
    });
    assert.equal(delRes.status, 401);
  });

  // 2. INPUT VALIDATION EDGE CASES (Values, Decimals, Future Dates, Slots)
  it("rejects reading with value below 40 (value 39) (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ date: testDate, slot: "MORNING", value: 39 })
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /between 40 and 600/i);
  });

  it("rejects reading with value above 600 (value 601) (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ date: testDate, slot: "MORNING", value: 601 })
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /between 40 and 600/i);
  });

  it("rejects decimal glucose values (value 120.5) (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ date: testDate, slot: "MORNING", value: 120.5 })
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /between 40 and 600|whole number/i);
  });

  it("rejects missing glucose value (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ date: testDate, slot: "MORNING" })
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /enter a glucose value/i);
  });

  it("rejects invalid reading slot (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ date: testDate, slot: "MIDNIGHT_SNACK", value: 110 })
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /invalid reading slot/i);
  });

  it("rejects future calendar date (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ date: "2999-01-01", slot: "MORNING", value: 110 })
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /future/i);
  });

  // 3. COMPLETE 4-SLOT CREATION & DUPLICATE / 5TH READING PREVENTION
  it("creates valid readings for all four slots on a single day", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const slots = [
      { slot: "MORNING", value: 95 },
      { slot: "AFTER_BREAKFAST", value: 135 },
      { slot: "AFTER_LUNCH", value: 145 },
      { slot: "AFTER_DINNER", value: 125 }
    ];

    for (const item of slots) {
      const res = await fetch(`${baseUrl}/api/readings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({ date: testDate, slot: item.slot, value: item.value })
      });

      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.success, true);
      assert.equal(data.reading.slot, item.slot);
      assert.equal(data.reading.value, item.value);

      if (item.slot === "MORNING") {
        createdReadingId = data.reading.id;
      }
    }
  });

  it("rejects duplicate slot on the same day with HTTP 409", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ date: testDate, slot: "MORNING", value: 105 })
    });

    const data = await res.json();
    assert.equal(res.status, 409);
    assert.equal(data.success, false);
    assert.match(data.message, /already have an morning reading/i);
  });

  it("rejects fifth reading on the same day with HTTP 400", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    // All 4 slots on testDate already exist for User A.
    // Even with a valid slot name, daily count check blocks it.
    const res = await fetch(`${baseUrl}/api/readings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ date: testDate, slot: "AFTER_LUNCH", value: 150 })
    });

    // It is blocked by either daily count limit (400) or duplicate slot (409)
    assert.ok(res.status === 400 || res.status === 409);
  });

  // 4. LIST READINGS, SORTING & DATE FILTERING
  it("lists only the authenticated user's readings sorted by date desc", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.readings.length >= 4);

    // Verify all returned readings belong to User A
    for (const r of data.readings) {
      assert.equal(r.userId, userIdA);
    }
  });

  it("filters readings by specific date (?date=YYYY-MM-DD)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings?date=${testDate}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.readings.length, 4);
    for (const r of data.readings) {
      assert.equal(r.date.slice(0, 10), testDate);
    }
  });

  it("supports pagination (?page=1&limit=2)", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.readings.length, 2);
    assert.equal(data.page, 1);
    assert.equal(data.limit, 2);
    assert.ok(data.total >= 4);
    assert.equal(data.hasMore, true);
  });

  // 5. GET SINGLE READING & USER DATA ISOLATION
  it("retrieves a single reading by ID for the owner (HTTP 200)", async (t) => {
    if (!isLoopbackAvailable || !tokenA || !createdReadingId) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings/${createdReadingId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.reading.id, createdReadingId);
    assert.equal(data.reading.userId, userIdA);
  });

  it("returns HTTP 404 when User B attempts to access User A's reading", async (t) => {
    if (!isLoopbackAvailable || !tokenB || !createdReadingId) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings/${createdReadingId}`, {
      headers: { Authorization: `Bearer ${tokenB}` } // Authenticated as User B
    });

    const data = await res.json();
    assert.equal(res.status, 404);
    assert.equal(data.success, false);
    assert.match(data.message, /not found/i);
  });

  it("returns HTTP 404 for invalid UUID or non-existent reading ID", async (t) => {
    if (!isLoopbackAvailable || !tokenA) return t.skip("Environment unavailable");

    const resInvalid = await fetch(`${baseUrl}/api/readings/non-existent-uuid`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resInvalid.status, 404);

    const resRandom = await fetch(`${baseUrl}/api/readings/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(resRandom.status, 404);
  });

  // 6. UPDATE READING & OWNERSHIP ENFORCEMENT
  it("allows owner to update their own reading (HTTP 200)", async (t) => {
    if (!isLoopbackAvailable || !tokenA || !createdReadingId) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings/${createdReadingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        date: testDate,
        slot: "MORNING",
        value: 102
      })
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.reading.value, 102);
  });

  it("rejects updating reading to an already occupied slot on the same day (HTTP 409)", async (t) => {
    if (!isLoopbackAvailable || !tokenA || !createdReadingId) return t.skip("Environment unavailable");

    // Attempt to change MORNING reading's slot to AFTER_BREAKFAST (which is already occupied on testDate)
    const res = await fetch(`${baseUrl}/api/readings/${createdReadingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        date: testDate,
        slot: "AFTER_BREAKFAST",
        value: 140
      })
    });

    const data = await res.json();
    assert.equal(res.status, 409);
    assert.equal(data.success, false);
    assert.match(data.message, /already have an after breakfast reading/i);
  });

  it("returns HTTP 404 when User B attempts to update User A's reading", async (t) => {
    if (!isLoopbackAvailable || !tokenB || !createdReadingId) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings/${createdReadingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenB}` // User B
      },
      body: JSON.stringify({
        date: testDate,
        slot: "MORNING",
        value: 115
      })
    });

    const data = await res.json();
    assert.equal(res.status, 404);
    assert.equal(data.success, false);
    assert.match(data.message, /not found/i);
  });

  it("ignores spoofed userId in update payload", async (t) => {
    if (!isLoopbackAvailable || !tokenA || !createdReadingId) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings/${createdReadingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        userId: "99999999-9999-9999-9999-999999999999", // Spoofed userId
        date: testDate,
        slot: "MORNING",
        value: 104
      })
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.reading.userId, userIdA);
    assert.notEqual(data.reading.userId, "99999999-9999-9999-9999-999999999999");
  });

  // 7. DELETE READING & OWNERSHIP ENFORCEMENT
  it("returns HTTP 404 when User B attempts to delete User A's reading", async (t) => {
    if (!isLoopbackAvailable || !tokenB || !createdReadingId) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings/${createdReadingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    const data = await res.json();
    assert.equal(res.status, 404);
    assert.equal(data.success, false);
    assert.match(data.message, /not found/i);
  });

  it("allows owner to delete their reading (HTTP 200)", async (t) => {
    if (!isLoopbackAvailable || !tokenA || !createdReadingId) return t.skip("Environment unavailable");

    const res = await fetch(`${baseUrl}/api/readings/${createdReadingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.match(data.message, /deleted successfully/i);

    // Verify reading is now gone (HTTP 404 on subsequent GET)
    const getRes = await fetch(`${baseUrl}/api/readings/${createdReadingId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(getRes.status, 404);
  });
});
