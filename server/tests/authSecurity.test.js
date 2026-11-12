const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { BCRYPT_SALT_ROUNDS } = require("../src/controllers/authController");
const { generateToken, verifyToken } = require("../src/utils/jwt");
const { createRateLimiter } = require("../src/middleware/rateLimiter");

describe("Auth Security Properties", () => {
  it("enforces 12 salt rounds for bcrypt hashing", async () => {
    assert.equal(BCRYPT_SALT_ROUNDS, 12);

    const password = "ClinicalPassword2026";
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Bcrypt hash format: $2a$12$... or $2b$12$...
    // The second field between $ is the cost factor (salt rounds)
    const parts = hash.split("$");
    const costFactor = parseInt(parts[2], 10);

    assert.equal(costFactor, 12);
    assert.equal(await bcrypt.compare(password, hash), true);
    assert.equal(await bcrypt.compare("WrongPassword", hash), false);
  });

  it("supports configurable JWT expiration duration", () => {
    process.env.JWT_SECRET = "security_test_secret_1234567890";

    // 1 hour expiration
    const token1h = generateToken("user-1", { expiresIn: "1h" });
    const decoded1h = jwt.decode(token1h);
    const duration1h = decoded1h.exp - decoded1h.iat;
    assert.equal(duration1h, 3600);

    // 7 days expiration
    const token7d = generateToken("user-2", { expiresIn: "7d" });
    const decoded7d = jwt.decode(token7d);
    const duration7d = decoded7d.exp - decoded7d.iat;
    assert.equal(duration7d, 7 * 24 * 3600);

    // Verification
    const verified = verifyToken(token1h);
    assert.equal(verified.userId, "user-1");
  });

  it("rate limiter enforces limits and sets rate-limiting headers", () => {
    const limiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 3,
      message: "Rate limit reached."
    });

    const createReqRes = (ip) => {
      const req = {
        headers: {},
        ip,
        baseUrl: "/api/auth"
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
        setHeader(k, v) {
          this.headers[k] = v;
          return this;
        }
      };
      return { req, res };
    };

    let nextCalled = 0;
    const next = () => { nextCalled++; };

    // Request 1: allowed
    const r1 = createReqRes("192.168.1.100");
    limiter(r1.req, r1.res, next);
    assert.equal(nextCalled, 1);
    assert.equal(r1.res.headers["RateLimit-Remaining"], 2);

    // Request 2: allowed
    const r2 = createReqRes("192.168.1.100");
    limiter(r2.req, r2.res, next);
    assert.equal(nextCalled, 2);
    assert.equal(r2.res.headers["RateLimit-Remaining"], 1);

    // Request 3: allowed (last in window)
    const r3 = createReqRes("192.168.1.100");
    limiter(r3.req, r3.res, next);
    assert.equal(nextCalled, 3);
    assert.equal(r3.res.headers["RateLimit-Remaining"], 0);

    // Request 4: blocked (HTTP 429)
    const r4 = createReqRes("192.168.1.100");
    limiter(r4.req, r4.res, next);
    assert.equal(nextCalled, 3); // next not called
    assert.equal(r4.res.statusCode, 429);
    assert.equal(r4.res.body.success, false);
    assert.match(r4.res.body.message, /Rate limit reached/i);
    assert.ok(r4.res.headers["Retry-After"] !== undefined);

    // Request from different IP: allowed
    const rOther = createReqRes("192.168.1.200");
    limiter(rOther.req, rOther.res, next);
    assert.equal(nextCalled, 4);
    assert.equal(rOther.res.headers["RateLimit-Remaining"], 2);
  });
});
