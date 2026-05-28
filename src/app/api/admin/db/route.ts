import { NextResponse } from "next/server";
import { sqlite } from "@/db";
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

    // 2. Action: Get Tables List
    if (action === "get_tables") {
      try {
        const rows = sqlite.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_drizzle_%';"
        ).all() as any[];
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
        const rows = sqlite.prepare(`SELECT * FROM \`${tableName}\` LIMIT 500;`).all();
        
        // Retrieve column headers from the first row or query table info
        const tableInfo = sqlite.prepare(`PRAGMA table_info(\`${tableName}\`);`).all() as any[];
        const columns = tableInfo.map((col: any) => ({
          name: col.name,
          type: col.type,
          pk: col.pk === 1,
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

      const cleanQuery = query.trim();
      const isWriteQuery = /^(insert|update|delete|drop|alter|create|replace)/i.test(cleanQuery);
      const hasReturning = /returning/i.test(cleanQuery);

      try {
        const start = performance.now();
        let result;
        let message = "";

        if (isWriteQuery && !hasReturning) {
          const info = sqlite.prepare(cleanQuery).run();
          result = info;
          message = `Запрос выполнен успешно! Изменено строк: ${info.changes}, ID последней вставки: ${info.lastInsertRowid}`;
        } else {
          result = sqlite.prepare(cleanQuery).all();
          message = "Запрос выполнен успешно!";
        }

        const elapsed = (performance.now() - start).toFixed(2);

        return NextResponse.json({
          success: true,
          result,
          elapsed,
          message,
        });
      } catch (err: any) {
        let friendlyError = err.message;
        if (err.message.includes("readonly") || err.message.includes("read-only")) {
          friendlyError = "Ошибка: База данных находится в режиме 'Только чтение' (Vercel). Изменение структуры или данных отклонено.";
        }
        return NextResponse.json({ success: false, error: friendlyError });
      }
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
