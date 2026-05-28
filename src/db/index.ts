import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ CRITICAL: DATABASE_URL environment variable is missing!");
  // In serverless, we want to avoid crashing the whole process but operations will fail.
}

// Configuration for Supabase
const clientConfig = {
  ssl: "require",
  connect_timeout: 15,
  max: 5, // Tighter connection limit for Vercel functions
  prepare: false, // Required for some transaction poolers
};

export const client = postgres(connectionString || "postgresql://not-set-placeholder", clientConfig);
export const db = drizzle(client, { schema });
