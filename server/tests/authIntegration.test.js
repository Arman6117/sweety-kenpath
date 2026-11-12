const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");

const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Auth Integration Flow — HTTP API", () => {
  let server;
  let baseUrl;
  let isDbAvailable = false;
  const testRunId = crypto.randomUUID().slice(0, 8);
  const testUser = {
    name: "Dr. Audit Assessment",
    email: `audit.${testRunId}@kenpath.assessment.test`,
    password: "Password123!"
  };
  let authToken = null;
  let createdUserId = null;

  let isLoopbackAvailable = false;

  before(async () => {
    // Start ephemeral server on random available port
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

      // Probe loopback reachability
      const probeRes = await fetch(`${baseUrl}/`).catch(() => null);
      if (probeRes && probeRes.status === 200) {
        isLoopbackAvailable = true;
      }
    } catch (e) {
      isLoopbackAvailable = false;
    }

    // Check if live DB is accessible
    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;
    } catch (e) {
      isDbAvailable = false;
    }
  });

  after(async () => {
    // Cleanup created test user if DB was used
    if (isDbAvailable && createdUserId) {
      try {
        await prisma.user.delete({
          where: { id: createdUserId }
        });
      } catch (e) {
        // Ignored in cleanup
      }
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. Validation error checks (work independently of DB)
  it("rejects registration with invalid email format (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable) {
      t.skip("Local loopback networking restricted in current sandbox environment");
      return;
    }
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "not-an-email",
        password: "ValidPassword123"
      })
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /valid email/i);
  });

  it("rejects registration with short password (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable) {
      t.skip("Local loopback networking restricted in current sandbox environment");
      return;
    }
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "valid.user@example.com",
        password: "123"
      })
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /at least 8 characters/i);
  });

  it("rejects registration with missing required fields (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable) {
      t.skip("Local loopback networking restricted in current sandbox environment");
      return;
    }
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "valid.user@example.com"
      })
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /required/i);
  });

  it("rejects login with missing credentials (HTTP 400)", async (t) => {
    if (!isLoopbackAvailable) {
      t.skip("Local loopback networking restricted in current sandbox environment");
      return;
    }
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /required/i);
  });

  it("protected route rejects missing token (HTTP 401)", async (t) => {
    if (!isLoopbackAvailable) {
      t.skip("Local loopback networking restricted in current sandbox environment");
      return;
    }
    const res = await fetch(`${baseUrl}/api/auth/me`);
    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.match(data.message, /token is required/i);
  });

  it("protected route rejects invalid token (HTTP 401)", async (t) => {
    if (!isLoopbackAvailable) {
      t.skip("Local loopback networking restricted in current sandbox environment");
      return;
    }
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: "Bearer bogus.jwt.token" }
    });
    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.match(data.message, /invalid/i);
  });

  // 2. Full Database flows (when live DB is reachable)
  it("executes full registration, login, and protected route flow against database", async (t) => {
    if (!isDbAvailable) {
      t.skip("Live database not available in current test environment (e.g. offline sandbox)");
      return;
    }

    // A. Register new user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser)
    });

    const regData = await regRes.json();
    assert.equal(regRes.status, 201);
    assert.equal(regData.success, true);
    assert.ok(regData.token, "JWT token must be returned");
    assert.ok(regData.user, "User profile must be returned");
    assert.equal(regData.user.email, testUser.email.toLowerCase());
    assert.equal(regData.user.name, testUser.name);

    // CRITICAL SECURITY ASSERTION: Password and hash must NEVER be returned
    assert.equal(regData.user.password, undefined);
    assert.equal(regData.user.passwordHash, undefined);
    assert.equal(JSON.stringify(regData).includes(testUser.password), false);
    assert.equal(JSON.stringify(regData).includes("passwordHash"), false);

    createdUserId = regData.user.id;
    authToken = regData.token;
    assert.ok(typeof authToken === "string" && authToken.length > 0);

    // B. Attempt duplicate email registration (Must return HTTP 409)
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Imposter User",
        email: testUser.email.toUpperCase(), // Test case-insensitivity
        password: "DifferentPassword123"
      })
    });

    const dupData = await dupRes.json();
    assert.equal(dupRes.status, 409);
    assert.equal(dupData.success, false);
    assert.match(dupData.message, /already exists/i);

    // C. Login with incorrect password (Must return generic HTTP 401)
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "WrongPassword999"
      })
    });

    const badLoginData = await badLoginRes.json();
    assert.equal(badLoginRes.status, 401);
    assert.equal(badLoginData.success, false);
    assert.match(badLoginData.message, /invalid email or password/i);

    // D. Login with non-existent user email (Must return generic HTTP 401)
    const unknownLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent.user.2026@hospital.org",
        password: "SomePassword123"
      })
    });

    const unknownLoginData = await unknownLoginRes.json();
    assert.equal(unknownLoginRes.status, 401);
    assert.equal(unknownLoginData.success, false);
    assert.match(unknownLoginData.message, /invalid email or password/i);

    // E. Login with valid credentials (Must return HTTP 200 + JWT)
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginData.success, true);
    assert.ok(loginData.token, "Login must return JWT");
    assert.equal(loginData.user.email, testUser.email.toLowerCase());

    // CRITICAL SECURITY ASSERTION: Password and hash must NEVER be returned on login
    assert.equal(loginData.user.password, undefined);
    assert.equal(loginData.user.passwordHash, undefined);
    assert.equal(JSON.stringify(loginData).includes(testUser.password), false);
    assert.equal(JSON.stringify(loginData).includes("passwordHash"), false);

    // F. Access protected route /api/auth/me with JWT (HTTP 200)
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });

    const meData = await meRes.json();
    assert.equal(meRes.status, 200);
    assert.equal(meData.success, true);
    assert.equal(meData.user.id, createdUserId);
    assert.equal(meData.user.email, testUser.email.toLowerCase());
    assert.equal(meData.user.password, undefined);
    assert.equal(meData.user.passwordHash, undefined);
  });
});
