import { NextResponse } from "next/server";
import { getSession, assertRole, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Player } from "@/models/Player";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    assertRole(session, ["coach"]);

    const body = await request.json();
    const { name, email, password, sport, position, jerseyNumber } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "player",
    });

    const player = await Player.create({
      userId: user._id,
      sport: sport || "Football",
      position: position || "Unassigned",
      jerseyNumber: jerseyNumber ? Number(jerseyNumber) : undefined,
    });

    return NextResponse.json(
      {
        player: {
          id: player._id.toString(),
          name: user.name,
          email: user.email,
          sport: player.sport,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

