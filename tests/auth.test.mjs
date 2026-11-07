import test from "node:test";
import assert from "node:assert/strict";

process.env.SESSION_SECRET = "super_secure_test_session_secret_with_more_than_32_characters_for_hmac";
process.env.STAFF_PROVISIONING_SECRET = "test_staff_secret";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/test";

test("Password hashing and verification with bcrypt", async () => {
  const { hashPassword, verifyPassword } = await import("../lib/auth.ts");

  const pwd = "StrongPassword123!";
  const hash = await hashPassword(pwd);

  assert.ok(hash.startsWith("$2"), "Hash should follow bcrypt format");
  assert.notStrictEqual(hash, pwd, "Hash must not equal plaintext password");

  const isValid = await verifyPassword(pwd, hash);
  assert.strictEqual(isValid, true, "Valid password should verify");

  const isInvalid = await verifyPassword("WrongPassword!", hash);
  assert.strictEqual(isInvalid, false, "Invalid password should fail verification");

  await assert.rejects(
    async () => hashPassword("short"),
    /Password must be at least 8 characters/
  );
});

test("Session token creation, verification and tamper protection", async () => {
  const { createSessionToken, verifySessionToken } = await import("../lib/auth.ts");

  const payload = {
    userId: "usr_12345",
    email: "athlete@academy.com",
    name: "Alex Morgan",
    role: "player",
  };

  const token = createSessionToken(payload, 3600);
  assert.ok(token.includes("."), "Token must contain signature separator");

  // Valid verification
  const verified = verifySessionToken(token);
  assert.ok(verified, "Token should verify successfully");
  assert.strictEqual(verified.userId, payload.userId);
  assert.strictEqual(verified.email, payload.email);
  assert.strictEqual(verified.role, "player");
  assert.ok(verified.exp > Math.floor(Date.now() / 1000));

  // Tampering: altered payload
  const [dataPart, sigPart] = token.split(".");
  const decoded = JSON.parse(Buffer.from(dataPart, "base64url").toString());
  decoded.role = "coach"; // Attempt privilege escalation
  const tamperedData = Buffer.from(JSON.stringify(decoded)).toString("base64url");
  const tamperedToken = `${tamperedData}.${sigPart}`;

  const tamperedResult = verifySessionToken(tamperedToken);
  assert.strictEqual(tamperedResult, null, "Tampered token signature must fail");

  // Tampering: altered signature
  const badSigToken = `${dataPart}.invalidSignature123`;
  assert.strictEqual(verifySessionToken(badSigToken), null, "Invalid signature must fail");

  // Expiration: expired token
  const expiredToken = createSessionToken(payload, -10); // Expired 10s ago
  assert.strictEqual(verifySessionToken(expiredToken), null, "Expired token must return null");
});

test("Role restrictions and unauthorized access helpers", async () => {
  const { assertAuthenticated, assertRole } = await import("../lib/auth.ts");

  // Unauthenticated check
  assert.throws(
    () => assertAuthenticated(null),
    (err) => err.message === "UNAUTHORIZED"
  );

  const playerSession = {
    userId: "usr_p1",
    email: "player@academy.com",
    name: "Player One",
    role: "player",
    exp: Date.now() + 10000,
  };

  const coachSession = {
    userId: "usr_c1",
    email: "coach@academy.com",
    name: "Coach Carter",
    role: "coach",
    exp: Date.now() + 10000,
  };

  // Role permissions
  assert.doesNotThrow(() => assertRole(playerSession, ["player", "coach"]));
  assert.doesNotThrow(() => assertRole(coachSession, ["coach"]));

  // Unauthorized role access
  assert.throws(
    () => assertRole(playerSession, ["coach"]),
    (err) => err.message === "FORBIDDEN"
  );
  assert.throws(
    () => assertRole(playerSession, ["coach", "scout"]),
    (err) => err.message === "FORBIDDEN"
  );
});

test("Server-side ownership checks", async () => {
  const { checkOwnership } = await import("../lib/auth.ts");

  const player1Session = {
    userId: "usr_p1",
    email: "p1@academy.com",
    name: "P1",
    role: "player",
    exp: Date.now() + 10000,
  };

  const coachSession = {
    userId: "usr_c1",
    email: "c1@academy.com",
    name: "Coach",
    role: "coach",
    exp: Date.now() + 10000,
  };

  const scoutSession = {
    userId: "usr_s1",
    email: "s1@academy.com",
    name: "Scout",
    role: "scout",
    exp: Date.now() + 10000,
  };

  // 1. Player accessing own profile -> Allowed
  assert.strictEqual(checkOwnership(player1Session, "usr_p1", false), true);
  assert.strictEqual(checkOwnership(player1Session, "usr_p1", true), true);

  // 2. Player accessing another player's profile -> FORBIDDEN
  assert.strictEqual(checkOwnership(player1Session, "usr_p2", false), false);
  assert.strictEqual(checkOwnership(player1Session, "usr_p2", true), false);

  // 3. Coach oversight -> Allowed read and write across players
  assert.strictEqual(checkOwnership(coachSession, "usr_p1", false), true);
  assert.strictEqual(checkOwnership(coachSession, "usr_p1", true), true);

  // 4. Scout oversight -> Allowed read, Forbidden write
  assert.strictEqual(checkOwnership(scoutSession, "usr_p1", false), true);
  assert.strictEqual(checkOwnership(scoutSession, "usr_p1", true), false);
});

test("Environment variable validation without logging secrets", async () => {
  const { getEnv } = await import("../lib/auth.ts");

  const originalSecret = process.env.SESSION_SECRET;
  delete process.env.SESSION_SECRET;

  assert.throws(
    () => getEnv(),
    (err) => {
      assert.match(err.message, /Missing required environment variable: SESSION_SECRET/);
      assert.ok(!err.message.includes(originalSecret), "Error must not leak secret");
      return true;
    }
  );

  process.env.SESSION_SECRET = originalSecret;
});
