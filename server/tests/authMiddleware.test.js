const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../src/middleware/authMiddleware");

// Helper to mock Express req, res, next
function createMockHttp() {
  const req = {
    headers: {}
  };

  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    }
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  return { req, res, next, isNextCalled: () => nextCalled };
}

describe("Auth Middleware", () => {
  const TEST_SECRET = "test_jwt_secret_key_1234567890_antigravity";
  const originalSecret = process.env.JWT_SECRET;

  before(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  after(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("rejects request with missing Authorization header (HTTP 401)", () => {
    const { req, res, next, isNextCalled } = createMockHttp();

    authMiddleware(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /token is required/i);
    assert.equal(isNextCalled(), false);
  });

  it("rejects request with non-Bearer header format (HTTP 401)", () => {
    const { req, res, next, isNextCalled } = createMockHttp();
    req.headers.authorization = "Basic dXNlcjpwYXNz";

    authMiddleware(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Bearer/i);
    assert.equal(isNextCalled(), false);
  });

  it("rejects request with empty Bearer token (HTTP 401)", () => {
    const { req, res, next, isNextCalled } = createMockHttp();
    req.headers.authorization = "Bearer   ";

    authMiddleware(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /token is required/i);
    assert.equal(isNextCalled(), false);
  });

  it("rejects invalid/tampered token (HTTP 401)", () => {
    const { req, res, next, isNextCalled } = createMockHttp();
    req.headers.authorization = "Bearer invalid.fake.token";

    authMiddleware(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid authentication token/i);
    assert.equal(isNextCalled(), false);
  });

  it("rejects token signed with wrong secret (HTTP 401)", () => {
    const tokenWithWrongSecret = jwt.sign(
      { userId: "11111111-2222-3333-4444-555555555555" },
      "completely_different_secret"
    );

    const { req, res, next, isNextCalled } = createMockHttp();
    req.headers.authorization = `Bearer ${tokenWithWrongSecret}`;

    authMiddleware(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid authentication token/i);
    assert.equal(isNextCalled(), false);
  });

  it("rejects expired token (HTTP 401)", () => {
    const expiredToken = jwt.sign(
      { userId: "11111111-2222-3333-4444-555555555555" },
      TEST_SECRET,
      { expiresIn: "-1s" } // already expired
    );

    const { req, res, next, isNextCalled } = createMockHttp();
    req.headers.authorization = `Bearer ${expiredToken}`;

    authMiddleware(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /expired/i);
    assert.equal(isNextCalled(), false);
  });

  it("rejects token without userId in payload (HTTP 401)", () => {
    const tokenNoUserId = jwt.sign(
      { role: "admin" }, // missing userId
      TEST_SECRET
    );

    const { req, res, next, isNextCalled } = createMockHttp();
    req.headers.authorization = `Bearer ${tokenNoUserId}`;

    authMiddleware(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /payload/i);
    assert.equal(isNextCalled(), false);
  });

  it("accepts valid token and attaches req.user.userId (HTTP 200 / next)", () => {
    const userId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const validToken = jwt.sign(
      { userId },
      TEST_SECRET,
      { expiresIn: "1h" }
    );

    const { req, res, next, isNextCalled } = createMockHttp();
    req.headers.authorization = `Bearer ${validToken}`;

    authMiddleware(req, res, next);

    assert.equal(isNextCalled(), true);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(req.user, { userId });
  });

  it("does not overwrite req.user with untrusted body or query userId", () => {
    const userId = "legitimate-token-user-id";
    const validToken = jwt.sign({ userId }, TEST_SECRET);

    const { req, res, next, isNextCalled } = createMockHttp();
    req.headers.authorization = `Bearer ${validToken}`;
    req.body = { userId: "attacker-spoofed-body-id" };
    req.query = { userId: "attacker-spoofed-query-id" };

    authMiddleware(req, res, next);

    assert.equal(isNextCalled(), true);
    assert.equal(req.user.userId, userId);
    assert.notEqual(req.user.userId, "attacker-spoofed-body-id");
    assert.notEqual(req.user.userId, "attacker-spoofed-query-id");
  });
});
