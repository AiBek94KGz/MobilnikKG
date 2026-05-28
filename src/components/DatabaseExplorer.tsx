"use client";

import React, { useState, useEffect } from "react";

interface DatabaseExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  isPlatformAdmin: boolean;
}

export function DatabaseExplorer({ isOpen, onClose, isPlatformAdmin }: DatabaseExplorerProps) {
  const [dbTables, setDbTables] = useState<string[]>([]);
  const [dbCurrentTable, setDbCurrentTable] = useState<string | null>(null);
  const [dbTableColumns, setDbTableColumns] = useState<{ name: string; type: string; pk: boolean }[]>([]);
  const [dbTableRows, setDbTableRows] = useState<any[]>([]);
  const [dbSqlQuery, setDbSqlQuery] = useState("");
  const [dbSqlResult, setDbSqlResult] = useState<any>(null);
  const [dbSqlElapsed, setDbSqlElapsed] = useState("");
  const [dbSqlError, setDbSqlError] = useState<string | null>(null);
  const [dbSqlSuccessMessage, setDbSqlSuccessMessage] = useState<string | null>(null);
  const [dbIsLoading, setDbIsLoading] = useState(false);
  const [dbExplorerTab, setDbExplorerTab] = useState<"browse" | "terminal">("browse");
  const [dbEditingCell, setDbEditingCell] = useState<{ rowIndex: number; columnName: string; originalValue: any; value: any } | null>(null);

  useEffect(() => {
    if (isOpen && isPlatformAdmin) {
      fetchTables();
    }
  }, [isOpen, isPlatformAdmin]);

  const fetchTables = async () => {
    setDbIsLoading(true);
    try {
      const res = await fetch("/api/admin/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_tables" }),
      });
      const data = await res.json();
      if (data.success) {
        setDbTables(data.tables);
        if (data.tables.length > 0 && !dbCurrentTable) {
          selectDbTable(data.tables[0]);
        }
      } else {
        setDbSqlError(data.error);
      }
    } catch (e: any) {
      setDbSqlError(e.message);
    } finally {
      setDbIsLoading(false);
    }
  };

  const selectDbTable = async (tableName: string) => {
    setDbCurrentTable(tableName);
    setDbEditingCell(null);
    setDbSqlError(null);
    setDbSqlSuccessMessage(null);
    setDbSqlResult(null);
    setDbIsLoading(true);
    try {
      const res = await fetch("/api/admin/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select_table", tableName }),
      });
      const data = await res.json();
      if (data.success) {
        setDbTableRows(data.rows);
        setDbTableColumns(data.columns);
        setDbSqlQuery(`SELECT * FROM \`${tableName}\` LIMIT 100;`);
      } else {
        setDbSqlError(data.error);
      }
    } catch (e: any) {
      setDbSqlError(e.message);
    } finally {
      setDbIsLoading(false);
    }
  };

  const executeSqlQuery = async (queryToRun?: string) => {
    const q = queryToRun || dbSqlQuery;
    if (!q.trim()) return;
    setDbIsLoading(true);
    setDbSqlError(null);
    setDbSqlSuccessMessage(null);
    setDbSqlResult(null);
    try {
      const res = await fetch("/api/admin/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute_sql", query: q }),
      });
      const data = await res.json();
      if (data.success) {
        setDbSqlResult(data.result);
        setDbSqlElapsed(data.elapsed);
        setDbSqlSuccessMessage(data.message || "Успешно выполнено!");
        if (/^\s*select/i.test(q) || /^\s*pragma/i.test(q)) {
          setDbTableRows(data.result);
          if (data.result.length > 0) {
            const keys = Object.keys(data.result[0]);
            setDbTableColumns(keys.map(k => ({ name: k, type: "", pk: k.toLowerCase() === "id" })));
          }
        } else {
          if (dbCurrentTable) {
            selectDbTable(dbCurrentTable);
          }
        }
      } else {
        setDbSqlError(data.error);
      }
    } catch (e: any) {
      setDbSqlError(e.message);
    } finally {
      setDbIsLoading(false);
    }
  };

  const handleCellEditSave = async () => {
    if (!dbEditingCell || !dbCurrentTable) return;
    const { rowIndex, columnName, value, originalValue } = dbEditingCell;
    if (value === originalValue) {
      setDbEditingCell(null);
      return;
    }

    const row = dbTableRows[rowIndex];
    const pkColumn = dbTableColumns.find(c => c.pk) || dbTableColumns.find(c => c.name.toLowerCase() === "id");
    if (!pkColumn) {
      alert("Не удалось обновить: таблица не содержит первичного ключа (id)");
      setDbEditingCell(null);
      return;
    }

    const pkValue = row[pkColumn.name];
    let sanitizedValue = value;
    const isNumber = typeof originalValue === "number" || (!isNaN(Number(value)) && value.trim() !== "");
    if (isNumber) {
      sanitizedValue = Number(value);
    }

    const sqlVal = typeof sanitizedValue === "number" ? sanitizedValue : `'${String(sanitizedValue).replace(/'/g, "''")}'`;
    const sqlPk = typeof pkValue === "number" ? pkValue : `'${String(pkValue).replace(/'/g, "''")}'`;

    const updateQuery = `UPDATE \`${dbCurrentTable}\` SET \`${columnName}\` = ${sqlVal} WHERE \`${pkColumn.name}\` = ${sqlPk};`;
    await executeSqlQuery(updateQuery);
    setDbEditingCell(null);
  };

  const handleRowDelete = async (row: any) => {
    if (!dbCurrentTable) return;
    const pkColumn = dbTableColumns.find(c => c.pk) || dbTableColumns.find(c => c.name.toLowerCase() === "id");
    if (!pkColumn) {
      alert("Не удалось удалить: таблица не содержит первичного ключа (id)");
      return;
    }

    const pkValue = row[pkColumn.name];
    if (!confirm(`Вы действительно хотите удалить строку с ${pkColumn.name} = ${pkValue}?`)) {
      return;
    }

    const sqlPk = typeof pkValue === "number" ? pkValue : `'${String(pkValue).replace(/'/g, "''")}'`;
    const deleteQuery = `DELETE FROM \`${dbCurrentTable}\` WHERE \`${pkColumn.name}\` = ${sqlPk};`;
    await executeSqlQuery(deleteQuery);
  };

  const generateInsertTemplate = () => {
    if (!dbCurrentTable || dbTableColumns.length === 0) return;
    const columnsList = dbTableColumns.filter(c => !c.pk).map(c => `\`${c.name}\``).join(", ");
    const valuesList = dbTableColumns.filter(c => !c.pk).map(c => c.type.toLowerCase().includes("int") || c.type.toLowerCase().includes("real") ? "0" : "''").join(", ");
    setDbSqlQuery(`INSERT INTO \`${dbCurrentTable}\` (${columnsList}) VALUES (${valuesList});`);
  };

  if (!isOpen || !isPlatformAdmin) return null;

  return (
    <div 
      className="modal open" 
      id="db-explorer-modal"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "92vw",
        maxWidth: "1280px",
        height: "86vh",
        maxHeight: "850px",
        zIndex: 1050,
        background: "var(--background-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div 
        className="modal-header"
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(0,0,0,0.15)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.3rem" }}>🛢️</span>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Редактор базы данных (Drizzle Explorer)</h3>
          <span 
            style={{
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              background: "rgba(0, 136, 204, 0.15)",
              color: "#0088cc",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "bold",
              border: "1px solid rgba(0,136,204,0.3)"
            }}
          >
            SQLite / Better-SQLite3
          </span>
        </div>
        <span 
          className="drawer-close" 
          onClick={onClose}
          style={{ cursor: "pointer", fontSize: "1.5rem", color: "var(--text-muted)" }}
        >
          &times;
        </span>
      </div>

      {/* Body Container */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr", overflow: "hidden" }}>
        
        {/* Sidebar: Tables List */}
        <div 
          style={{
            borderRight: "1px solid var(--border)",
            background: "rgba(0,0,0,0.08)",
            padding: "1rem 0.75rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}
        >
          <div style={{ fontSize: "0.7rem", fontWeight: "bold", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase", paddingLeft: "0.5rem", marginBottom: "0.25rem" }}>
            Таблицы
          </div>
          {dbIsLoading && dbTables.length === 0 ? (
            <div style={{ padding: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Загрузка...</div>
          ) : (
            dbTables.map((t) => (
              <button
                key={t}
                onClick={() => selectDbTable(t)}
                style={{
                  textAlign: "left",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "none",
                  background: dbCurrentTable === t ? "rgba(0, 136, 204, 0.15)" : "transparent",
                  color: dbCurrentTable === t ? "#0088cc" : "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "0.825rem",
                  fontWeight: dbCurrentTable === t ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.15s"
                }}
              >
                <span>📄 {t}</span>
              </button>
            ))
          )}
        </div>

        {/* Main Area: Grid & Console */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Tab Pills */}
          <div 
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              background: "rgba(0,0,0,0.05)",
              padding: "0.5rem 1rem",
              gap: "0.5rem"
            }}
          >
            <button
              onClick={() => setDbExplorerTab("browse")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "4px",
                border: "none",
                background: dbExplorerTab === "browse" ? "#0088cc" : "transparent",
                color: dbExplorerTab === "browse" ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600
              }}
            >
              🔍 Просмотр данных
            </button>
            <button
              onClick={() => setDbExplorerTab("terminal")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "4px",
                border: "none",
                background: dbExplorerTab === "terminal" ? "#0088cc" : "transparent",
                color: dbExplorerTab === "terminal" ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600
              }}
            >
              💻 SQL Терминал
            </button>
          </div>

          {/* Tab Contents */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "1rem" }}>
            
            {/* Status Messages */}
            {dbSqlError && (
              <div style={{ background: "rgba(255, 77, 79, 0.1)", border: "1px solid rgba(255, 77, 79, 0.3)", color: "#ff4d4f", padding: "0.75rem", borderRadius: "6px", marginBottom: "0.75rem", fontSize: "0.8rem" }}>
                <strong>Ошибка SQL:</strong> {dbSqlError}
              </div>
            )}
            {dbSqlSuccessMessage && (
              <div style={{ background: "rgba(82, 196, 26, 0.1)", border: "1px solid rgba(82, 196, 26, 0.3)", color: "#52c41a", padding: "0.75rem", borderRadius: "6px", marginBottom: "0.75rem", fontSize: "0.8rem", display: "flex", justifyContent: "space-between" }}>
                <span>✅ {dbSqlSuccessMessage}</span>
                {dbSqlElapsed && <span style={{ color: "var(--text-muted)" }}>Время: {dbSqlElapsed}мс</span>}
              </div>
            )}

            {dbExplorerTab === "browse" ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {dbCurrentTable ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Показано: <b>{dbTableRows.length}</b> записей в таблице <code>{dbCurrentTable}</code>.
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={generateInsertTemplate}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            borderRadius: "4px",
                            border: "1px dashed var(--border)",
                            background: "transparent",
                            color: "var(--text-secondary)",
                            cursor: "pointer"
                          }}
                        >
                          + Шаблон INSERT
                        </button>
                        <button
                          onClick={() => selectDbTable(dbCurrentTable)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            borderRadius: "4px",
                            border: "1px solid var(--border)",
                            background: "var(--background)",
                            color: "var(--text-primary)",
                            cursor: "pointer"
                          }}
                        >
                          🔄 Обновить
                        </button>
                      </div>
                    </div>

                    <div style={{ flex: 1, overflow: "auto", border: "1px solid var(--border)", borderRadius: "6px" }}>
                      {dbTableRows.length === 0 ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                          Таблица пуста.
                        </div>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "rgba(0,0,0,0.15)", borderBottom: "1px solid var(--border)" }}>
                              <th style={{ padding: "0.5rem", width: "40px", textAlign: "center" }}></th>
                              {dbTableColumns.map((col) => (
                                <th key={col.name} style={{ padding: "0.5rem", fontWeight: 600, borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                                  {col.pk ? "🔑 " : ""}{col.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dbTableRows.map((row, rIdx) => (
                              <tr 
                                key={rIdx} 
                                style={{
                                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                                  background: rIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"
                                }}
                              >
                                <td style={{ padding: "0.4rem", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                                  <button 
                                    onClick={() => handleRowDelete(row)}
                                    style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.9rem" }}
                                  >
                                    &times;
                                  </button>
                                </td>
                                {dbTableColumns.map((col) => {
                                  const val = row[col.name];
                                  const isEditing = dbEditingCell && dbEditingCell.rowIndex === rIdx && dbEditingCell.columnName === col.name;
                                  
                                  return (
                                    <td 
                                      key={col.name} 
                                      style={{ 
                                        padding: "0.4rem 0.5rem", 
                                        borderRight: "1px solid rgba(255,255,255,0.05)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "250px",
                                        cursor: "pointer"
                                      }}
                                      onClick={() => {
                                        if (!isEditing) {
                                          setDbEditingCell({
                                            rowIndex: rIdx,
                                            columnName: col.name,
                                            originalValue: val,
                                            value: val === null || val === undefined ? "" : String(val)
                                          });
                                        }
                                      }}
                                    >
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={dbEditingCell.value}
                                          onChange={(e) => setDbEditingCell({ ...dbEditingCell, value: e.target.value })}
                                          onBlur={handleCellEditSave}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleCellEditSave();
                                            if (e.key === "Escape") setDbEditingCell(null);
                                          }}
                                          autoFocus
                                          style={{
                                            padding: "2px 4px",
                                            fontSize: "0.75rem",
                                            width: "100%",
                                            margin: 0,
                                            borderRadius: "4px",
                                            border: "1px solid #0088cc"
                                          }}
                                        />
                                      ) : (
                                        val === null ? (
                                          <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>null</span>
                                        ) : typeof val === "boolean" ? (
                                          val ? "true" : "false"
                                        ) : (
                                          String(val)
                                        )
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Выберите таблицу в меню слева для просмотра данных.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", overflow: "hidden" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <textarea
                    value={dbSqlQuery}
                    onChange={(e) => setDbSqlQuery(e.target.value)}
                    placeholder="SELECT * FROM users LIMIT 100;"
                    style={{
                      width: "100%",
                      height: "90px",
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      padding: "0.5rem",
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      color: "#e6c274",
                      resize: "none"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => executeSqlQuery()}
                      disabled={dbIsLoading || !dbSqlQuery.trim()}
                      className="btn-submit"
                      style={{ padding: "0.45rem 1.25rem", fontSize: "0.8rem" }}
                    >
                      {dbIsLoading ? "Выполнение..." : "⚡ Выполнить запрос"}
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid var(--border)", borderRadius: "6px" }}>
                  <div style={{ background: "rgba(0,0,0,0.1)", borderBottom: "1px solid var(--border)", padding: "0.35rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Результат выполнения:
                  </div>
                  <div style={{ flex: 1, overflow: "auto", padding: "0.5rem" }}>
                    {dbSqlResult ? (
                      Array.isArray(dbSqlResult) ? (
                        dbSqlResult.length === 0 ? (
                          <div style={{ padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                            Вернулось 0 строк.
                          </div>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
                            <thead>
                              <tr style={{ background: "rgba(0,0,0,0.15)", borderBottom: "1px solid var(--border)" }}>
                                {Object.keys(dbSqlResult[0]).map((key) => (
                                  <th key={key} style={{ padding: "0.4rem", fontWeight: 600 }}>{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dbSqlResult.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                  {Object.keys(row).map((key) => (
                                    <td key={key} style={{ padding: "0.35rem 0.4rem", color: "var(--text-secondary)" }}>
                                      {row[key] === null ? "null" : String(row[key])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      ) : (
                        <pre style={{ margin: 0, padding: "0.5rem", fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                          {JSON.stringify(dbSqlResult, null, 2)}
                        </pre>
                      )
                    ) : (
                      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        Результаты появятся здесь.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
