"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useStore, Product } from "@/context/store-context";

interface SellerDashboardProps {
  dict: any;
}

export function SellerDashboard({ dict }: SellerDashboardProps) {
  const { data: session } = useSession();
  const store = useStore();
  
  // Tab state
  const [lkTab, setLkTab] = useState<"products" | "sales" | "staff" | "settings">("products");
  
  // Data listings
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myStaff, setMyStaff] = useState<any[]>([]);
  const [mySales, setMySales] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Product form states
  const [newBrand, setNewBrand] = useState<"Apple" | "Samsung" | "Xiaomi" | "Huawei" | "Honor" | "Realme" | "Tecno" | "Infinix" | "Poco" | "Google" | "OnePlus" | "Feature Phones">("Apple");
  const [newModel, setNewModel] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newBasePrice, setNewBasePrice] = useState("");
  const [newWholesalePrice, setNewWholesalePrice] = useState("");
  const [newStockQty, setNewStockQty] = useState("");
  const [newStatusTag, setNewStatusTag] = useState<"all" | "new" | "imported" | "promo">("all");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newDescription, setNewDescription] = useState("");
  const [newBatteryCapacity, setNewBatteryCapacity] = useState("");
  const [mediaItems, setMediaItems] = useState<{ id: string; type: "url" | "file"; url: string; file?: File }[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Staff form states
  const [staffName, setStaffName] = useState("");
  const [staffUsername, setStaffUsername] = useState("");
  const [staffTelegramId, setStaffTelegramId] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // Profile settings states
  const [settingsName, setSettingsName] = useState("");
  const [settingsUsername, setSettingsUsername] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  // Stats
  const totalInStock = myProducts.reduce((sum, p) => sum + p.stockQuantity, 0);
  const lowStockCount = myProducts.filter(p => p.stockQuantity <= 3 && p.stockQuantity > 0).length;
  const confirmedSales = mySales.filter(s => s.status === "completed" || s.status === "sold");
  const totalRevenue = confirmedSales.reduce((sum, s) => sum + s.totalUsd, 0);

  useEffect(() => {
    if (session?.user) {
      setSettingsName(session.user.name || "");
      setSettingsUsername((session.user as any).username || "");
      setSettingsPhone((session.user as any).phone || "");
      setSettingsEmail(session.user.email || "");
    }
  }, [session]);

  const fetchMyProducts = async () => {
    try {
      const res = await fetch(`/api/products?owner=mine&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setMyProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch my products:", err);
    }
  };

  const fetchMySales = async () => {
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setMySales(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to fetch sales:", err);
    }
  };

  const handleMarkAsSold = async (product: any) => {
    const qty = prompt(`Сколько единиц «${product.model}» продано?`, "1");
    if (!qty || isNaN(parseInt(qty)) || parseInt(qty) <= 0) return;
    
    const count = parseInt(qty);
    if (count > product.stockQuantity) {
      alert("Недостаточно товара на складе!");
      return;
    }

    try {
      const res = await fetch("/api/store/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: count,
          pricePaidUsd: product.basePriceUsd,
          exchangeRate: store.exchangeRate
        })
      });

      if (res.ok) {
        alert("Продажа зафиксирована!");
        fetchMyProducts();
        store.refetchProducts();
      } else {
        const err = await res.json();
        alert(`Ошибка: ${err.error}`);
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  const fetchMyStaff = async () => {
    try {
      const res = await fetch("/api/store/staff");
      if (res.ok) {
        const data = await res.json();
        setMyStaff(data.staff || []);
      }
    } catch (err) {
      console.error("Failed to fetch my staff:", err);
    }
  };

  useEffect(() => {
    if (lkTab === "products") fetchMyProducts();
    if (lkTab === "staff") fetchMyStaff();
  }, [lkTab]);

  const handleEditClick = (p: any) => {
    setEditingProduct(p);
    setNewBrand(p.brand);
    setNewModel(p.model);
    setNewMemory(p.memory || "");
    setNewColor(p.color || "");
    setNewBasePrice(p.basePriceUsd.toString());
    setNewWholesalePrice(p.wholesalePriceUsd.toString());
    setNewStockQty(p.stockQuantity.toString());
    setNewStatusTag(p.statusTag);
    setNewIsActive(p.isActive);
    setNewDescription(p.description);
    setNewBatteryCapacity(p.batteryCapacity ? p.batteryCapacity.toString() : "");
    
    // Parse images
    if (p.imageUrl) {
      const urls = p.imageUrl.split(",");
      setMediaItems(urls.map((u: string) => ({ id: Math.random().toString(), type: "url", url: u })));
    } else {
      setMediaItems([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewModel("");
    setNewMemory("");
    setNewColor("");
    setNewBasePrice("");
    setNewWholesalePrice("");
    setNewStockQty("");
    setNewDescription("");
    setNewBatteryCapacity("");
    setMediaItems([]);
    setUrlInput("");
    setNewStatusTag("all");
    setNewIsActive(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Вы действительно хотите удалить этот товар?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Товар удален.");
        fetchMyProducts();
        store.refetchProducts();
      } else {
        const err = await res.json();
        alert(`Ошибка: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Ошибка сети: ${err.message}`);
    }
  };

  const handleToggleProductActive = async (p: any) => {
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
      });
      if (res.ok) {
        fetchMyProducts();
        store.refetchProducts();
      }
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || (!staffUsername.trim() && !staffTelegramId.trim())) {
      alert("Заполните имя и хотя бы Username или Telegram ID.");
      return;
    }
    setIsSubmittingStaff(true);
    try {
      const res = await fetch("/api/store/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffName.trim(),
          username: staffUsername.trim() || null,
          telegramId: staffTelegramId.trim() || null,
          email: staffEmail.trim() || null,
          password: staffPassword.trim() || null,
        }),
      });

      if (res.ok) {
        alert("Сотрудник успешно добавлен!");
        setStaffName("");
        setStaffUsername("");
        setStaffTelegramId("");
        setStaffEmail("");
        setStaffPassword("");
        fetchMyStaff();
      } else {
        const data = await res.json();
        alert(`Ошибка: ${data.error || "Неизвестная ошибка"}`);
      }
    } catch (err: any) {
      alert(`Ошибка сети: ${err.message}`);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("Уволить сотрудника?")) return;
    try {
      const res = await fetch(`/api/store/staff?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Сотрудник удален.");
        fetchMyStaff();
      } else {
        const err = await res.json();
        alert(`Ошибка: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Ошибка сети: ${err.message}`);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim() || !newBasePrice || !newWholesalePrice || !newStockQty || !newDescription.trim()) {
      alert("Пожалуйста, заполните все обязательные поля.");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      let finalImageUrl = "";
      const localFiles = mediaItems.filter(item => item.type === "file" && item.file);
      
      if (localFiles.length > 0) {
        const formData = new FormData();
        localFiles.forEach(item => {
          if (item.file) formData.append("files", item.file);
        });
        
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Не удалось загрузить фотографии.");
        
        const uploadData = await uploadRes.json();
        const uploadedUrls = uploadData.urls;
        
        let fileIdx = 0;
        const mappedUrls = mediaItems.map(item => {
          if (item.type === "file") {
            const url = uploadedUrls[fileIdx];
            fileIdx++;
            return url;
          }
          return item.url;
        });
        finalImageUrl = mappedUrls.join(",");
      } else {
        finalImageUrl = mediaItems.map(item => item.url).join(",");
      }

      if (!finalImageUrl.trim()) {
        finalImageUrl = newBrand.toLowerCase();
      }

      const method = editingProduct ? "PATCH" : "POST";
      const payload: any = {
        brand: newBrand,
        model: newModel.trim(),
        memory: newMemory.trim() || null,
        color: newColor.trim() || null,
        basePriceUsd: parseInt(newBasePrice, 10),
        wholesalePriceUsd: parseInt(newWholesalePrice, 10),
        stockQuantity: parseInt(newStockQty, 10),
        statusTag: newStatusTag,
        imageUrl: finalImageUrl,
        description: newDescription.trim(),
        isActive: newIsActive,
        batteryCapacity: (newBrand === "Apple" && newStatusTag === "imported" && newBatteryCapacity) ? parseInt(newBatteryCapacity, 10) : null,
      };

      if (editingProduct) payload.id = editingProduct.id;

      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(editingProduct ? "Товар успешно обновлен!" : "Товар успешно добавлен!");
        handleCancelEdit();
        store.refetchProducts();
        fetchMyProducts();
      } else {
        const data = await res.json();
        alert(`Ошибка сохранения: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Ошибка сети: ${err.message}`);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim() || !settingsUsername.trim()) {
      alert("Название магазина и юзернейм Telegram обязательны.");
      return;
    }
    setIsSubmittingSettings(true);
    try {
      const res = await fetch("/api/store/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsName.trim(),
          username: settingsUsername.trim(),
          phone: settingsPhone.trim() || null,
          email: settingsEmail.trim() || null,
        }),
      });

      if (res.ok) {
        alert("Настройки профиля успешно обновлены!");
        window.location.reload();
      } else {
        const err = await res.json();
        alert(`Ошибка обновления: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Ошибка сети: ${err.message}`);
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newItems = filesArray.map(file => ({
        id: Math.random().toString(),
        type: "file" as const,
        url: URL.createObjectURL(file),
        file
      }));
      setMediaItems(prev => [...prev, ...newItems]);
    }
  };

  const handleAddUrlMedia = (urlStr: string) => {
    if (!urlStr.trim()) return;
    const items = urlStr.split(",").filter(Boolean).map(img => ({
      id: Math.random().toString(),
      type: "url" as const,
      url: img.trim()
    }));
    setMediaItems(prev => [...prev, ...items]);
  };

  const handleDeleteMedia = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const handleMoveMedia = (index: number, direction: "left" | "right") => {
    const nextIndex = direction === "left" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= mediaItems.length) return;
    const updated = [...mediaItems];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setMediaItems(updated);
  };

  const handleRotateMedia = async (id: string) => {
    const item = mediaItems.find(i => i.id === id);
    if (!item) return;
    
    if (item.type === "url" && !item.url.includes("/") && !item.url.startsWith("data:")) {
      alert("Невозможно повернуть стандартный логотип бренда.");
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      if (item.type === "file" && item.file) {
        canvas.toBlob((blob) => {
          if (blob) {
            const rotatedFile = new File([blob], item.file!.name, { type: item.file!.type });
            setMediaItems(prev => prev.map(m => m.id === id ? { ...m, url: URL.createObjectURL(rotatedFile), file: rotatedFile } : m));
          }
        }, item.file.type);
      } else {
        try {
          const rotatedUrl = canvas.toDataURL("image/jpeg");
          setMediaItems(prev => prev.map(m => m.id === id ? { ...m, url: rotatedUrl } : m));
        } catch (e) {
          alert("Не удалось отредактировать фото.");
        }
      }
    };
    img.src = item.url;
  };

  return (
    <div className="seller-dashboard">
      <div className="metrics-row" style={{ marginBottom: "2rem" }}>
        <div className="metric-box">
          <div className="metric-title">Всего в наличии</div>
          <div className="metric-val">{totalInStock} ед.</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Заканчивается</div>
          <div className="metric-val" style={{ color: lowStockCount > 0 ? "#edd456" : "inherit" }}>{lowStockCount} поз.</div>
        </div>
        <div className="metric-box">
          <div className="metric-title">Выручка (завершено)</div>
          <div className="metric-val" style={{ color: "var(--success)" }}>${totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="status-pills" style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
        <button className={`status-pill ${lkTab === "products" ? "active" : ""}`} onClick={() => setLkTab("products")}>📦 Товары</button>
        <button className={`status-pill ${lkTab === "sales" ? "active" : ""}`} onClick={() => setLkTab("sales")}>📈 История продаж</button>
        <button className={`status-pill ${lkTab === "staff" ? "active" : ""}`} onClick={() => setLkTab("staff")}>👥 Сотрудники</button>
        <button className={`status-pill ${lkTab === "settings" ? "active" : ""}`} onClick={() => setLkTab("settings")}>⚙️ Настройки</button>
      </div>

      {lkTab === "products" && (
        <div className="admin-grid" style={{ gridTemplateColumns: "2.5fr 1fr" }}>
          {/* Products List */}
          <div className="admin-card">
            <h3>Мои товары</h3>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Бренд</th>
                    <th>Модель</th>
                    <th>Цена ($)</th>
                    <th>Кол-во</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {myProducts.map((p) => (
                    <tr key={p.id} style={{ opacity: p.isActive ? 1 : 0.6 }}>
                      <td><strong>{p.brand}</strong></td>
                      <td>
                        {p.model}
                        {p.stockQuantity <= 3 && p.stockQuantity > 0 && <span style={{ marginLeft: "8px", fontSize: "0.6rem", color: "#edd456", background: "rgba(237,212,86,0.1)", padding: "2px 5px", borderRadius: "4px" }}>ЗАКОНЧИВАЕТСЯ</span>}
                      </td>
                      <td>${p.basePriceUsd}</td>
                      <td>{p.stockQuantity} ед</td>
                      <td>
                        <button onClick={() => handleToggleProductActive(p)} className={`status-badge ${p.isActive ? 'badge-completed' : 'badge-cancelled'}`} style={{ border: 'none', cursor: 'pointer' }}>
                          {p.isActive ? "Активен" : "Скрыт"}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="qty-btn" style={{ width: "auto", padding: "0 8px", fontSize: "0.75rem", background: "var(--success)", color: "#fff", border: "none" }} onClick={() => handleMarkAsSold(p)}>ПРОДАНО</button>
                          <button className="qty-btn" style={{ width: "auto", padding: "0 6px", fontSize: "0.75rem" }} onClick={() => handleEditClick(p)}>Ред.</button>
                          <button className="qty-btn" style={{ width: "auto", padding: "0 6px", fontSize: "0.75rem", color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => handleDeleteProduct(p.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Form */}
          <div className="admin-card">
            <h3>{editingProduct ? "Редактировать товар" : "Добавить новый товар"}</h3>
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label>Бренд</label>
                <select className="form-input" value={newBrand} onChange={(e) => setNewBrand(e.target.value as any)}>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="Poco">Poco</option>
                  <option value="Huawei">Huawei</option>
                  <option value="Honor">Honor</option>
                  <option value="Realme">Realme</option>
                  <option value="Tecno">Tecno</option>
                  <option value="Infinix">Infinix</option>
                  <option value="Google">Google</option>
                  <option value="OnePlus">OnePlus</option>
                  <option value="Feature Phones">Другие</option>
                </select>
              </div>
              <div className="form-group">
                <label>Модель</label>
                <input type="text" className="form-input" value={newModel} onChange={(e) => setNewModel(e.target.value)} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label>Память</label>
                  <input type="text" className="form-input" placeholder="8/256GB" value={newMemory} onChange={(e) => setNewMemory(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Цвет</label>
                  <input type="text" className="form-input" placeholder="Черный" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label>Цена розн. ($)</label>
                  <input type="number" className="form-input" value={newBasePrice} onChange={(e) => setNewBasePrice(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Цена опт ($)</label>
                  <input type="number" className="form-input" value={newWholesalePrice} onChange={(e) => setNewWholesalePrice(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label>Количество</label>
                  <input type="number" className="form-input" value={newStockQty} onChange={(e) => setNewStockQty(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Состояние</label>
                  <select className="form-input" value={newStatusTag} onChange={(e) => setNewStatusTag(e.target.value as any)}>
                    <option value="all">Без тега</option>
                    <option value="new">Новое</option>
                    <option value="imported">Б/У</option>
                    <option value="promo">Промо</option>
                  </select>
                </div>
              </div>

              {newBrand === "Apple" && newStatusTag === "imported" && (
                <div className="form-group">
                  <label>Емкость АКБ (%)</label>
                  <input type="number" className="form-input" min="0" max="100" placeholder="85" value={newBatteryCapacity} onChange={(e) => setNewBatteryCapacity(e.target.value)} />
                </div>
              )}
              
              <div className="form-group">
                <label>Фотографии</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem", padding: "8px", border: "1px dashed var(--border)", borderRadius: "8px" }}>
                  {mediaItems.map((item, idx) => (
                    <div key={item.id} style={{ position: "relative", width: "80px", height: "80px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", background: "#fff" }}>
                      <img src={item.url} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      
                      {/* Delete button */}
                      <button type="button" onClick={() => handleDeleteMedia(item.id)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(239,68,68,0.9)", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>&times;</button>
                      
                      {/* Move controls */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", background: "rgba(0,0,0,0.5)", height: "20px" }}>
                        <button type="button" onClick={() => handleMoveMedia(idx, "left")} disabled={idx === 0} style={{ flex: 1, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "10px", opacity: idx === 0 ? 0.3 : 1 }}>&larr;</button>
                        <button type="button" onClick={() => handleMoveMedia(idx, "right")} disabled={idx === mediaItems.length - 1} style={{ flex: 1, background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "10px", opacity: idx === mediaItems.length - 1 ? 0.3 : 1 }}>&rarr;</button>
                      </div>
                    </div>
                  ))}
                  <label style={{ width: "80px", height: "80px", border: "2px dashed var(--border)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.5rem", color: "var(--text-muted)" }}>
                    +
                    <input type="file" multiple accept="image/*" onChange={handleFilesChange} style={{ display: "none" }} />
                  </label>
                </div>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Первое фото будет основным в каталоге.</span>
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea className="form-input" style={{ height: "200px", lineHeight: "1.6" }} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                {editingProduct && <button type="button" className="btn-secondary" onClick={handleCancelEdit}>Отмена</button>}
                <button type="submit" className="btn-submit" disabled={isSubmittingProduct}>
                  {isSubmittingProduct ? "..." : (editingProduct ? "Сохранить" : "Добавить")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lkTab === "sales" && (
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3>📈 История продаж магазина</h3>
            <button onClick={fetchMySales} className="qty-btn" style={{ width: "auto", padding: "0 10px" }}>🔄 Обновить</button>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Товар</th>
                  <th>Тип продажи</th>
                  <th>Кол-во</th>
                  <th>Сумма USD</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {mySales.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Продаж пока нет</td></tr>
                ) : (
                  mySales.map(s => (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td><strong>{s.items}</strong></td>
                      <td>
                        <span className={`status-badge ${s.deliveryType === 'in-store' ? 'badge-processing' : 'badge-completed'}`}>
                          {s.deliveryType === 'in-store' ? "Оффлайн" : "Через сайт"}
                        </span>
                      </td>
                      <td>{s.items.split("x").pop() || 1}</td>
                      <td><strong style={{ color: "var(--success)" }}>${s.totalUsd}</strong></td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{s.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lkTab === "staff" && (
        <div className="admin-grid" style={{ gridTemplateColumns: "2fr 1.2fr" }}>
          {/* Staff List */}
          <div className="admin-card">
            <h3>Штат сотрудников</h3>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Telegram ID / @Username</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {myStaff.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>
                        <div style={{ fontSize: "0.85rem" }}>ID: <code>{s.telegramId || "—"}</code></div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>@{s.username}</div>
                      </td>
                      <td>
                        <button className="qty-btn" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => handleDeleteStaff(s.id)}>Уволить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staff Form */}
          <div className="admin-card">
            <h3>Добавить сотрудника</h3>
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label>Имя сотрудника</label>
                <input type="text" className="form-input" placeholder="Иван Иванов" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
              </div>
              
              <div className="form-group">
                <label>Telegram ID (Числовой)</label>
                <input type="text" className="form-input" placeholder="Напр. 5775694173" value={staffTelegramId} onChange={(e) => setStaffTelegramId(e.target.value)} />
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Для входа через бота</span>
              </div>

              <div style={{ borderTop: "1px dashed var(--border)", margin: "1rem 0", paddingTop: "1rem" }}>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Вход по паролю (опционально):</p>
                <div className="form-group">
                  <label>Логин / Username</label>
                  <input type="text" className="form-input" placeholder="ivan_staff" value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Пароль</label>
                  <input type="password" className="form-input" placeholder="******" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email (необязательно)</label>
                  <input type="email" className="form-input" placeholder="ivan@example.com" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={isSubmittingStaff}>Добавить в штат</button>
            </form>
          </div>
        </div>
      )}

      {lkTab === "settings" && (
        <div className="admin-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h3>Настройки профиля магазина</h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Название магазина</label>
              <input type="text" className="form-input" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Юзернейм Telegram</label>
              <input type="text" className="form-input" value={settingsUsername} onChange={(e) => setSettingsUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Контактный телефон</label>
              <input type="text" className="form-input" value={settingsPhone} onChange={(e) => setSettingsPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email адрес</label>
              <input type="email" className="form-input" value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn-submit" disabled={isSubmittingSettings}>Сохранить изменения</button>
          </form>
        </div>
      )}
    </div>
  );
}
