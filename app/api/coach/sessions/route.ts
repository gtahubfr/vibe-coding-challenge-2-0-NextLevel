import { NextResponse } from "next/server";
import { getSession, assertRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PracticeSession } from "@/models/PracticeSession";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    assertRole(session, ["coach"]);

    const body = await request.json();
    const { title, sport, date } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Session title is required" }, { status: 400 });
    }

    await connectToDatabase();

    const practiceSession = await PracticeSession.create({
      title: title.trim(),
      sport: sport || "Football",
      date: date ? new Date(date) : new Date(),
      status: "open",
      attendeePlayerIds: [],
    });

    return NextResponse.json({ session: practiceSession }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

