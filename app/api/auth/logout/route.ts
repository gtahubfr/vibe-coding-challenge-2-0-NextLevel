import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const acceptHeader = request.headers.get("accept") || "";
  const isFormSubmit = acceptHeader.includes("text/html");

  const response = isFormSubmit
    ? NextResponse.redirect(new URL("/", request.url), { status: 303 })
    : NextResponse.json({ message: "Logged out successfully" });

  // Clear session cookie immediately
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(0),
    maxAge: 0,
  });

  return response;
}
