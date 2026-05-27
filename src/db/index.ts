import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.resolve(process.cwd(), "sqlite.db");
export const sqlite = new Database(dbPath, {
  readonly: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
});
export const db = drizzle(sqlite, { schema });
