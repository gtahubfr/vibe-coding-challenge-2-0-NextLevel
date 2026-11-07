import { NextResponse } from "next/server";
import { getSession, checkOwnership } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { PracticeSession } from "@/models/PracticeSession";
import { MatchRecord } from "@/models/MatchRecord";
import { computePlayerReadiness, PlayerDocumentLike } from "@/lib/readiness";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    // Support querying by either Player._id or Player.userId
    const player =
      (await Player.findById(id).populate("userId", "name email role")) ||
      (await Player.findOne({ userId: id }).populate("userId", "name email role"));

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const targetUserId = String(
      (player.userId as { _id?: unknown })?._id ?? player.userId
    );

    // Enforce server-side ownership
    const isAuthorized = checkOwnership(session, targetUserId, false);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this player record" },
        { status: 403 }
      );
    }

    // RULE 8: Scout can access only players whose readiness status is Ready.
    // Do not expose non-ready players through APIs.
    if (session.role === "scout") {
      const rawSessions = await PracticeSession.find().lean();
      const rawMatches = await MatchRecord.find().lean();

      const sessions = rawSessions.map((s) => ({
        _id: s._id,
        status: s.status,
        attendeePlayerIds: (s.attendeePlayerIds || []).map((sessId) => sessId.toString()),
      }));

      const matches = rawMatches.map((m) => ({
        _id: m._id,
        playerIds: (m.playerIds || []).map((mId) => mId.toString()),
      }));

      const u = typeof player.userId === "object" && player.userId !== null && "name" in player.userId
        ? (player.userId as { name?: string; email?: string })
        : null;

      const playerDoc: PlayerDocumentLike = {
        _id: player._id,
        sport: player.sport,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        userId: u,
      };

      const stats = computePlayerReadiness(playerDoc, sessions, matches);
      if (!stats.isReady) {
        return NextResponse.json(
          { error: "Forbidden: Scouts can access only players whose readiness status is Ready" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ player });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const player =
      (await Player.findById(id)) || (await Player.findOne({ userId: id }));

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const targetUserId = player.userId.toString();

    // Enforce server-side ownership for write operation
    const isAuthorized = checkOwnership(session, targetUserId, true);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this player record" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sport, position, bio, status, jerseyNumber } = body;

    if (sport !== undefined) player.sport = sport;
    if (position !== undefined) player.position = position;
    if (bio !== undefined) player.bio = bio;
    if (status !== undefined) player.status = status;
    if (jerseyNumber !== undefined) player.jerseyNumber = jerseyNumber;

    await player.save();

    return NextResponse.json({ player });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
