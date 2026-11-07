import { NextResponse } from "next/server";
import { getSession, assertRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PracticeSession } from "@/models/PracticeSession";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    assertRole(session, ["coach"]);

    const { id } = await params;
    await connectToDatabase();

    const practiceSession = await PracticeSession.findById(id);
    if (!practiceSession) {
      return NextResponse.json({ error: "Practice session not found" }, { status: 404 });
    }

    practiceSession.status = "closed";
    await practiceSession.save();

    return NextResponse.json({
      message: "Session closed successfully. Attendance is now locked.",
      session: practiceSession,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

