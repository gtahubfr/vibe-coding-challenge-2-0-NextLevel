import { connectToDatabase } from "./mongodb";
import { User, UserRole } from "@/models/User";
import { hashPassword } from "./auth";
import { getEnv } from "./env";

export interface ProvisionStaffInput {
  name: string;
  email: string;
  password: string;
  role: "coach" | "scout";
  provisioningSecret?: string;
}

export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * Provisions a Coach or Scout account through a verified server-side process.
 * Rejects public/unauthenticated attempts to elevate privileges.
 */
export async function provisionStaffAccount(
  input: ProvisionStaffInput
): Promise<SanitizedUser> {
  const { name, email, password, role, provisioningSecret } = input;

  if (role !== "coach" && role !== "scout") {
    throw new Error("Invalid staff role. Permitted roles: 'coach', 'scout'");
  }

  const { STAFF_PROVISIONING_SECRET } = getEnv();

  // Enforce server-side secret validation
  if (!STAFF_PROVISIONING_SECRET || provisioningSecret !== STAFF_PROVISIONING_SECRET) {
    throw new Error("UNAUTHORIZED_PROVISIONING: Invalid or missing staff provisioning secret");
  }

  if (!email || !email.includes("@")) {
    throw new Error("A valid email is required");
  }

  if (!name || name.trim().length < 2) {
    throw new Error("Name must be at least 2 characters long");
  }

  await connectToDatabase();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new Error("A user with this email address already exists");
  }

  const passwordHash = await hashPassword(password);

  const newUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
  });

  return {
    id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    createdAt: newUser.createdAt,
  };
}

