import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export type UserRole = "player" | "coach" | "scout";

export interface ValidatedEnv {
  MONGODB_URI: string;
  SESSION_SECRET: string;
  STAFF_PROVISIONING_SECRET?: string;
  NODE_ENV: string;
}

export function getEnv(): ValidatedEnv {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  const SESSION_SECRET = process.env.SESSION_SECRET;
  if (!SESSION_SECRET) {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }

  if (process.env.NODE_ENV === "production" && SESSION_SECRET.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters long in production"
    );
  }

  return {
    MONGODB_URI,
    SESSION_SECRET,
    STAFF_PROVISIONING_SECRET: process.env.STAFF_PROVISIONING_SECRET,
    NODE_ENV: process.env.NODE_ENV || "development",
  };
}

export const SESSION_COOKIE_NAME = "academy_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number; // Unix timestamp (seconds)
}

/**
 * Hashes a plain-text password using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  return bcrypt.hash(password, 12);
}

/**
 * Compares candidate password against a stored bcrypt hash.
 */
export async function verifyPassword(
  candidate: string,
  hash: string
): Promise<boolean> {
  if (!candidate || !hash) {
    return false;
  }
  return bcrypt.compare(candidate, hash);
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString("base64url");
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

function signData(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

/**
 * Creates a signed session token using HMAC-SHA256.
 */
export function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  expiresInSeconds = SESSION_MAX_AGE_SECONDS
): string {
  const { SESSION_SECRET } = getEnv();
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload: SessionPayload = { ...payload, exp };
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = signData(encodedPayload, SESSION_SECRET);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed session token. Returns the payload or null if invalid/expired.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  try {
    const { SESSION_SECRET } = getEnv();
    const expectedSignature = signData(encodedPayload, SESSION_SECRET);

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));

    if (!payload.userId || !payload.role || !payload.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Standard cookie configuration for server-side sessions.
 */
export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Reads and verifies the current session from Next.js server cookie store,
 * or from an explicit token string.
 */
export async function getSession(cookieToken?: string): Promise<SessionPayload | null> {
  if (cookieToken) {
    return verifySessionToken(cookieToken);
  }
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Authorization helper: verifies authentication.
 */
export function assertAuthenticated(
  session: SessionPayload | null
): asserts session is SessionPayload {
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
}

/**
 * Authorization helper: verifies the user holds one of the required roles.
 */
export function assertRole(
  session: SessionPayload | null,
  allowedRoles: UserRole[]
): asserts session is SessionPayload {
  assertAuthenticated(session);
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * Enforces ownership checks on the server.
 * - Coaches have full academy access.
 * - Scouts have read-only oversight.
 * - Players may strictly access and mutate only their own record.
 */
export function checkOwnership(
  session: SessionPayload,
  resourceOwnerUserId: string,
  isWriteOperation = false
): boolean {
  if (session.role === "coach") {
    return true;
  }
  if (session.role === "scout") {
    // Scouts can inspect/read player records, but cannot mutate player-owned records
    return !isWriteOperation;
  }
  if (session.role === "player") {
    return session.userId === resourceOwnerUserId;
  }
  return false;
}
