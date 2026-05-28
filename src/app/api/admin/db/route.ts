import { NextResponse } from "next/server";
import { client } from "@/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 1. Verify credentials and session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // 2. Action: Get Tables List (PostgreSQL version)
    if (action === "get_tables") {
      try {
        const rows = await client.unsafe(
          "SELECT tablename as name FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'drizzle_%';"
        );
        const tables = rows.map((r: any) => r.name);
        return NextResponse.json({ success: true, tables });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
      }
    }

    // 3. Action: Select Table Content
    if (action === "select_table") {
      const { tableName } = body;
      if (!tableName || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
        return NextResponse.json({ success: false, error: "Invalid table name format" }, { status: 400 });
      }

      try {
        const rows = await client.unsafe(`SELECT * FROM "${tableName}" LIMIT 500;`);
        
        // Retrieve column headers from information_schema
        const tableInfo = await client.unsafe(`
          SELECT column_name as name, data_type as type, is_nullable as nullable
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position;
        `);
        
        const columns = tableInfo.map((col: any) => ({
          name: col.name,
          type: col.type,
          pk: col.name === 'id', // Simple heuristic for our schema
        }));

        return NextResponse.json({ success: true, tableName, rows, columns });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
      }
    }

    // 4. Action: Execute Custom SQL Query
    if (action === "execute_sql") {
      const { query } = body;
      if (!query || typeof query !== "string") {
        return NextResponse.json({ success: false, error: "SQL query is empty or invalid" }, { status: 400 });
      }

      try {
        const start = performance.now();
        const result = await client.unsafe(query);
        const elapsed = (performance.now() - start).toFixed(2);

        return NextResponse.json({
          success: true,
          result,
          elapsed,
          message: "Запрос выполнен успешно!",
        });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
      }
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
