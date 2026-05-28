"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/context/store-context";
import { AdminStores } from "./AdminStores";
import { AdminUsers } from "./AdminUsers";

interface PlatformAdminDashboardProps {
  dict: any;
  isPlatformAdmin: boolean;
}

export function PlatformAdminDashboard({ dict, isPlatformAdmin }: PlatformAdminDashboardProps) {
  const store = useStore();
  const [adminTab, setAdminTab] = useState<"users" | "stores" | "settings">("users");
  const [adminRate, setAdminRate] = useState(store.exchangeRate);
  const [adminDubai, setAdminDubai] = useState(store.dubaiCost);
  const [adminKorea, setAdminKorea] = useState(store.koreaCost);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      if (d.success) setTotalUsers(d.users.length);
    });
  }, []);

  if (!isPlatformAdmin) return null;

  return (
    <div className="platform-admin-dashboard">
      <div className="metrics-row">
        <div className="metric-box">
          <div className="metric-title">Всего пользователей</div>
          <div className="metric-val">{totalUsers}</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Активных магазинов</div>
          <div className="metric-val">{store.orders.length > 0 ? "..." : "Загрузка"} (в разработке)</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Активных товаров</div>
          <div className="metric-val">{store.products.length}</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Текущий курс</div>
          <div className="metric-val">{store.exchangeRate} сом</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
        {(["users", "stores", "settings"] as const).map((tab) => {
          const labels = { users: "👥 Пользователи", stores: "🏪 Магазины", settings: "⚙️ Настройки" };
          return (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              style={{
                padding: "0.6rem 1.2rem",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontWeight: adminTab === tab ? 700 : 400,
                color: adminTab === tab ? "var(--accent)" : "var(--text-secondary)",
                borderBottom: adminTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: "-1px",
                transition: "all 0.2s",
                fontSize: "0.95rem",
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {adminTab === "users" && (
        <AdminUsers />
      )}

      {adminTab === "stores" && (
        <AdminStores dict={dict} />
      )}

      {adminTab === "settings" && (
        <div style={{ maxWidth: "520px" }}>
          <div className="admin-card">
            <h3>{dict.adminSettings}</h3>
            <div className="form-group">
              <label>Курс USD/KGS</label>
              <input type="number" className="form-input" step="0.1" value={adminRate} onChange={(e) => setAdminRate(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Доставка Дубай ($)</label>
              <input type="number" className="form-input" value={adminDubai} onChange={(e) => setAdminDubai(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Доставка Корея ($)</label>
              <input type="number" className="form-input" value={adminKorea} onChange={(e) => setAdminKorea(parseFloat(e.target.value) || 0)} />
            </div>
            <button className="btn-submit" onClick={() => store.saveSettings(adminRate, adminDubai, adminKorea)}>Сохранить настройки</button>
          </div>

          <div className="admin-card" style={{ marginTop: "1.5rem" }}>
            <h3>Логи Telegram</h3>
            <div className="tg-log-console">
              {store.tgLogs.map(log => (
                <div className="tg-log-line" key={log.id}>
                  <div style={{ color: "#6c707e", fontSize: "0.7rem" }}>[{log.timestamp}]</div>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.75rem" }}>{log.payload}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
