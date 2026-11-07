#!/usr/bin/env node

/**
 * Academy Desk - Manual Staff Account Provisioning Script
 *
 * Usage:
 *   1. Seed standard demo staff accounts:
 *      npm run seed:staff
 *      (or node --env-file=.env.local scripts/create-staff.mjs)
 *
 *   2. Create a specific Coach or Scout account:
 *      node --env-file=.env.local scripts/create-staff.mjs coach <email> <password> "<name>"
 *      node --env-file=.env.local scripts/create-staff.mjs scout <email> <password> "<name>"
 */

import { connectToDatabase } from "../lib/mongodb.ts";
import { User } from "../models/User.ts";
import { hashPassword } from "../lib/auth.ts";

async function main() {
  const args = process.argv.slice(2);
  await connectToDatabase();

  if (args.length >= 3) {
    const rawRole = args[0].toLowerCase();
    if (rawRole !== "coach" && rawRole !== "scout") {
      console.error('Error: Role must be either "coach" or "scout".');
      process.exit(1);
    }

    const email = args[1].toLowerCase().trim();
    const password = args[2];
    const name = args[3] || (rawRole === "coach" ? "Academy Coach" : "Talent Scout");

    if (password.length < 8) {
      console.error("Error: Password must be at least 8 characters long.");
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    const user = await User.findOneAndUpdate(
      { email },
      { name, email, passwordHash, role: rawRole },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    console.log(`Successfully provisioned ${rawRole.toUpperCase()} account:`);
    console.log(`  Name:  ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role:  ${user.role}`);
    process.exit(0);
  }

  // Default: Seed standard Coach and Scout accounts for hackathon evaluation
  console.log("Seeding standard hackathon staff accounts (Coach & Scout)...");

  const defaultStaff = [
    {
      role: "coach",
      email: "coach@apexacademy.demo",
      name: "Head Coach Marcus",
      password: "DemoPassword123!",
    },
    {
      role: "scout",
      email: "scout@apexacademy.demo",
      name: "Lead Scout Sarah",
      password: "DemoPassword123!",
    },
  ];

  for (const staff of defaultStaff) {
    const passwordHash = await hashPassword(staff.password);
    const user = await User.findOneAndUpdate(
      { email: staff.email },
      { name: staff.name, email: staff.email, passwordHash, role: staff.role },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`- [${user.role.toUpperCase()}] ${user.name} (${user.email}) ready.`);
  }

  console.log("\nStaff accounts successfully provisioned in MongoDB Atlas.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Staff provisioning failed:", err.message);
  process.exit(1);
});
