import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL is not set. Database operations will fail on Vercel.");
}

// Use a more robust connection configuration for Supabase/Vercel
export const client = postgres(connectionString || "postgresql://localhost:5432/postgres", {
  ssl: "require", // Supabase requires SSL
  connect_timeout: 10,
  max: 10, // Limit connections for serverless
});

export const db = drizzle(client, { schema });
