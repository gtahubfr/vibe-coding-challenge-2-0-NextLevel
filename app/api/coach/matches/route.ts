import { NextResponse } from "next/server";
import { getSession, assertRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { MatchRecord } from "@/models/MatchRecord";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    assertRole(session, ["coach"]);

    const body = await request.json();
    const { opponent, sport, date, ourScore, opponentScore, playerIds, notes } = body;

    if (!opponent || ourScore === undefined || opponentScore === undefined) {
      return NextResponse.json(
        { error: "Opponent, ourScore, and opponentScore are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const match = await MatchRecord.create({
      opponent: opponent.trim(),
      sport: sport || "Football",
      date: date ? new Date(date) : new Date(),
      ourScore: Number(ourScore),
      opponentScore: Number(opponentScore),
      playerIds: Array.isArray(playerIds) ? playerIds : [],
      notes: notes || "",
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

