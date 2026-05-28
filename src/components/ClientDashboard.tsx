"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "@/context/store-context";

interface ClientDashboardProps {
  dict: any;
}

export function ClientDashboard({ dict }: ClientDashboardProps) {
  const { data: session, update } = useSession();
  const store = useStore();
  const [lkTab, setLkTab] = useState<"history" | "settings">("history");
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Profile states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setPhone((session.user as any).phone || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  const fetchMyOrders = async () => {
    setIsLoading(true);
    try {
      // We'll create this API route next
      const res = await fetch(`/api/orders/my?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setMyOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lkTab === "history") fetchMyOrders();
  }, [lkTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });
      if (res.ok) {
        alert("Профиль успешно обновлен!");
        await update(); // Refresh session
      } else {
        const d = await res.json();
        alert(d.error || "Ошибка обновления");
      }
    } catch (err) {
      alert("Ошибка сети");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="client-dashboard">
      <div className="status-pills" style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
        <button className={`status-pill ${lkTab === "history" ? "active" : ""}`} onClick={() => setLkTab("history")}>🛍️ Мои заказы</button>
        <button className={`status-pill ${lkTab === "settings" ? "active" : ""}`} onClick={() => setLkTab("settings")}>👤 Настройки профиля</button>
      </div>

      {lkTab === "history" && (
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3>📦 История ваших покупок</h3>
            <button onClick={fetchMyOrders} className="qty-btn" style={{ width: "auto", padding: "0 10px" }}>🔄</button>
          </div>
          
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Заказ</th>
                  <th>Товары</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>Загрузка...</td></tr>
                ) : myOrders.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>У вас пока нет заказов</td></tr>
                ) : (
                  myOrders.map(o => (
                    <tr key={o.id}>
                      <td><code style={{ fontSize: "0.75rem" }}>#{o.id}</code></td>
                      <td>
                        <strong>{o.items}</strong>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{o.deliveryType === 'pre-order' ? "Предзаказ" : "В наличии"}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--success)" }}>${o.totalUsd}</div>
                        <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>{Math.round(o.totalUsd * o.exchangeRate).toLocaleString()} сом</div>
                      </td>
                      <td>
                        <span className={`status-badge badge-${o.status}`}>
                          {o.status === 'pending' ? 'Ожидает' : o.status === 'processing' ? 'В работе' : o.status === 'completed' ? 'Доставлен' : 'Отменен'}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{o.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lkTab === "settings" && (
        <div className="admin-card" style={{ maxWidth: "500px", margin: "0 auto" }}>
          <h3>Ваши данные</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Эти данные используются для связи при оформлении заказа.</p>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Ваше имя</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Номер телефона</label>
              <input type="text" className="form-input" placeholder="+996..." value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn-submit" disabled={isUpdating}>
              {isUpdating ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
