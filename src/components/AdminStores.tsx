"use client";

import React, { useState, useEffect } from "react";

interface AdminStoresProps {
  dict: any;
}

export function AdminStores({ dict }: AdminStoresProps) {
  const [adminStores, setAdminStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storeFormMode, setStoreFormMode] = useState<"add" | "edit">("add");
  const [storeFormId, setStoreFormId] = useState<number | null>(null);
  const [storeFormName, setStoreFormName] = useState("");
  const [storeFormUsername, setStoreFormUsername] = useState("");
  const [storeFormPhone, setStoreFormPhone] = useState("");
  const [storeFormEmail, setStoreFormEmail] = useState("");
  const [storeFormPassword, setStoreFormPassword] = useState("");
  const [storeFormError, setStoreFormError] = useState<string | null>(null);
  const [storeFormSuccess, setStoreFormSuccess] = useState<string | null>(null);
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);
  const [deletingStoreId, setDeletingStoreId] = useState<number | null>(null);

  const fetchStores = async () => {
    setIsLoadingStores(true);
    try {
      const res = await fetch(`/api/admin/stores?t=${Date.now()}`);
      const d = await res.json();
      if (d.success) setAdminStores(d.stores);
    } catch (err) {
      console.error("Fetch stores error:", err);
    } finally {
      setIsLoadingStores(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreFormError(null);
    setStoreFormSuccess(null);
    setIsSubmittingStore(true);
    try {
      const isEdit = storeFormMode === "edit";
      const res = await fetch("/api/admin/stores", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: storeFormId,
          name: storeFormName,
          username: storeFormUsername,
          phone: storeFormPhone,
          email: storeFormEmail,
          password: storeFormPassword || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStoreFormSuccess(isEdit ? "Магазин успешно обновлён!" : `Магазин создан!`);
        if (isEdit) {
          setAdminStores(prev => prev.map(x => x.id === data.store.id ? { ...x, ...data.store } : x));
        } else {
          fetchStores(); // Refresh to get proper data
          setStoreFormName("");
          setStoreFormUsername("");
          setStoreFormPhone("");
          setStoreFormEmail("");
          setStoreFormPassword("");
        }
      } else {
        setStoreFormError(data.error || "Ошибка при сохранении");
      }
    } catch (err: any) {
      setStoreFormError("Ошибка сети");
    } finally {
      setIsSubmittingStore(false);
    }
  };

  const handleDeleteStore = async (id: number, name: string) => {
    if (!confirm(`Удалить магазин «${name}»? Это также удалит все его товары.`)) return;
    setDeletingStoreId(id);
    try {
      const res = await fetch(`/api/admin/stores?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAdminStores(prev => prev.filter(x => x.id !== id));
      } else {
        alert(data.error || "Ошибка удаления");
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setDeletingStoreId(null);
    }
  };

  const resetForm = () => {
    setStoreFormMode("add");
    setStoreFormId(null);
    setStoreFormName("");
    setStoreFormUsername("");
    setStoreFormPhone("");
    setStoreFormEmail("");
    setStoreFormPassword("");
    setStoreFormError(null);
    setStoreFormSuccess(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>
      {/* Left: Stores List */}
      <div className="admin-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>🏪 Список магазинов</h3>
          <button
            onClick={fetchStores}
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.3rem 0.7rem", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8rem" }}
          >
            🔄 Обновить
          </button>
        </div>

        {isLoadingStores ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>Загрузка...</div>
        ) : adminStores.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏪</div>
            <p>Магазины не добавлены</p>
            <p style={{ fontSize: "0.8rem" }}>Добавьте первый магазин в форме справа</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>@Username</th>
                  <th>Статус</th>
                  <th>Товаров</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {adminStores.map(s => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{s.slug}</div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>@{s.ownerUsername || s.username}</td>
                    <td>
                       <span className={`status-badge badge-${s.status === 'active' ? 'completed' : 'cancelled'}`}>
                         {s.status}
                       </span>
                    </td>
                    <td>
                      <span style={{ background: "rgba(99,102,241,0.15)", color: "var(--accent)", padding: "2px 8px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600 }}>
                        {s.productCount}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => {
                            setStoreFormMode("edit");
                            setStoreFormId(s.id);
                            setStoreFormName(s.name);
                            setStoreFormUsername(s.ownerUsername || s.username);
                            setStoreFormPhone(s.ownerPhone || s.phone || "");
                            setStoreFormEmail(s.ownerEmail || s.email || "");
                            setStoreFormError(null);
                            setStoreFormSuccess(null);
                          }}
                          style={{ padding: "0.25rem 0.6rem", borderRadius: "5px", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--accent)", fontSize: "0.8rem" }}
                        >
                          ✏️
                        </button>
                        <button
                          disabled={deletingStoreId === s.id}
                          onClick={() => handleDeleteStore(s.id, s.name)}
                          style={{ padding: "0.25rem 0.6rem", borderRadius: "5px", border: "1px solid rgba(239,68,68,0.3)", background: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.8rem", opacity: deletingStoreId === s.id ? 0.5 : 1 }}
                        >
                          {deletingStoreId === s.id ? "..." : "🗑"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right: Add / Edit Store Form */}
      <div className="admin-card" style={{ marginBottom: 0, position: "sticky", top: "80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>
            {storeFormMode === "add" ? "➕ Добавить магазин" : "✏️ Изменить магазин"}
          </h3>
          {storeFormMode === "edit" && (
            <button
              onClick={resetForm}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8rem" }}
            >
              ✕ Отмена
            </button>
          )}
        </div>

        {storeFormError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem", color: "#ef4444", fontSize: "0.85rem" }}>
            {storeFormError}
          </div>
        )}
        {storeFormSuccess && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem", color: "#22c55e", fontSize: "0.85rem" }}>
            {storeFormSuccess}
          </div>
        )}

        <form onSubmit={handleSubmitStore}>
          <div className="form-group">
            <label>Название магазина</label>
            <input
              type="text"
              className="form-input"
              value={storeFormName}
              onChange={(e) => setStoreFormName(e.target.value)}
              placeholder="Напр. Мобильник Оптом"
              required
            />
          </div>
          <div className="form-group">
            <label>Telegram Username (владелец)</label>
            <input
              type="text"
              className="form-input"
              value={storeFormUsername}
              onChange={(e) => setStoreFormUsername(e.target.value)}
              placeholder="Напр. abdulatif_optom"
              required
            />
          </div>
          <div className="form-group">
            <label>Телефон (опционально)</label>
            <input
              type="text"
              className="form-input"
              value={storeFormPhone}
              onChange={(e) => setStoreFormPhone(e.target.value)}
              placeholder="+996..."
            />
          </div>
          <div className="form-group">
            <label>Email (опционально)</label>
            <input
              type="email"
              className="form-input"
              value={storeFormEmail}
              onChange={(e) => setStoreFormEmail(e.target.value)}
              placeholder="mail@example.com"
            />
          </div>
          <div className="form-group">
            <label>{storeFormMode === "edit" ? "Новый пароль (оставьте пустым, если не меняете)" : "Пароль"}</label>
            <input
              type="password"
              className="form-input"
              value={storeFormPassword}
              onChange={(e) => setStoreFormPassword(e.target.value)}
              placeholder="******"
              required={storeFormMode === "add"}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingStore}
            className="btn-submit"
            style={{ marginTop: "0.5rem" }}
          >
            {isSubmittingStore ? "Сохранение..." : (storeFormMode === "add" ? "Создать магазин" : "Сохранить изменения")}
          </button>
        </form>
      </div>
    </div>
  );
}
