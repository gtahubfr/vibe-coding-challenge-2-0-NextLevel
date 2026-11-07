import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Player } from "@/models/Player";
import {
  hashPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, sport, position, dateOfBirth } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // SECURITY: Never trust client-supplied roles.
    // Public registration strictly and exclusively creates "player" accounts.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "player",
    });

    const player = await Player.create({
      userId: user._id,
      sport: (typeof sport === "string" && sport.trim()) || "Football",
      position: (typeof position === "string" && position.trim()) || "Unassigned",
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });

    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = createSessionToken(sessionPayload);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json(
      {
        user: sessionPayload,
        player: {
          id: player._id.toString(),
          sport: player.sport,
          position: player.position,
          status: player.status,
        },
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

