import { loadEnvConfig } from "@next/env";
import path from "path";

// Muat variabel lingkungan dari folder saat ini & folder induk
loadEnvConfig(process.cwd());
loadEnvConfig(path.join(process.cwd(), ".."));

import { db } from "../src/db";
import { users } from "../src/db/schema";
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hashedPassword = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hashedPassword}`;
}

async function main() {
  const defaultPassword = process.env.APP_PASSWORD || "admin123";
  const hashedPassword = hashPassword(defaultPassword);

  console.log("Seeding admin user...");
  
  await db.insert(users).values({
    email: "admin@factory.com",
    name: "Admin Audit",
    password: hashedPassword,
    role: "admin",
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