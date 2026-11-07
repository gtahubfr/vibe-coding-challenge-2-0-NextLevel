import test from "node:test";
import assert from "node:assert/strict";
import { computePlayerReadiness } from "../lib/readiness.ts";

test("Readiness calculation: attendance >= 75% and matches >= 2", () => {
  const player = {
    _id: "p1",
    sport: "Football",
    position: "Forward",
    userId: { name: "Marcus", email: "marcus@academy.com" },
  };

  // Case 1: Zero held sessions without division errors -> 0% attendance, Not Ready
  const statsZero = computePlayerReadiness(player, [], []);
  assert.strictEqual(statsZero.totalHeldSessions, 0);
  assert.strictEqual(statsZero.attendancePercentage, 0);
  assert.strictEqual(statsZero.matchesPlayed, 0);
  assert.strictEqual(statsZero.isReady, false);

  // Case 2: 70% attendance with 3 matches -> Not Ready (attendance < 75%)
  const sessions10 = Array.from({ length: 10 }, (_, i) => ({
    _id: `s_${i}`,
    attendeePlayerIds: i < 7 ? ["p1"] : ["other"],
  }));
  const matches3 = [
    { _id: "m1", playerIds: ["p1"] },
    { _id: "m2", playerIds: ["p1"] },
    { _id: "m3", playerIds: ["p1"] },
  ];
  const stats70 = computePlayerReadiness(player, sessions10, matches3);
  assert.strictEqual(stats70.totalHeldSessions, 10);
  assert.strictEqual(stats70.presentSessions, 7);
  assert.strictEqual(stats70.attendancePercentage, 70);
  assert.strictEqual(stats70.matchesPlayed, 3);
  assert.strictEqual(stats70.isReady, false);
  assert.ok(stats70.readinessReason.includes("Attendance is 70% (requires >= 75%)"));

  // Case 3: 80% attendance with 1 match -> Not Ready (matches < 2)
  const sessions5 = Array.from({ length: 5 }, (_, i) => ({
    _id: `s_${i}`,
    attendeePlayerIds: i < 4 ? ["p1"] : ["other"],
  }));
  const matches1 = [{ _id: "m1", playerIds: ["p1"] }];
  const stats80 = computePlayerReadiness(player, sessions5, matches1);
  assert.strictEqual(stats80.totalHeldSessions, 5);
  assert.strictEqual(stats80.presentSessions, 4);
  assert.strictEqual(stats80.attendancePercentage, 80);
  assert.strictEqual(stats80.matchesPlayed, 1);
  assert.strictEqual(stats80.isReady, false);
  assert.ok(stats80.readinessReason.includes("1 match(es) played (requires >= 2)"));

  // Case 4: 75% attendance with 2 matches -> READY!
  const sessions4 = [
    { _id: "s1", attendeePlayerIds: ["p1"] },
    { _id: "s2", attendeePlayerIds: ["p1"] },
    { _id: "s3", attendeePlayerIds: ["p1"] },
    { _id: "s4", attendeePlayerIds: ["other"] },
  ];
  const matches2 = [
    { _id: "m1", playerIds: ["p1"] },
    { _id: "m2", playerIds: ["p1"] },
  ];
  const stats75 = computePlayerReadiness(player, sessions4, matches2);
  assert.strictEqual(stats75.totalHeldSessions, 4);
  assert.strictEqual(stats75.presentSessions, 3);
  assert.strictEqual(stats75.attendancePercentage, 75);
  assert.strictEqual(stats75.matchesPlayed, 2);
  assert.strictEqual(stats75.isReady, true);
  assert.strictEqual(stats75.readinessReason, "Ready for competition selection and scouting.");
});
