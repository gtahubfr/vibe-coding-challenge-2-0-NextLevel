import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Player } from "@/models/Player";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let player = null;
  if (session.role === "player") {
    await connectToDatabase();
    player = await Player.findOne({ userId: session.userId });
  }

  return NextResponse.json({
    user: session,
    player,
  });
}

