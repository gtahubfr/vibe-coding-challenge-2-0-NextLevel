import { NextResponse } from "next/server";
import { getSession, assertRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { PracticeSession } from "@/models/PracticeSession";
import { MatchRecord } from "@/models/MatchRecord";
import { computePlayerReadiness, PlayerDocumentLike, SessionDocumentLike, MatchDocumentLike } from "@/lib/readiness";

export async function GET() {
  try {
    const session = await getSession();
    assertRole(session, ["scout", "coach"]);

    await connectToDatabase();

    const rawPlayers = await Player.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const rawSessions = await PracticeSession.find().sort({ date: -1 }).lean();
    const rawMatches = await MatchRecord.find().sort({ date: -1 }).lean();

    const sessions: SessionDocumentLike[] = rawSessions.map((s) => ({
      _id: s._id,
      status: s.status,
      attendeePlayerIds: (s.attendeePlayerIds || []).map((id) => id.toString()),
    }));

    const matches: MatchDocumentLike[] = rawMatches.map((m) => ({
      _id: m._id,
      playerIds: (m.playerIds || []).map((id) => id.toString()),
    }));

    const allRoster = rawPlayers.map((p) => {
      const u = typeof p.userId === "object" && p.userId !== null && "name" in p.userId
        ? (p.userId as { name?: string; email?: string })
        : null;

      const playerDoc: PlayerDocumentLike = {
        _id: p._id,
        sport: p.sport,
        position: p.position,
        jerseyNumber: p.jerseyNumber,
        userId: u,
      };

      return computePlayerReadiness(playerDoc, sessions, matches);
    });

    // RULE: Scout can access only players whose readiness status is Ready.
    // Do not expose non-ready players through APIs.
    const readyPlayers = allRoster.filter((p) => p.isReady);

    return NextResponse.json({ readyPlayers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

