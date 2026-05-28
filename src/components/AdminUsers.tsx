"use client";

import React, { useState, useEffect } from "react";

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formPassword, setFormPassword] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: formName,
          role: formRole,
          password: formPassword || undefined
        })
      });
      if (res.ok) {
        alert("Пользователь обновлен");
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Удалить пользователя навсегда?")) return;
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: editingUser ? "1fr 350px" : "1fr", gap: "1.5rem" }}>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>👥 Управление пользователями</h3>
          <button onClick={fetchUsers} className="qty-btn" style={{ width: "auto", padding: "0 10px" }}>🔄</button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя / Index</th>
                <th>Username</th>
                <th>Роль</th>
                <th>Дата рег.</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    <strong>{u.name}</strong>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{u.userIndex}</div>
                  </td>
                  <td>@{u.username}</td>
                  <td>
                    <span className={`status-badge badge-${u.role === 'owner' ? 'owner' : (u.role === 'store_owner' ? 'processing' : 'client')}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.75rem" }}>{u.createdAt}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="qty-btn" style={{ width: "auto", padding: "0 6px" }} onClick={() => {
                        setEditingUser(u);
                        setFormName(u.name);
                        setFormRole(u.role);
                        setFormPassword("");
                      }}>✏️</button>
                      <button className="qty-btn" style={{ width: "auto", padding: "0 6px", color: "var(--danger)" }} onClick={() => handleDeleteUser(u.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="admin-card" style={{ position: "sticky", top: "80px", height: "fit-content" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>✏️ Редактировать</h3>
            <button onClick={() => setEditingUser(null)} style={{ cursor: "pointer" }}>✕</button>
          </div>
          <form onSubmit={handleUpdateUser}>
            <div className="form-group">
              <label>Отображаемое имя</label>
              <input className="form-input" value={formName} onChange={e => setFormName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Роль доступа</label>
              <select className="form-input" value={formRole} onChange={e => setFormRole(e.target.value)}>
                <option value="owner">Owner (Суперадмин)</option>
                <option value="admin">Admin (Модератор)</option>
                <option value="store_owner">Store Owner (Продавец)</option>
                <option value="wholesale">Wholesale (Оптовик)</option>
                <option value="client">Client (Покупатель)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Новый пароль (оставьте пустым)</label>
              <input className="form-input" type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="******" />
            </div>
            <button type="submit" className="btn-submit">Сохранить</button>
          </form>
        </div>
      )}
    </div>
  );
}
