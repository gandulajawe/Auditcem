import { loadEnvConfig } from "@next/env";
import path from "path";

// Muat variabel lingkungan dari folder saat ini & folder induk
loadEnvConfig(process.cwd());
loadEnvConfig(path.join(process.cwd(), ".."));

import { db } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const defaultPassword = process.env.APP_PASSWORD || "admin123";
  // Use the app's own hashPassword() so the stored hash is in the exact
  // "scrypt:<salt>:<hash>" format that verifyPassword() in src/lib/auth.ts
  // expects. A hand-rolled hash function here would produce a differently
  // shaped string that fails every login attempt even with the right
  // password.
  const hashedPassword = await hashPassword(defaultPassword);

  console.log("Seeding admin user...");

  // Note: no "role" field here — the users table (src/db/schema.ts) only
  // has id, name, email, password, and createdAt. This is a single-user
  // app with no role/permission system.
  await db.insert(users).values({
    email: "admin@factory.com",
    name: "Admin Audit",
    password: hashedPassword,
  }).onConflictDoNothing();

  console.log("✅ Admin user created/verified successfully!");
  console.log("Email: admin@factory.com");
  console.log("Password:", defaultPassword);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});