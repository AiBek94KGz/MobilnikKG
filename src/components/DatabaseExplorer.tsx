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
        width: "95vw",
        maxWidth: "1400px",
        height: "90vh",
        maxHeight: "900px",
        zIndex: 2000,
        background: "#1e1f22", // Pure IDE Dark
        border: "1px solid #393b40",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        overflow: "hidden",
        color: "#dfe1e5"
      }}
    >
      {/* Header */}
      <div 
        className="modal-header"
        style={{
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid #393b40",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#2b2d30",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", background: "rgba(89, 168, 105, 0.2)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#59a869" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#fff" }}>Drizzle Management Console</h3>
            <div style={{ fontSize: "0.65rem", color: "#90949d", textTransform: "uppercase", letterSpacing: "0.5px" }}>SQLite Engine • Internal Tool</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
           <span 
            style={{
              fontSize: "0.65rem",
              background: "#3574f0",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: "4px",
              fontWeight: 700,
            }}
          >
            STABLE v2
          </span>
          <span 
            className="drawer-close" 
            onClick={onClose}
            style={{ cursor: "pointer", fontSize: "1.5rem", color: "#90949d", transition: "color 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            &times;
          </span>
        </div>
      </div>

      {/* Body Container */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr", overflow: "hidden" }}>
        
        {/* Sidebar */}
        <div 
          style={{
            borderRight: "1px solid #393b40",
            background: "#2b2d30",
            padding: "1.25rem 0.75rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem"
          }}
        >
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6c707e", letterSpacing: "1px", textTransform: "uppercase", paddingLeft: "0.75rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 9h18M3 15h18"></path></svg>
            Tables
          </div>
          {dbIsLoading && dbTables.length === 0 ? (
            <div style={{ padding: "1rem", fontSize: "0.8rem", color: "#6c707e" }}>Loading tables...</div>
          ) : (
            dbTables.map((t) => (
              <button
                key={t}
                onClick={() => selectDbTable(t)}
                style={{
                  textAlign: "left",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "6px",
                  border: "none",
                  background: dbCurrentTable === t ? "rgba(53, 116, 240, 0.2)" : "transparent",
                  color: dbCurrentTable === t ? "#3574f0" : "#dfe1e5",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: dbCurrentTable === t ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.15s"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                <span>{t}</span>
              </button>
            ))
          )}
        </div>

        {/* Main Area */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#1e1f22" }}>
          
          {/* Tabs */}
          <div 
            style={{
              display: "flex",
              borderBottom: "1px solid #393b40",
              background: "#2b2d30",
              padding: "0 1.5rem",
              gap: "2.5rem"
            }}
          >
            <button
              onClick={() => setDbExplorerTab("browse")}
              style={{
                padding: "1rem 0",
                border: "none",
                background: "none",
                color: dbExplorerTab === "browse" ? "#3574f0" : "#90949d",
                borderBottom: dbExplorerTab === "browse" ? "2px solid #3574f0" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Data Explorer
            </button>
            <button
              onClick={() => setDbExplorerTab("terminal")}
              style={{
                padding: "1rem 0",
                border: "none",
                background: "none",
                color: dbExplorerTab === "terminal" ? "#3574f0" : "#90949d",
                borderBottom: dbExplorerTab === "terminal" ? "2px solid #3574f0" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
              SQL Console
            </button>
          </div>

          {/* Content Container */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "1.5rem" }}>
            
            {dbSqlError && (
              <div style={{ background: "rgba(219, 88, 96, 0.1)", borderLeft: "4px solid #db5860", color: "#db5860", padding: "1rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.8rem" }}>
                <div style={{ fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  Console Error
                </div>
                {dbSqlError}
              </div>
            )}
            
            {dbSqlSuccessMessage && (
              <div style={{ background: "rgba(89, 168, 105, 0.1)", borderLeft: "4px solid #59a869", color: "#59a869", padding: "0.85rem 1.25rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {dbSqlSuccessMessage}
                </span>
                {dbSqlElapsed && <span style={{ fontSize: "0.7rem", opacity: 0.6, background: "#2b2d30", padding: "2px 6px", borderRadius: "4px" }}>{dbSqlElapsed}ms</span>}
              </div>
            )}

            {dbExplorerTab === "browse" ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {dbCurrentTable ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Table: <code style={{ color: "#3574f0", background: "rgba(53, 116, 240, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>{dbCurrentTable}</code></span>
                        <span style={{ width: "1px", height: "16px", background: "#393b40" }}></span>
                        <span style={{ fontSize: "0.75rem", color: "#6c707e" }}>{dbTableRows.length} records found</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          onClick={generateInsertTemplate}
                          style={{ padding: "8px 14px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid #393b40", background: "transparent", color: "#dfe1e5", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          Insert Template
                        </button>
                        <button
                          onClick={() => selectDbTable(dbCurrentTable)}
                          style={{ padding: "8px 14px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid #393b40", background: "#393b40", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                          Refresh
                        </button>
                      </div>
                    </div>

                    <div style={{ flex: 1, overflow: "auto", border: "1px solid #393b40", borderRadius: "8px", background: "#2b2d30" }}>
                      {dbTableRows.length === 0 ? (
                        <div style={{ padding: "5rem", textAlign: "center", color: "#6c707e" }}>
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: "1.5rem", opacity: 0.1 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>
                          <p style={{ fontSize: "1rem" }}>This table is currently empty.</p>
                        </div>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "0.825rem", textAlign: "left" }}>
                          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                            <tr style={{ background: "#393b40" }}>
                              <th style={{ padding: "0.85rem", width: "50px", borderBottom: "1px solid #4b4d54", textAlign: "center" }}>#</th>
                              {dbTableColumns.map((col) => (
                                <th key={col.name} style={{ padding: "0.85rem", fontWeight: 700, color: "#fff", borderBottom: "1px solid #4b4d54", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {col.pk && <span title="Primary Key" style={{ color: "#edd456" }}>🔑</span>}
                                    {col.name}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dbTableRows.map((row, rIdx) => (
                              <tr 
                                key={rIdx} 
                                style={{
                                  background: rIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                                  transition: "background 0.1s"
                                }}
                              >
                                <td style={{ padding: "0.6rem", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  <button 
                                    onClick={() => handleRowDelete(row)}
                                    style={{ background: "none", border: "none", color: "#db5860", cursor: "pointer", opacity: 0.4, fontSize: "1.2rem" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
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
                                        padding: "0.75rem 1rem", 
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                        borderRight: "1px solid rgba(255,255,255,0.02)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "400px",
                                        color: val === null ? "#6c707e" : "#dfe1e5",
                                        fontFamily: typeof val === "number" || col.name.includes("id") ? "'JetBrains Mono', monospace" : "inherit"
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
                                            padding: "6px 10px",
                                            fontSize: "0.825rem",
                                            width: "100%",
                                            background: "#1e1f22",
                                            border: "2px solid #3574f0",
                                            color: "#fff",
                                            borderRadius: "6px",
                                            outline: "none",
                                            boxShadow: "0 0 10px rgba(53, 116, 240, 0.3)"
                                          }}
                                        />
                                      ) : (
                                        val === null ? "null" : String(val)
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
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6c707e" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#2b2d30", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                    </div>
                    <h4 style={{ color: "#dfe1e5", marginBottom: "0.75rem", fontSize: "1.1rem" }}>Initialize Workspace</h4>
                    <p style={{ fontSize: "0.9rem", maxWidth: "320px", textAlign: "center", lineHeight: "1.5" }}>Select a table from the sidebar navigation to explore data and manage records.</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem", overflow: "hidden" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ position: "relative", border: "1px solid #393b40", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ background: "#2b2d30", padding: "0.5rem 1rem", borderBottom: "1px solid #393b40", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                       <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#90949d", textTransform: "uppercase" }}>SQL Input</span>
                       <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={() => setDbSqlQuery("SELECT * FROM users LIMIT 10;")} style={{ fontSize: "0.6rem", background: "#393b40", color: "#90949d", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}>Users</button>
                          <button onClick={() => setDbSqlQuery("SELECT * FROM products LIMIT 10;")} style={{ fontSize: "0.6rem", background: "#393b40", color: "#90949d", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}>Products</button>
                       </div>
                    </div>
                    <textarea
                      value={dbSqlQuery}
                      onChange={(e) => setDbSqlQuery(e.target.value)}
                      placeholder="SELECT * FROM users WHERE role = 'owner';"
                      style={{
                        width: "100%",
                        height: "160px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.95rem",
                        padding: "1.25rem",
                        background: "#1e1f22",
                        border: "none",
                        color: "#edd456", // SQL Gold
                        resize: "none",
                        lineHeight: "1.6",
                        outline: "none"
                      }}
                    />
                    <div style={{ padding: "0.75rem 1.25rem", background: "#2b2d30", borderTop: "1px solid #393b40", display: "flex", justifyContent: "flex-end" }}>
                       <button
                        onClick={() => executeSqlQuery()}
                        disabled={dbIsLoading || !dbSqlQuery.trim()}
                        style={{ padding: "10px 20px", fontSize: "0.85rem", borderRadius: "8px", background: "#3574f0", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", opacity: dbIsLoading ? 0.6 : 1, transition: "all 0.2s" }}
                      >
                        {dbIsLoading ? "Executing..." : <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"></path></svg> Run Query</>}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #393b40", borderRadius: "10px", background: "#2b2d30" }}>
                  <div style={{ background: "#393b40", padding: "0.75rem 1.25rem", fontSize: "0.7rem", color: "#fff", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    Execution Results
                  </div>
                  <div style={{ flex: 1, overflow: "auto", padding: "0.75rem" }}>
                    {dbSqlResult ? (
                      Array.isArray(dbSqlResult) ? (
                        dbSqlResult.length === 0 ? (
                          <div style={{ padding: "3rem", color: "#6c707e", fontSize: "0.9rem", textAlign: "center" }}>
                            Statement executed. No records returned.
                          </div>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "0.8rem", textAlign: "left" }}>
                            <thead>
                              <tr style={{ background: "#393b40" }}>
                                {Object.keys(dbSqlResult[0]).map((key) => (
                                  <th key={key} style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#fff", borderBottom: "1px solid #4b4d54", borderRight: "1px solid rgba(255,255,255,0.05)" }}>{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dbSqlResult.map((row, idx) => (
                                <tr key={idx}>
                                  {Object.keys(row).map((key) => (
                                    <td key={key} style={{ padding: "0.75rem 1rem", color: "#dfe1e5", borderBottom: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.02)" }}>
                                      {row[key] === null ? <span style={{ color: "#6c707e" }}>null</span> : String(row[key])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      ) : (
                        <pre style={{ margin: 0, padding: "1.5rem", fontSize: "0.9rem", fontFamily: "'JetBrains Mono', monospace", color: "#59a869", lineHeight: "1.5" }}>
                          {JSON.stringify(dbSqlResult, null, 2)}
                        </pre>
                      )
                    ) : (
                      <div style={{ padding: "5rem", textAlign: "center", color: "#6c707e" }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: "1.5rem", opacity: 0.1 }}><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                        <p style={{ fontSize: "1rem" }}>Execution logs and query data will be displayed here.</p>
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
