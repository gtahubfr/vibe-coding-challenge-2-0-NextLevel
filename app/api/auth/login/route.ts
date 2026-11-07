import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, expectedRole } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

    // RULE: Selecting Coach, Player or Scout on the homepage must NEVER grant that role or create an account.
    // Only existing accounts in MongoDB can sign in.
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // RULE: When a user selects a role and signs in, verify the authenticated MongoDB user's actual stored role.
    // Reject login if it does not match the selected role.
    if (expectedRole && user.role !== expectedRole) {
      return NextResponse.json(
        {
          error: `Access denied: This account is registered as '${user.role}'. Only authorized ${expectedRole} accounts can access the ${expectedRole} portal.`,
        },
        { status: 403 }
      );
    }

    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = createSessionToken(sessionPayload);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      user: sessionPayload,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
