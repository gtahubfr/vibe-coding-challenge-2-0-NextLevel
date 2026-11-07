import test from "node:test";
import assert from "node:assert/strict";

test("connectToDatabase throws error if MONGODB_URI is undefined", async () => {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  // Clear any existing cache
  global.mongooseCache = { conn: null, promise: null };

  const { connectToDatabase } = await import("../lib/mongodb.ts");

  await assert.rejects(
    async () => {
      await connectToDatabase();
    },
    {
      name: "Error",
      message: /Please define the MONGODB_URI/,
    }
  );

  // Restore env
  if (originalUri !== undefined) {
    process.env.MONGODB_URI = originalUri;
  }
});

test("connectToDatabase returns cached connection when present", async () => {
  const fakeConn = { fake: true };
  global.mongooseCache = { conn: fakeConn, promise: null };
  process.env.MONGODB_URI = "mongodb://localhost:27017/test";

  const { connectToDatabase } = await import("../lib/mongodb.ts");
  const conn = await connectToDatabase();

  assert.strictEqual(conn, fakeConn);
});

test("connectToDatabase returns existing promise when connection in flight", async () => {
  const fakePromise = Promise.resolve({ fake: true });
  global.mongooseCache = { conn: null, promise: fakePromise };
  process.env.MONGODB_URI = "mongodb://localhost:27017/test";

  const { connectToDatabase } = await import("../lib/mongodb.ts");
  const conn = await connectToDatabase();

  assert.deepStrictEqual(conn, { fake: true });
});

