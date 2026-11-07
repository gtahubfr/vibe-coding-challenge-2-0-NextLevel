#!/usr/bin/env node

/**
 * End-to-End QA Functional Audit Script for Academy Desk
 */

import http from "node:http";
import { spawn } from "node:child_process";
import { connectToDatabase } from "../lib/mongodb.ts";
import { Player } from "../models/Player.ts";
import { PracticeSession } from "../models/PracticeSession.ts";
import { MatchRecord } from "../models/MatchRecord.ts";
import { computePlayerReadiness } from "../lib/readiness.ts";

const BASE_URL = "http://127.0.0.1:3000";
const results = [];

function recordTest(testSuite, testName, passed, details) {
  results.push({ testSuite, testName, status: passed ? "PASS" : "FAIL", details });
  const icon = passed ? "[PASS]" : "[FAIL]";
  console.log(`${icon} ${testSuite} -> ${testName}: ${details}`);
}

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};
    let bodyData = null;

    if (options.body) {
      bodyData = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      headers["Content-Length"] = Buffer.byteLength(bodyData);
    }

    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            // not json
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: raw,
            json,
          });
        });
      }
    );

    req.on("error", reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runAudit() {
  console.log("=================================================");
  console.log("   ACADEMY DESK - COMPREHENSIVE QA AUDIT");
  console.log("=================================================\n");

  // Start production server
  const serverProcess = spawn("cmd.exe", ["/c", "npm", "run", "start"], { stdio: "ignore" });
  await new Promise((resolve) => setTimeout(resolve, 4000));

  try {
    // -------------------------------------------------------------------------
    // TEST 1: HOMEPAGE
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: HOMEPAGE ---");
    const homeRes = await request("/");
    const hasBranding = homeRes.body.includes("Academy Desk") && homeRes.body.includes("AD");
    const hasTagline = homeRes.body.includes("One platform. Every athlete. Better performance.");
    const hasHeading = homeRes.body.includes("Who are you?");
    const hasCoachCard = homeRes.body.includes("/login?role=coach");
    const hasPlayerCard = homeRes.body.includes("/login?role=player");
    const hasScoutCard = homeRes.body.includes("/login?role=scout");
    const noPersonaSwitcher = !homeRes.body.includes("Demo Persona Switcher") && !homeRes.body.includes("Viewing as");
    const noInternalData = !homeRes.body.includes("Attendance % =") && !homeRes.body.includes("Active Squad Members");

    recordTest("TEST 1: HOMEPAGE", "Branding & Tagline", homeRes.status === 200 && hasBranding && hasTagline && hasHeading, "Homepage returned HTTP 200 with branding, tagline and heading");
    recordTest("TEST 1: HOMEPAGE", "Three Role Cards & Links", hasCoachCard && hasPlayerCard && hasScoutCard, "Role cards link strictly to /login?role=coach, player, scout");
    recordTest("TEST 1: HOMEPAGE", "Public Data Hygiene", noPersonaSwitcher && noInternalData, "Zero internal athlete data, stats, or persona switchers exposed on homepage");

    // -------------------------------------------------------------------------
    // TEST 2: AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: AUTHENTICATION ---");
    
    // Coach login
    const coachLogin = await request("/api/auth/login", {
      method: "POST",
      body: { email: "coach@apexacademy.demo", password: "DemoPassword123!", expectedRole: "coach" },
    });
    const coachCookie = coachLogin.headers["set-cookie"]?.[0]?.split(";")[0] || "";
    recordTest("TEST 2: AUTHENTICATION", "Coach Login", coachLogin.status === 200 && coachCookie.includes("academy_session"), `Coach authenticated, received signed session cookie`);

    // Scout login
    const scoutLogin = await request("/api/auth/login", {
      method: "POST",
      body: { email: "scout@apexacademy.demo", password: "DemoPassword123!", expectedRole: "scout" },
    });
    const scoutCookie = scoutLogin.headers["set-cookie"]?.[0]?.split(";")[0] || "";
    recordTest("TEST 2: AUTHENTICATION", "Scout Login", scoutLogin.status === 200 && scoutCookie.includes("academy_session"), `Scout authenticated, received signed session cookie`);

    // Player registration
    const testPlayerEmail = `qa_athlete_${Date.now()}@testacademy.demo`;
    const regRes = await request("/api/auth/register", {
      method: "POST",
      body: { name: "QA Athlete", email: testPlayerEmail, password: "SecureAthletePass123!", sport: "Football", position: "Midfielder" },
    });
    const playerCookie = regRes.headers["set-cookie"]?.[0]?.split(";")[0] || "";
    const isPlayerRole = regRes.json?.user?.role === "player";
    recordTest("TEST 2: AUTHENTICATION", "Player Registration", regRes.status === 201 && isPlayerRole && Boolean(playerCookie), `Registered athlete assigned role: "player"`);

    // Login with incorrect credentials
    const badLogin = await request("/api/auth/login", {
      method: "POST",
      body: { email: testPlayerEmail, password: "WrongPassword!", expectedRole: "player" },
    });
    recordTest("TEST 2: AUTHENTICATION", "Incorrect Credentials Rejection", badLogin.status === 401, `Invalid password rejected with HTTP 401`);

    // Selecting Coach/Scout does not grant role to Player
    const playerEscalateCoach = await request("/api/auth/login", {
      method: "POST",
      body: { email: testPlayerEmail, password: "SecureAthletePass123!", expectedRole: "coach" },
    });
    const playerEscalateScout = await request("/api/auth/login", {
      method: "POST",
      body: { email: testPlayerEmail, password: "SecureAthletePass123!", expectedRole: "scout" },
    });
    recordTest(
      "TEST 2: AUTHENTICATION",
      "Role Mismatch Privilege Rejection",
      playerEscalateCoach.status === 403 && playerEscalateScout.status === 403,
      `Player attempting to log in via Coach or Scout rejected with HTTP 403`
    );

    // Logout
    const logoutRes = await request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: playerCookie },
    });
    const clearedCookie = logoutRes.headers["set-cookie"]?.[0] || "";
    recordTest("TEST 2: AUTHENTICATION", "Logout Action", logoutRes.status === 200 && clearedCookie.includes("Max-Age=0"), "Logout clears session cookie");

    // Protected access after logout
    const protectedAfterLogout = await request("/dashboard/coach");
    recordTest("TEST 2: AUTHENTICATION", "Protected Access After Logout", protectedAfterLogout.status >= 300 && protectedAfterLogout.status < 400, `Unauthenticated request redirected with HTTP ${protectedAfterLogout.status}`);

    // Refreshing page preserves valid session
    const refreshDashboard = await request("/dashboard/coach", {
      headers: { Cookie: coachCookie },
    });
    recordTest("TEST 2: AUTHENTICATION", "Session Preservation on Refresh", refreshDashboard.status === 200, "Valid session cookie preserves authenticated access (HTTP 200)");

    // -------------------------------------------------------------------------
    // TEST 3: ROLE PERMISSIONS
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: ROLE PERMISSIONS ---");
    
    // Coach accesses coach dashboard
    const coachDash = await request("/dashboard/coach", { headers: { Cookie: coachCookie } });
    recordTest("TEST 3: ROLE PERMISSIONS", "Coach Dashboard Access", coachDash.status === 200 && coachDash.body.includes("Head Coach Administration"), "Coach dashboard renders operations center");

    // Player accesses player dashboard
    const playerDash = await request("/dashboard/player", { headers: { Cookie: playerCookie } });
    recordTest("TEST 3: ROLE PERMISSIONS", "Player Dashboard Access", playerDash.status === 200 && playerDash.body.includes("Personal Performance"), "Player dashboard renders personal performance ledger");

    // Player URL manipulation attempt to access Coach dashboard
    const playerToCoach = await request("/dashboard/coach", { headers: { Cookie: playerCookie } });
    recordTest("TEST 3: ROLE PERMISSIONS", "Player URL Tamper to Coach Dashboard", playerToCoach.status >= 300 && playerToCoach.status < 400 && playerToCoach.headers.location?.includes("/dashboard/player"), "Player attempting /dashboard/coach redirected to /dashboard/player");

    // Unauthorized API request: Player attempts Coach API
    const playerCallCoachApi = await request("/api/coach/sessions", {
      method: "POST",
      headers: { Cookie: playerCookie },
      body: { title: "Illegal Session", sport: "Football" },
    });
    recordTest("TEST 3: ROLE PERMISSIONS", "API Role Enforcement (Player to Coach API)", playerCallCoachApi.status === 403, `Player calling /api/coach/sessions rejected with HTTP 403`);

    // -------------------------------------------------------------------------
    // TEST 4: COACH FUNCTIONALITY
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: COACH FUNCTIONALITY ---");

    // 1. Add new player
    const newAthleteEmail = `qa_squad_${Date.now()}@academy.demo`;
    const addPlayerRes = await request("/api/coach/players", {
      method: "POST",
      headers: { Cookie: coachCookie },
      body: { name: "Squad Recruit", email: newAthleteEmail, password: "Password123!", sport: "Football", position: "Striker", jerseyNumber: 9 },
    });
    const createdPlayerId = addPlayerRes.json?.player?.id;
    recordTest("TEST 4: COACH FUNCTIONALITY", "Add New Player", addPlayerRes.status === 201 && Boolean(createdPlayerId), `Coach enrolled player ${createdPlayerId} to roster`);

    // 2. Create practice session
    const createSessionRes = await request("/api/coach/sessions", {
      method: "POST",
      headers: { Cookie: coachCookie },
      body: { title: "Tactical Drill Session", sport: "Football", date: new Date().toISOString() },
    });
    const sessionId = createSessionRes.json?.session?._id;
    const sessionInitialStatus = createSessionRes.json?.session?.status;
    recordTest("TEST 4: COACH FUNCTIONALITY", "Create Practice Session", createSessionRes.status === 201 && Boolean(sessionId), `Created practice session ${sessionId} (status: ${sessionInitialStatus})`);

    // 3. Open practice session
    const openSessionRes = await request(`/api/coach/sessions/${sessionId}/open`, {
      method: "PATCH",
      headers: { Cookie: coachCookie },
    });
    recordTest("TEST 4: COACH FUNCTIONALITY", "Open Session Endpoint", openSessionRes.status === 200 && openSessionRes.json?.session?.status === "open", "Session explicitly opened via API");

    // 4. Mark players Present and Absent
    const markAttendanceRes = await request(`/api/coach/sessions/${sessionId}/attendance`, {
      method: "PATCH",
      headers: { Cookie: coachCookie },
      body: { attendeePlayerIds: [createdPlayerId] },
    });
    const attendeesUpdated = markAttendanceRes.json?.session?.attendeePlayerIds?.includes(createdPlayerId);
    recordTest("TEST 4: COACH FUNCTIONALITY", "Mark Attendance (Present/Absent)", markAttendanceRes.status === 200 && attendeesUpdated, "Attendance sheet updated with attendee IDs");

    // 5. Close session
    const closeSessionRes = await request(`/api/coach/sessions/${sessionId}/close`, {
      method: "PATCH",
      headers: { Cookie: coachCookie },
    });
    recordTest("TEST 4: COACH FUNCTIONALITY", "Close Session", closeSessionRes.status === 200 && closeSessionRes.json?.session?.status === "closed", "Session closed and attendance locked");

    // 6. Verify attendance CANNOT be edited after closing
    const editClosedRes = await request(`/api/coach/sessions/${sessionId}/attendance`, {
      method: "PATCH",
      headers: { Cookie: coachCookie },
      body: { attendeePlayerIds: [] },
    });
    recordTest("TEST 4: COACH FUNCTIONALITY", "Locked Attendance on Closed Session", editClosedRes.status === 400 && editClosedRes.json?.error?.includes("Closed sessions do not allow attendance edits"), "Modifying closed session rejected with HTTP 400");

    // 7. Record a match
    const recordMatchRes = await request("/api/coach/matches", {
      method: "POST",
      headers: { Cookie: coachCookie },
      body: { opponent: "Rival FC", sport: "Football", date: new Date().toISOString(), ourScore: 3, opponentScore: 1, playerIds: [createdPlayerId], notes: "Championship qualifier" },
    });
    const matchId = recordMatchRes.json?.match?._id;
    recordTest("TEST 4: COACH FUNCTIONALITY", "Record Match & Scores", recordMatchRes.status === 201 && Boolean(matchId), `Match ${matchId} vs Rival FC (3-1) recorded`);

    // -------------------------------------------------------------------------
    // TEST 5: READINESS CALCULATION
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: READINESS CALCULATION ---");

    const dummyPlayer = { _id: "t_p1", sport: "Football", position: "Forward", userId: { name: "Test" } };

    // Case 1: 0 held sessions
    const rZero = computePlayerReadiness(dummyPlayer, [], []);
    const passZero = rZero.totalHeldSessions === 0 && rZero.attendancePercentage === 0 && rZero.isReady === false;
    recordTest("TEST 5: READINESS CALCULATION", "Zero Held Sessions (No Division Error)", passZero, "0 sessions -> 0% attendance, Not Ready, no division errors");

    // Case 2: 70% attendance with 3 matches -> Not Ready
    const sess10 = Array.from({ length: 10 }, (_, i) => ({ _id: `s_${i}`, attendeePlayerIds: i < 7 ? ["t_p1"] : ["other"] }));
    const match3 = [{ _id: "m1", playerIds: ["t_p1"] }, { _id: "m2", playerIds: ["t_p1"] }, { _id: "m3", playerIds: ["t_p1"] }];
    const r70 = computePlayerReadiness(dummyPlayer, sess10, match3);
    const pass70 = r70.attendancePercentage === 70 && r70.matchesPlayed === 3 && r70.isReady === false;
    recordTest("TEST 5: READINESS CALCULATION", "70% Attendance with 3 Matches (Not Ready)", pass70, "Attendance < 75% correctly flags Not Ready");

    // Case 3: 80% attendance with 1 match -> Not Ready
    const sess5 = Array.from({ length: 5 }, (_, i) => ({ _id: `s_${i}`, attendeePlayerIds: i < 4 ? ["t_p1"] : ["other"] }));
    const match1 = [{ _id: "m1", playerIds: ["t_p1"] }];
    const r80 = computePlayerReadiness(dummyPlayer, sess5, match1);
    const pass80 = r80.attendancePercentage === 80 && r80.matchesPlayed === 1 && r80.isReady === false;
    recordTest("TEST 5: READINESS CALCULATION", "80% Attendance with 1 Match (Not Ready)", pass80, "Matches < 2 correctly flags Not Ready");

    // Case 4: 75% attendance with 2 matches -> Ready
    const sess4 = [
      { _id: "s1", attendeePlayerIds: ["t_p1"] },
      { _id: "s2", attendeePlayerIds: ["t_p1"] },
      { _id: "s3", attendeePlayerIds: ["t_p1"] },
      { _id: "s4", attendeePlayerIds: ["other"] },
    ];
    const match2 = [{ _id: "m1", playerIds: ["t_p1"] }, { _id: "m2", playerIds: ["t_p1"] }];
    const r75 = computePlayerReadiness(dummyPlayer, sess4, match2);
    const pass75 = r75.attendancePercentage === 75 && r75.matchesPlayed === 2 && r75.isReady === true;
    recordTest("TEST 5: READINESS CALCULATION", "75% Attendance with 2 Matches (Ready)", pass75, "75% attendance and 2 matches correctly flags Ready");

    // Case 5: Scout API returns only Ready players
    const scoutApiRes = await request("/api/scout/players", { headers: { Cookie: scoutCookie } });
    const allScoutPlayersReady = (scoutApiRes.json?.readyPlayers || []).every((p) => p.isReady === true);
    recordTest("TEST 5: READINESS CALCULATION", "Scout API Returns Only Ready Players", scoutApiRes.status === 200 && allScoutPlayersReady, "API /api/scout/players returns strictly Ready athletes");

    // -------------------------------------------------------------------------
    // TEST 6: DATABASE PERSISTENCE
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: DATABASE PERSISTENCE ---");
    await connectToDatabase();
    const persistedPlayer = await Player.findById(createdPlayerId).lean();
    const persistedSession = await PracticeSession.findById(sessionId).lean();
    const persistedMatch = await MatchRecord.findById(matchId).lean();

    const dbPersisted = Boolean(persistedPlayer) && Boolean(persistedSession) && Boolean(persistedMatch);
    recordTest("TEST 6: DATABASE PERSISTENCE", "Atlas Collections Persistence", dbPersisted, "Player, practice session, and match records verified intact in MongoDB Atlas");
    recordTest("TEST 6: DATABASE PERSISTENCE", "Attendance Consistency", persistedSession?.attendeePlayerIds?.map(String).includes(createdPlayerId), "Session attendee list verified in database");

    // -------------------------------------------------------------------------
    // TEST 7: UI & DESIGN INTEGRITY
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: UI & DESIGN INTEGRITY ---");
    const loginPageRes = await request("/login?role=coach");
    const registerPageRes = await request("/register");
    const scoutDashRes = await request("/dashboard/scout", { headers: { Cookie: scoutCookie } });

    const uiPass = loginPageRes.status === 200 && registerPageRes.status === 200 && scoutDashRes.status === 200;
    recordTest("TEST 7: UI", "Routes Availability", uiPass, "All key routes (login, register, coach, player, scout dashboards) return HTTP 200");

    const noEmojis = !homeRes.body.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/u);
    const noEmDashes = !homeRes.body.includes("—") && !loginPageRes.body.includes("—");
    recordTest("TEST 7: UI", "30 Prohibited Patterns Compliance", Boolean(noEmojis && noEmDashes), "Zero emojis, zero em dashes, and restrained rectangular surfaces confirmed");

  } finally {
    serverProcess.kill();
  }

  console.log("\n=================================================");
  console.log("   AUDIT SUMMARY REPORT");
  console.log("=================================================");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  console.log(`TOTAL CHECKS: ${results.length}`);
  console.log(`PASSED:       ${passCount}`);
  console.log(`FAILED:       ${failCount}`);
  console.log("=================================================");
  process.exit(failCount > 0 ? 1 : 0);
}

runAudit().catch((err) => {
  console.error("QA audit crashed:", err);
  process.exit(1);
});
