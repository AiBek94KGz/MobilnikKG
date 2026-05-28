"use client";

import React, { useState } from "react";
import { useStore } from "@/context/store-context";
import { AdminStores } from "./AdminStores";

interface PlatformAdminDashboardProps {
  dict: any;
  isPlatformAdmin: boolean;
}

export function PlatformAdminDashboard({ dict, isPlatformAdmin }: PlatformAdminDashboardProps) {
  const store = useStore();
  const [adminTab, setAdminTab] = useState<"orders" | "stores" | "settings">("orders");
  const [adminRate, setAdminRate] = useState(store.exchangeRate);
  const [adminDubai, setAdminDubai] = useState(store.dubaiCost);
  const [adminKorea, setAdminKorea] = useState(store.koreaCost);

  if (!isPlatformAdmin) return null;

  return (
    <div className="platform-admin-dashboard">
      <div className="metrics-row">
        <div className="metric-box">
          <div className="metric-title">Сумма всех заказов</div>
          <div className="metric-val">
            ${store.orders.reduce((sum, o) => sum + o.totalUsd, 0).toLocaleString()}
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Всего заказов</div>
          <div className="metric-val">{store.orders.length}</div>
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
        {(["orders", "stores", "settings"] as const).map((tab) => {
          const labels = { orders: "📋 Заказы", stores: "🏪 Магазины", settings: "⚙️ Настройки" };
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

      {adminTab === "orders" && (
        <div className="admin-card">
          <h3>{dict.adminRecentOrders}</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Покупатель</th>
                  <th>Товары</th>
                  <th>Сумма USD</th>
                  <th>Статус</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {store.orders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>
                      <strong>{o.user?.name || "Гость"}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {o.user?.username ? `@${o.user.username}` : ""}
                      </div>
                    </td>
                    <td>{o.items}</td>
                    <td>${o.totalUsd.toLocaleString()}</td>
                    <td><span className={`status-badge badge-${o.status}`}>{o.status}</span></td>
                    <td>{o.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
