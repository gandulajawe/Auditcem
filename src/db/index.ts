// File: src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaPool?: Pool;
};

export const pool =
  globalForDb.__arenaPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaPool = pool;
}

export const db = drizzle(pool, { schema });
