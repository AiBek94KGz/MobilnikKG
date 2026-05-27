"use client";

import React, { useState, useEffect } from "react";
import { useStore, Product } from "@/context/store-context";
import { locales } from "@/lib/locales";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// --- SVG Icons Map for Device Rendering ---
const svgIcons: Record<string, React.ReactNode> = {
  apple: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  ),
  samsung: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <rect x="5" y="2" width="14" height="20" rx="2.5" ry="2.5"></rect>
      <line x1="10" y1="18" x2="14" y2="18"></line>
    </svg>
  ),
  xiaomi: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <circle cx="12" cy="18" r="0.5"></circle>
    </svg>
  ),
  feature: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <rect x="6" y="2" width="12" height="20" rx="2" ry="2"></rect>
      <line x1="6" y1="12" x2="18" y2="12"></line>
      <rect x="8" y="14" width="2" height="1.5" fill="currentColor" stroke="none"></rect>
      <rect x="11" y="14" width="2" height="1.5" fill="currentColor" stroke="none"></rect>
      <rect x="14" y="14" width="2" height="1.5" fill="currentColor" stroke="none"></rect>
      <rect x="8" y="17" width="2" height="1.5" fill="currentColor" stroke="none"></rect>
      <rect x="11" y="17" width="2" height="1.5" fill="currentColor" stroke="none"></rect>
      <rect x="14" y="17" width="2" height="1.5" fill="currentColor" stroke="none"></rect>
    </svg>
  )
};

function ProductCard({
  product,
  isWholesale,
  dict,
  renderPrice,
  renderAltPrice,
  addToCart,
  triggerPreorderFromCatalog,
  svgIcons,
}: {
  product: Product;
  isWholesale: boolean;
  dict: any;
  renderPrice: (val: number) => string;
  renderAltPrice: (val: number) => string;
  addToCart: (productId: number) => void;
  triggerPreorderFromCatalog: (productId: number) => void;
  svgIcons: Record<string, React.ReactNode>;
}) {
  const router = useRouter();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const images = product.imageUrl.split(",");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length, isHovered]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImage = images[currentImgIndex];
  const isRemoteImage = currentImage.startsWith("http");
  const isLocalImage = currentImage.startsWith("/");

  const priceUSD = isWholesale ? product.wholesalePriceUsd : product.basePriceUsd;
  const priceLabel = isWholesale ? dict.wholesalePrice : dict.retailPrice;

  return (
    <div 
      className="product-card" 
      onClick={() => router.push(`/product/${product.id}`)} 
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-img-wrapper" style={{ position: "relative", overflow: "hidden" }}>
        {product.statusTag !== "all" && (
          <span className={`product-status-tag tag-${product.statusTag}`}>
            {product.statusTag === "new" ? dict.statusNew : (product.statusTag === "imported" ? "Б/У" : dict.statusPromo)}
          </span>
        )}
        
        {/* Image / SVG display */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "100%" }}>
          {(isRemoteImage || isLocalImage) ? (
            <img 
              src={currentImage} 
              alt={`${product.brand} ${product.model}`} 
              className="product-main-img"
            />
          ) : (
            svgIcons[currentImage] || svgIcons.apple
          )}
        </div>

        {/* Carousel buttons */}
        {images.length > 1 && (
          <>
            <button 
              className="carousel-btn-prev" 
              onClick={handlePrev}
              style={{
                position: "absolute",
                left: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(30, 31, 34, 0.75)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
                fontSize: "0.7rem",
                fontWeight: "bold",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }}
            >
              &larr;
            </button>
            <button 
              className="carousel-btn-next" 
              onClick={handleNext}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(30, 31, 34, 0.75)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
                fontSize: "0.7rem",
                fontWeight: "bold",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }}
            >
              &rarr;
            </button>
            {/* Pagination dots */}
            <div style={{
              position: "absolute",
              bottom: "6px",
              left: "0",
              right: "0",
              display: "flex",
              justifyContent: "center",
              gap: "5px",
              zIndex: 2
            }}>
              {images.map((_, idx) => (
                <span 
                  key={idx}
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: idx === currentImgIndex ? "var(--success)" : "rgba(255,255,255,0.3)",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="product-brand">{product.brand}</div>
      <div className="product-model">{product.model}</div>
      <div className="product-specs">
        <ul className="product-specs-list">
          <li><span>Состояние:</span> <strong>{product.statusTag === "new" ? "Новое" : "Б/У"}</strong></li>
          {product.brand === "Apple" && product.statusTag === "imported" && product.batteryCapacity && (
            <li><span>АКБ:</span> <strong>{product.batteryCapacity}%</strong></li>
          )}
        </ul>
      </div>

      <div className="product-footer">
        <div className="product-price">
          <span className="price-main">{renderPrice(priceUSD)}</span>
          <span className="price-converted">≈ {renderAltPrice(priceUSD)}</span>
        </div>
        {product.stockQuantity > 0 ? (
          <button className="btn-card" onClick={(e) => { e.stopPropagation(); addToCart(product.id); }}>{dict.addToCart}</button>
        ) : (
          <button className="btn-card preorder" onClick={(e) => { e.stopPropagation(); triggerPreorderFromCatalog(product.id); }}>{dict.preOrderCTA}</button>
        )}
      </div>
    </div>
  );
}

export default function Storefront() {
  const { data: session } = useSession();
  const store = useStore();
  const dict = locales[store.language];
  const isWholesale =
    session?.user &&
    (((session.user as any).role === "wholesale") ||
      ((session.user as any).role === "owner"));

  const role = session?.user ? (session.user as any).role : null;
  const isStoreOwner = role === "store_owner";
  const isPlatformAdmin = role === "owner" || role === "admin";

  const [authMethod, setAuthMethod] = useState<null | "google" | "telegram">(null);
  const [authInputValue, setAuthInputValue] = useState("");

  const [tgAuthSessionCode, setTgAuthSessionCode] = useState<string | null>(null);
  const [isPollingTgAuth, setIsPollingTgAuth] = useState(false);

  useEffect(() => {
    if (authMethod === "telegram") {
      const generatedCode = "AUTH_" + Math.random().toString(36).substring(2, 10).toUpperCase();
      setTgAuthSessionCode(generatedCode);
      setIsPollingTgAuth(true);
    } else {
      setTgAuthSessionCode(null);
      setIsPollingTgAuth(false);
    }
  }, [authMethod]);

  useEffect(() => {
    if (!isPollingTgAuth || !tgAuthSessionCode) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/tg-poll?code=${tgAuthSessionCode}`);
        const data = await res.json();
        
        if (data.success && data.verified && data.username) {
          clearInterval(intervalId);
          setIsPollingTgAuth(false);
          store.loginTelegram(data.username);
          setAuthMethod(null);
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isPollingTgAuth, tgAuthSessionCode, store]);

  // 3. Handle redirect callback success parameters from telegram-callback
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const authSuccess = params.get("auth_success");
      const username = params.get("username");
      
      if (authSuccess === "true" && username) {
        store.loginTelegram(username);
        // Clean up the URL query parameters
        const url = new URL(window.location.href);
        url.searchParams.delete("auth_success");
        url.searchParams.delete("username");
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    }
  }, [store]);

  // Theme State local toggle handler
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("mobilnik-theme") as any || "dark";
    setThemeState(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("mobilnik-theme", next);
  };

  // Pre-order calculator state
  const [calcProductId, setCalcProductId] = useState<number>(1);
  const [calcQty, setCalcQty] = useState<number>(1);
  const [calcHub, setCalcHub] = useState<"dubai" | "korea">("dubai");

  useEffect(() => {
    if (store.products.length > 0) {
      setCalcProductId(store.products[0].id);
    }
  }, [store.products]);

  // Admin Quick settings form inputs
  const [adminRate, setAdminRate] = useState<number>(store.exchangeRate);
  const [adminDubai, setAdminDubai] = useState<number>(store.dubaiCost);
  const [adminKorea, setAdminKorea] = useState<number>(store.koreaCost);

  useEffect(() => {
    setAdminRate(store.exchangeRate);
    setAdminDubai(store.dubaiCost);
    setAdminKorea(store.koreaCost);
  }, [store.exchangeRate, store.dubaiCost, store.koreaCost]);

  // Admin Add Product form inputs
  const [newBrand, setNewBrand] = useState<"Apple" | "Samsung" | "Xiaomi" | "Feature Phones">("Apple");
  const [newModel, setNewModel] = useState("");
  const [newBasePrice, setNewBasePrice] = useState("");
  const [newWholesalePrice, setNewWholesalePrice] = useState("");
  const [newStockQty, setNewStockQty] = useState("");
  const [newStatusTag, setNewStatusTag] = useState<"all" | "new" | "imported" | "promo">("new");
  const [newImageUrl, setNewImageUrl] = useState("apple");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // New state variables for visibility, battery capacity, and image upload previews
  const [newIsActive, setNewIsActive] = useState(true);
  const [newBatteryCapacity, setNewBatteryCapacity] = useState("");
  const [mediaItems, setMediaItems] = useState<{ id: string; type: "url" | "file"; url: string; file?: File }[]>([]);
  const [urlInput, setUrlInput] = useState("");

  // Database Explorer state variables
  const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
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

  // Load tables when DB explorer opens
  useEffect(() => {
    if (isDbExplorerOpen) {
      fetchTables();
    }
  }, [isDbExplorerOpen]);

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
        // Pre-fill SQL Query console with helper SELECT query
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
        // If we ran a SELECT query, try to parse it to show rows in our grid
        if (/^\s*select/i.test(q) || /^\s*pragma/i.test(q)) {
          setDbTableRows(data.result);
          if (data.result.length > 0) {
            const keys = Object.keys(data.result[0]);
            setDbTableColumns(keys.map(k => ({ name: k, type: "", pk: k.toLowerCase() === "id" })));
          }
        } else {
          // If it was a write query, reload current table if any
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
    // We need a primary key (usually 'id') to update the row
    const pkColumn = dbTableColumns.find(c => c.pk) || dbTableColumns.find(c => c.name.toLowerCase() === "id");
    if (!pkColumn) {
      alert("Не удалось обновить: таблица не содержит первичного ключа (id)");
      setDbEditingCell(null);
      return;
    }

    const pkValue = row[pkColumn.name];
    let sanitizedValue = value;
    
    // Simple quotes/escape for SQLite strings vs numbers
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
            setMediaItems(prev => prev.map(m => m.id === id ? {
              ...m,
              url: URL.createObjectURL(rotatedFile),
              file: rotatedFile
            } : m));
          }
        }, item.file.type);
      } else {
        try {
          const rotatedUrl = canvas.toDataURL("image/jpeg");
          setMediaItems(prev => prev.map(m => m.id === id ? {
            ...m,
            url: rotatedUrl
          } : m));
        } catch (e) {
          alert("Не удалось отредактировать это фото.");
        }
      }
    };
    img.src = item.url;
  };

  // LK Tab state & listings
  const [lkTab, setLkTab] = useState<"products" | "staff" | "settings">("products");
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myStaff, setMyStaff] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Staff form states
  const [staffName, setStaffName] = useState("");
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // Profile settings states
  const [settingsName, setSettingsName] = useState("");
  const [settingsUsername, setSettingsUsername] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setSettingsName(session.user.name || "");
      setSettingsUsername((session.user as any).username || "");
      setSettingsPhone((session.user as any).phone || "");
      setSettingsEmail(session.user.email || "");
    }
  }, [session]);

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

  // Fetch functions
  const fetchMyProducts = async () => {
    try {
      const res = await fetch("/api/products?owner=mine");
      if (res.ok) {
        const data = await res.json();
        setMyProducts(data.products);
      }
    } catch (err) {
      console.error("Error loading my products:", err);
    }
  };

  const fetchMyStaff = async () => {
    try {
      const res = await fetch("/api/store/staff");
      if (res.ok) {
        const data = await res.json();
        setMyStaff(data.staff);
      }
    } catch (err) {
      console.error("Error loading my staff:", err);
    }
  };

  // Fetch when section changes or store owner logs in
  useEffect(() => {
    if (store.section === "admin" && isStoreOwner) {
      fetchMyProducts();
      fetchMyStaff();
    }
  }, [store.section, isStoreOwner, session]);

  const handleEditClick = (p: any) => {
    setEditingProduct(p);
    setNewBrand(p.brand);
    setNewModel(p.model);
    setNewBasePrice(p.basePriceUsd.toString());
    setNewWholesalePrice(p.wholesalePriceUsd.toString());
    setNewStockQty(p.stockQuantity.toString());
    setNewStatusTag(p.statusTag);
    setNewImageUrl(p.imageUrl);
    setNewDescription(p.description);
    setNewIsActive(p.isActive !== undefined ? !!p.isActive : true);
    setNewBatteryCapacity(p.batteryCapacity !== undefined && p.batteryCapacity !== null ? p.batteryCapacity.toString() : "");
    if (p.imageUrl) {
      const items = p.imageUrl.split(",").filter(Boolean).map((img: string) => ({
        id: Math.random().toString(),
        type: "url" as const,
        url: img
      }));
      setMediaItems(items);
    } else {
      setMediaItems([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewBrand("Apple");
    setNewModel("");
    setNewBasePrice("");
    setNewWholesalePrice("");
    setNewStockQty("");
    setNewStatusTag("new");
    setNewImageUrl("apple");
    setNewDescription("");
    setNewIsActive(true);
    setNewBatteryCapacity("");
    setMediaItems([]);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот товар?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Товар успешно удален.");
        fetchMyProducts();
        store.refetchProducts();
      } else {
        const err = await res.json();
        alert(`Ошибка удаления: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Ошибка сети: ${err.message}`);
    }
  };

  // Toggle active state of product directly from table
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
      } else {
        const err = await res.json();
        alert(`Ошибка изменения активности: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Ошибка сети: ${err.message}`);
    }
  };

  // Staff handlers
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffUsername.trim()) {
      alert("Заполните имя и юзернейм.");
      return;
    }
    setIsSubmittingStaff(true);
    try {
      const res = await fetch("/api/store/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffName.trim(),
          username: staffUsername.trim(),
          phone: staffPhone.trim() || null,
        }),
      });

      if (res.ok) {
        alert("Сотрудник успешно добавлен!");
        setStaffName("");
        setStaffUsername("");
        setStaffPhone("");
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
      // 1. Upload local images first
      let finalImageUrl = "";
      const localFiles = mediaItems.filter(item => item.type === "file" && item.file);
      
      if (localFiles.length > 0) {
        const formData = new FormData();
        localFiles.forEach(item => {
          if (item.file) {
            formData.append("files", item.file);
          }
        });
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) {
          throw new Error("Не удалось загрузить локальные фотографии на сервер.");
        }
        
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
        finalImageUrl = newBrand === "Apple" ? "apple" : (newBrand === "Samsung" ? "samsung" : (newBrand === "Xiaomi" ? "xiaomi" : "feature"));
      }

      const method = editingProduct ? "PATCH" : "POST";
      const payload: any = {
        brand: newBrand,
        model: newModel.trim(),
        basePriceUsd: parseInt(newBasePrice, 10),
        wholesalePriceUsd: parseInt(newWholesalePrice, 10),
        stockQuantity: parseInt(newStockQty, 10),
        statusTag: newStatusTag,
        imageUrl: finalImageUrl,
        description: newDescription.trim(),
        isActive: newIsActive,
        batteryCapacity: (newBrand === "Apple" && newStatusTag === "imported" && newBatteryCapacity) ? parseInt(newBatteryCapacity, 10) : null,
      };

      if (editingProduct) {
        payload.id = editingProduct.id;
      }

      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(editingProduct ? "Товар успешно обновлен!" : "Товар успешно добавлен!");
        handleCancelEdit();
        
        store.refetchProducts();
        store.refetchAdminData();
        if (isStoreOwner) {
          fetchMyProducts();
        }
      } else {
        const data = await res.json();
        alert(`Ошибка сохранения товара: ${data.error || "Неизвестная ошибка"}`);
      }
    } catch (err: any) {
      console.error("Failed to save product:", err);
      alert(`Ошибка сети: ${err.message}`);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Pricing helper
  const renderPrice = (usdVal: number) => {
    if (store.currency === "KGS") {
      const kgsVal = Math.round(usdVal * store.exchangeRate);
      return `${kgsVal.toLocaleString("ru-RU")} сом`;
    }
    return `$${usdVal.toLocaleString("en-US")}`;
  };

  const renderAltPrice = (usdVal: number) => {
    if (store.currency === "KGS") {
      return `$${usdVal.toLocaleString("en-US")}`;
    }
    return `${Math.round(usdVal * store.exchangeRate).toLocaleString("ru-RU")} сом`;
  };

  // Handle preorder select trigger from catalog
  const triggerPreorderFromCatalog = (productId: number) => {
    setCalcProductId(productId);
    store.setSection("preorder");
  };

  // Pre-order calculation breakdown
  const matchedProd = store.products.find(p => p.id === calcProductId);
  const prodPriceUsd = matchedProd ? (isWholesale ? matchedProd.wholesalePriceUsd : matchedProd.basePriceUsd) : 0;
  const shipCostUsd = calcHub === "dubai" ? store.dubaiCost : store.koreaCost;
  
  const totalProdUsd = prodPriceUsd * calcQty;
  const totalShipUsd = shipCostUsd * calcQty;
  const totalUsd = totalProdUsd + totalShipUsd;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Overlay Background */}
      {(store.isCartOpen || store.isAuthOpen || isDbExplorerOpen) && (
        <div className="overlay open" onClick={() => {
          store.setCartOpen(false);
          store.setAuthOpen(false);
          setAuthMethod(null);
          setAuthInputValue("");
          setIsDbExplorerOpen(false);
        }}></div>
      )}

      {/* Header Sticky Navbar */}
      <header>
        <div className="container header-container">
          {/* Logo */}
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); store.setSection("instock"); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <span>Mobilnik.KG</span>
          </a>

          {/* Section Switcher Tabs */}
          <div className="section-tabs">
            <div className={`section-tab ${store.section === "instock" ? "active" : ""}`} onClick={() => store.setSection("instock")}>
              {dict.navInStock}
            </div>
            <div className={`section-tab ${store.section === "preorder" ? "active" : ""}`} onClick={() => store.setSection("preorder")}>
              {dict.navPreOrder}
            </div>
            {session?.user && (
              ((session.user as any).role === "owner" || 
               (session.user as any).role === "admin" || 
               (session.user as any).role === "store_owner")
            ) && (
              <div 
                className={`section-tab ${store.section === "admin" ? "active" : ""}`} 
                style={{ backgroundColor: "var(--danger)", color: "#fff" }} 
                onClick={() => store.setSection("admin")}
              >
                {(session.user as any).role === "store_owner" ? "ЛК Магазина" : "Админка"}
              </div>
            )}
          </div>

          {/* Controls Group */}
          <div className="controls-group">
            {/* Theme Toggle */}
            <button className="icon-btn" onClick={toggleTheme} title="Переключить тему">
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>

            {/* Language dropdown - Hidden as requested */}
            {/* <select className="select-custom" value={store.language} onChange={(e) => store.setLanguage(e.target.value as any)}>
              <option value="ru">RU</option>
              <option value="en">EN</option>
              <option value="kg">KG</option>
              <option value="uz">UZ</option>
            </select> */}

            {/* USD/KGS toggle - Swapped order: USD | SOM */}
            <div className="currency-toggle">
              <div className={`currency-btn ${store.currency === "USD" ? "active" : ""}`} onClick={() => store.setCurrency("USD")}>USD</div>
              <div className={`currency-btn ${store.currency === "KGS" ? "active" : ""}`} onClick={() => store.setCurrency("KGS")}>сом</div>
            </div>

            {/* Cart Button */}
            <button className="icon-btn" onClick={() => store.setCartOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              {store.cartCount > 0 && <span className="badge">{store.cartCount}</span>}
            </button>

            {/* User Profile - Better Login Label */}
            <div className="user-badge" onClick={() => store.setAuthOpen(true)} style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "var(--accent)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              <div className="user-avatar" style={{ width: "24px", height: "24px", fontSize: "0.75rem", background: "rgba(255,255,255,0.2)" }}>
                {session?.user?.name ? session.user.name.charAt(0) : "Г"}
              </div>
              <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{session?.user?.name || "Войти"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container View: В наличии (Catalog) */}
      {store.section === "instock" && (
        <main>
          {/* Hero section */}
          <section className="hero">
            <div className="container">
              <div className="hero-banner">
                <div className="hero-content">
                  <h1 className="hero-title" dangerouslySetInnerHTML={{
                    __html: store.language === "ru" 
                      ? "В наличии и под заказ<br>без лишних переплат."
                      : (store.language === "kg" ? "Кампада бар жана заказга<br>ашыкча төлөмсүз." : "In Stock & Pre-order<br>without extra fees.")
                  }}></h1>
                  <p className="hero-subtitle">{dict.heroSubtitle}</p>
                  <button className="hero-btn" onClick={() => store.setSection("preorder")}>{dict.preOrderCTA}</button>
                </div>
                <div className="hero-image">
                  <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
                    <rect x="5" y="1.5" width="14" height="21" rx="2.5" ry="2.5" fill="var(--card)"></rect>
                    <path d="M12 18h.01"></path>
                    <path d="M9 3h6"></path>
                    <rect x="6.5" y="4.5" width="11" height="12" rx="1" fill="var(--background)" stroke="var(--border)" strokeWidth="0.5"></rect>
                    <circle cx="12" cy="10" r="2" stroke="var(--text-muted)" strokeWidth="0.5"></circle>
                    <line x1="8" y1="14" x2="16" y2="14" stroke="var(--text-muted)" strokeWidth="0.5"></line>
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* Brands Row */}
          <section className="brand-tabs-container">
            <div className="container">
              <div className="brand-tabs">
                <button className={`brand-tab ${store.selectedBrand === "all" ? "active" : ""}`} onClick={() => { store.setSelectedBrand("all"); store.setSelectedStatus("all"); }}>
                  {dict.brandAll}
                </button>
                <button className={`brand-tab ${store.selectedBrand === "Apple" ? "active" : ""}`} onClick={() => { store.setSelectedBrand("Apple"); store.setSelectedStatus("all"); }}>Apple</button>
                <button className={`brand-tab ${store.selectedBrand === "Samsung" ? "active" : ""}`} onClick={() => { store.setSelectedBrand("Samsung"); store.setSelectedStatus("all"); }}>Samsung</button>
                <button className={`brand-tab ${store.selectedBrand === "Xiaomi" ? "active" : ""}`} onClick={() => { store.setSelectedBrand("Xiaomi"); store.setSelectedStatus("all"); }}>Xiaomi</button>
                <button className={`brand-tab ${store.selectedBrand === "Feature Phones" ? "active" : ""}`} onClick={() => { store.setSelectedBrand("Feature Phones"); store.setSelectedStatus("all"); }}>Кнопочные</button>
              </div>

              {/* Brand Specific status filters pills */}
              {store.selectedBrand !== "all" && (
                <div className="status-pills">
                  <button className={`status-pill ${store.selectedStatus === "all" ? "active" : ""}`} onClick={() => store.setSelectedStatus("all")}>{dict.statusAll}</button>
                  <button className={`status-pill ${store.selectedStatus === "new" ? "active" : ""}`} onClick={() => store.setSelectedStatus("new")}>{dict.statusNew}</button>
                  <button className={`status-pill ${store.selectedStatus === "imported" ? "active" : ""}`} onClick={() => store.setSelectedStatus("imported")}>{dict.statusImported}</button>
                  <button className={`status-pill ${store.selectedStatus === "promo" ? "active" : ""}`} onClick={() => store.setSelectedStatus("promo")}>{dict.statusPromo}</button>
                </div>
              )}
            </div>
          </section>

          {/* Products grid */}
          <section className="catalog-section">
            <div className="container">
              {store.isLoadingProducts ? (
                <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>Загрузка каталога...</div>
              ) : store.products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>Нет подходящих товаров в наличии.</div>
              ) : (
                <div className="products-grid">
                  {store.products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWholesale={!!isWholesale}
                      dict={dict}
                      renderPrice={renderPrice}
                      renderAltPrice={renderAltPrice}
                      addToCart={store.addToCart}
                      triggerPreorderFromCatalog={triggerPreorderFromCatalog}
                      svgIcons={svgIcons}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      {/* Main Container View: Заказать (Pre-orders Calculator) */}
      {store.section === "preorder" && (
        <main className="preorder-section">
          <div className="container">
            <div className="preorder-title-block">
              <h1>{dict.preOrderTitle}</h1>
              <p>{dict.preOrderSubtitle}</p>
            </div>

            {/* Hub info rows */}
            <div className="hubs-grid">
              <div className="hub-card">
                <div className="hub-flag">🇦🇪</div>
                <div className="hub-info">
                  <h2>{dict.dubaiHub}</h2>
                  <div className="hub-meta">Срок: 7-14 дней</div>
                  <div className="hub-cost">Доставка: ${store.dubaiCost} / ед</div>
                </div>
              </div>
              <div className="hub-card">
                <div className="hub-flag">🇰🇷</div>
                <div className="hub-info">
                  <h2>{dict.koreaHub}</h2>
                  <div className="hub-meta">Срок: 10-21 день</div>
                  <div className="hub-cost">Доставка: ${store.koreaCost} / ед</div>
                </div>
              </div>
            </div>

            {/* Calculator Card */}
            <div className="calc-card">
              <h2>{dict.calcTitle}</h2>
              <div className="form-group">
                <label htmlFor="preorder-product">Выберите устройство</label>
                <select id="preorder-product" className="form-input" value={calcProductId} onChange={(e) => setCalcProductId(parseInt(e.target.value))}>
                  {store.products.map(p => {
                    const price = isWholesale ? p.wholesalePriceUsd : p.basePriceUsd;
                    return (
                      <option value={p.id} key={p.id}>
                        {p.brand} {p.model} - ${price}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="preorder-qty">Количество</label>
                <input type="number" id="preorder-qty" value={calcQty} min="1" max="100" className="form-input" onChange={(e) => setCalcQty(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>

              <div className="form-group">
                <label id="label-origin-hub">Страна доставки</label>
                <div className="hub-selector">
                  <div className={`hub-opt ${calcHub === "dubai" ? "active" : ""}`} onClick={() => setCalcHub("dubai")}>🇦🇪 Дубай</div>
                  <div className={`hub-opt ${calcHub === "korea" ? "active" : ""}`} onClick={() => setCalcHub("korea")}>🇰🇷 Корея</div>
                </div>
              </div>

              <div className="calc-breakdown">
                <div className="calc-row">
                  <span>Стоимость устройства</span>
                  <div>
                    <strong>${totalProdUsd.toLocaleString()}</strong>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}> (≈ {renderPrice(totalProdUsd)})</span>
                  </div>
                </div>
                <div className="calc-row">
                  <span>Стоимость доставки</span>
                  <div>
                    <strong>${totalShipUsd.toLocaleString()}</strong>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}> (≈ {renderPrice(totalShipUsd)})</span>
                  </div>
                </div>
                <div className="calc-row total">
                  <span>Итоговая сумма</span>
                  <div>
                    <strong style={{ fontSize: "1.5rem", color: "var(--success)" }}>${totalUsd.toLocaleString()}</strong>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, textAlign: "right" }}>{renderPrice(totalUsd)}</div>
                  </div>
                </div>
              </div>

              <button className="btn-submit" onClick={() => store.submitPreorder(calcProductId, calcQty, calcHub)}>{dict.submitPreOrder}</button>
            </div>
          </div>
        </main>
      )}

      {/* Main Container View: Панель Администратора / ЛК Магазина */}
      {store.section === "admin" && session?.user && (
        <main className="admin-section">
          <div className="container">
            <div className="admin-header-row">
              <h1>{isStoreOwner ? "Личный кабинет магазина" : dict.adminTitle}</h1>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {isPlatformAdmin && (
                  <button 
                    className="hero-btn" 
                    style={{ backgroundColor: "var(--success)", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }} 
                    onClick={() => setIsDbExplorerOpen(true)}
                  >
                    🛢️ База данных
                  </button>
                )}
                <button className="hero-btn" style={{ backgroundColor: "var(--border)", color: "var(--text-primary)" }} onClick={() => store.setSection("instock")}>Вернуться</button>
              </div>
            </div>

            {/* Quick Metrics */}
            {isPlatformAdmin && (
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
            )}

            {isStoreOwner && (
              <div className="status-pills" style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
                <button className={`status-pill ${lkTab === "products" ? "active" : ""}`} onClick={() => setLkTab("products")}>Управление товарами</button>
                <button className={`status-pill ${lkTab === "staff" ? "active" : ""}`} onClick={() => setLkTab("staff")}>Сотрудники магазина</button>
                <button className={`status-pill ${lkTab === "settings" ? "active" : ""}`} onClick={() => setLkTab("settings")}>Настройки магазина</button>
              </div>
            )}

            {isStoreOwner ? (
              /* Store Owner View: Switchable tabs for products, staff, and settings */
              lkTab === "products" ? (
                <div className="admin-grid" style={{ gridTemplateColumns: "2.5fr 1fr" }}>
                  {/* Left Card: Products List */}
                  <div className="admin-card">
                    <h3>Мои товары</h3>
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Бренд</th>
                            <th>Модель</th>
                            <th>Цена ($)</th>
                            <th>Опт ($)</th>
                            <th>Кол-во</th>
                            <th>Статус</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myProducts.map((p) => (
                            <tr key={p.id} style={{ opacity: p.isActive ? 1 : 0.6 }}>
                              <td>#{p.id}</td>
                              <td><strong>{p.brand}</strong></td>
                              <td>{p.model}</td>
                              <td>${p.basePriceUsd}</td>
                              <td>${p.wholesalePriceUsd}</td>
                              <td>{p.stockQuantity} ед</td>
                              <td>
                                <button 
                                  onClick={() => handleToggleProductActive(p)}
                                  style={{ 
                                    fontSize: "0.75rem", 
                                    padding: "2px 6px", 
                                    borderRadius: "4px", 
                                    border: "none", 
                                    cursor: "pointer",
                                    backgroundColor: p.isActive ? "var(--success)" : "var(--border)",
                                    color: "#fff"
                                  }}
                                >
                                  {p.isActive ? "Активен" : "Скрыт"}
                                </button>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button 
                                    className="qty-btn" 
                                    style={{ width: "auto", padding: "0 6px", fontSize: "0.75rem" }} 
                                    onClick={() => handleEditClick(p)}
                                  >
                                    Ред.
                                  </button>
                                  <button 
                                    className="qty-btn" 
                                    style={{ width: "auto", padding: "0 6px", fontSize: "0.75rem", color: "var(--danger)", borderColor: "var(--danger)" }} 
                                    onClick={() => handleDeleteProduct(p.id)}
                                  >
                                    Удал.
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {myProducts.length === 0 && (
                            <tr>
                              <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                                Нет добавленных товаров.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Card: Add/Edit Form */}
                  <div className="admin-card" style={{ marginBottom: 0 }}>
                    <h3>{editingProduct ? "Редактировать товар" : "Добавить новый товар"}</h3>
                    <form onSubmit={handleAddProduct}>
                      <div className="form-group">
                        <label htmlFor="prod-brand">Бренд</label>
                        <select id="prod-brand" className="form-input" value={newBrand} onChange={(e) => setNewBrand(e.target.value as any)}>
                          <option value="Apple">Apple</option>
                          <option value="Samsung">Samsung</option>
                          <option value="Xiaomi">Xiaomi</option>
                          <option value="Feature Phones">Кнопочные</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="prod-model">Модель</label>
                        <input type="text" id="prod-model" className="form-input" placeholder="Galaxy S26 Ultra 512GB" value={newModel} onChange={(e) => setNewModel(e.target.value)} required />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div className="form-group">
                          <label htmlFor="prod-price">Цена розн. ($)</label>
                          <input type="number" id="prod-price" className="form-input" placeholder="1350" value={newBasePrice} onChange={(e) => setNewBasePrice(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label htmlFor="prod-wholesale">Цена опт ($)</label>
                          <input type="number" id="prod-wholesale" className="form-input" placeholder="1250" value={newWholesalePrice} onChange={(e) => setNewWholesalePrice(e.target.value)} required />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div className="form-group">
                          <label htmlFor="prod-qty">Количество</label>
                          <input type="number" id="prod-qty" className="form-input" placeholder="5" value={newStockQty} onChange={(e) => setNewStockQty(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label htmlFor="prod-tag">Состояние</label>
                          <select id="prod-tag" className="form-input" value={newStatusTag} onChange={(e) => setNewStatusTag(e.target.value as any)}>
                            <option value="all">Без тега</option>
                            <option value="new">Новое</option>
                            <option value="imported">Б/У</option>
                            <option value="promo">Промо</option>
                          </select>
                        </div>
                      </div>

                      {newBrand === "Apple" && newStatusTag === "imported" && (
                        <div className="form-group">
                          <label htmlFor="prod-battery">Емкость АКБ (%)</label>
                          <input type="number" id="prod-battery" className="form-input" min="0" max="100" placeholder="85" value={newBatteryCapacity} onChange={(e) => setNewBatteryCapacity(e.target.value)} />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Фотографии товара (первая фото будет обложкой)</label>
                        
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem", minHeight: mediaItems.length ? "auto" : "50px", padding: "8px", border: "1px dashed var(--border)", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)" }}>
                          {mediaItems.map((item, idx) => (
                            <div key={item.id} className="media-preview-container" style={{ position: "relative", width: "80px", height: "80px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
                              {item.url.startsWith("http") || item.url.startsWith("/") || item.url.startsWith("data:") ? (
                                <img src={item.url} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "#333", fontWeight: "bold", textTransform: "uppercase" }}>{item.url}</span>
                              )}
                              
                              <div className="media-controls-overlay" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "4px", opacity: 0, transition: "opacity 0.2s" }}>
                                <button type="button" onClick={() => handleRotateMedia(item.id)} style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", backgroundColor: "rgba(255,255,255,0.9)", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }} title="Повернуть 90°">
                                  ↻
                                </button>
                                {idx > 0 && (
                                  <button type="button" onClick={() => handleMoveMedia(idx, "left")} style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", backgroundColor: "rgba(255,255,255,0.9)", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }} title="Влево">
                                    ←
                                  </button>
                                )}
                                {idx < mediaItems.length - 1 && (
                                  <button type="button" onClick={() => handleMoveMedia(idx, "right")} style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", backgroundColor: "rgba(255,255,255,0.9)", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }} title="Вправо">
                                    →
                                  </button>
                                )}
                                <button type="button" onClick={() => handleDeleteMedia(item.id)} style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", backgroundColor: "var(--danger)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }} title="Удалить">
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          <label style={{ width: "80px", height: "80px", border: "2px dashed var(--border)", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", fontSize: "1.5rem" }} title="Добавить фото">
                            +
                            <span style={{ fontSize: "0.55rem", marginTop: "2px" }}>Выбрать</span>
                            <input type="file" multiple accept="image/*" onChange={handleFilesChange} style={{ display: "none" }} />
                          </label>
                        </div>

                        <style dangerouslySetInnerHTML={{__html: `
                          .media-preview-container:hover .media-controls-overlay {
                            opacity: 1 !important;
                          }
                        `}} />

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input type="text" className="form-input" style={{ flex: 1 }} placeholder="Вставить URL или алиас (apple, samsung...)" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                          <button type="button" className="qty-btn" style={{ width: "auto", padding: "0 12px" }} onClick={() => {
                            if (urlInput.trim()) {
                              handleAddUrlMedia(urlInput);
                              setUrlInput("");
                            }
                          }}>Добавить</button>
                        </div>
                      </div>

                      <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "1rem 0" }}>
                        <input type="checkbox" id="prod-active" checked={newIsActive} onChange={(e) => setNewIsActive(e.target.checked)} style={{ cursor: "pointer", width: "16px", height: "16px" }} />
                        <label htmlFor="prod-active" style={{ cursor: "pointer", marginBottom: 0 }}>Показывать товар на сайте</label>
                      </div>

                      <div className="form-group">
                        <label htmlFor="prod-desc">Описание</label>
                        <textarea id="prod-desc" className="form-input" style={{ minHeight: "60px", resize: "vertical", fontFamily: "inherit" }} placeholder="Краткое описание товара..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required />
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {editingProduct && (
                          <button type="button" className="btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" }} onClick={handleCancelEdit}>
                            Отмена
                          </button>
                        )}
                        <button type="submit" className="btn-submit" disabled={isSubmittingProduct} style={{ flex: 2, marginTop: 0 }}>
                          {isSubmittingProduct ? "Сохранение..." : (editingProduct ? "Сохранить" : "Добавить товар")}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : lkTab === "staff" ? (
                <div className="admin-grid" style={{ gridTemplateColumns: "2.5fr 1fr" }}>
                  {/* Left Card: Staff List */}
                  <div className="admin-card">
                    <h3>Штат сотрудников</h3>
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Юзернейм Telegram</th>
                            <th>Телефон</th>
                            <th>Индекс сотрудника</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myStaff.map((s) => (
                            <tr key={s.id}>
                              <td>#{s.id}</td>
                              <td><strong>{s.name}</strong></td>
                              <td>@{s.username}</td>
                              <td>{s.phone || "Не указан"}</td>
                              <td><code style={{ backgroundColor: "var(--accent)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem" }}>{s.userIndex}</code></td>
                              <td>
                                <button 
                                  className="qty-btn" 
                                  style={{ width: "auto", padding: "0 8px", fontSize: "0.75rem", color: "var(--danger)", borderColor: "var(--danger)" }} 
                                  onClick={() => handleDeleteStaff(s.id)}
                                >
                                  Уволить
                                </button>
                              </td>
                            </tr>
                          ))}
                          {myStaff.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                                Нет добавленных сотрудников.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Card: Add Staff Form */}
                  <div className="admin-card" style={{ marginBottom: 0 }}>
                    <h3>Добавить сотрудника</h3>
                    <form onSubmit={handleAddStaff}>
                      <div className="form-group">
                        <label htmlFor="staff-name">Имя сотрудника</label>
                        <input type="text" id="staff-name" className="form-input" placeholder="Иван Петров" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
                      </div>

                      <div className="form-group">
                        <label htmlFor="staff-user">Username Telegram (без @)</label>
                        <input type="text" id="staff-user" className="form-input" placeholder="ivan_tg" value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)} required />
                      </div>

                      <div className="form-group">
                        <label htmlFor="staff-phone">Номер телефона (необязательно)</label>
                        <input type="text" id="staff-phone" className="form-input" placeholder="+996555123456" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} />
                      </div>

                      <button type="submit" className="btn-submit" disabled={isSubmittingStaff} style={{ marginTop: "1rem" }}>
                        {isSubmittingStaff ? "Добавление..." : "Добавить сотрудника"}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* lkTab === "settings" */
                <div className="admin-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="admin-card" style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
                    <h3>Настройки профиля магазина</h3>
                    <form onSubmit={handleUpdateProfile}>
                      <div className="form-group">
                        <label htmlFor="settings-name">Название магазина</label>
                        <input type="text" id="settings-name" className="form-input" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="settings-username">Юзернейм Telegram (без @)</label>
                        <input type="text" id="settings-username" className="form-input" value={settingsUsername} onChange={(e) => setSettingsUsername(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="settings-phone">Контактный телефон</label>
                        <input type="text" id="settings-phone" className="form-input" value={settingsPhone} onChange={(e) => setSettingsPhone(e.target.value)} placeholder="+996XXXXXXXXX" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="settings-email">Email адрес</label>
                        <input type="email" id="settings-email" className="form-input" value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} placeholder="mail@example.com" />
                      </div>
                      <button type="submit" className="btn-submit" disabled={isSubmittingSettings} style={{ marginTop: "1rem" }}>
                        {isSubmittingSettings ? "Сохранение..." : "Сохранить изменения"}
                      </button>
                    </form>
                  </div>
                </div>
              )
            ) : (
              /* Platform Admin View: Split grid with orders, settings, and product form */
              <>
                <div className="admin-grid">
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
                            <th>Тип заказа</th>
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
                                  {o.user?.username ? `@${o.user.username}` : ""} | {o.user?.phone || ""}
                                </div>
                              </td>
                              <td>{o.items || "Заказ устройства"}</td>
                              <td>${o.totalUsd.toLocaleString()}</td>
                              <td>
                                <span className={`status-badge badge-${o.status}`}>{o.status}</span>
                              </td>
                              <td>
                                <span className={`status-badge ${o.deliveryType === "pre-order" ? "badge-processing" : "badge-completed"}`}>{o.deliveryType}</span>
                              </td>
                              <td>{o.createdAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Settings & Add Product Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Form editing settings */}
                    <div className="admin-card" style={{ marginBottom: 0 }}>
                      <h3>{dict.adminSettings}</h3>
                      <div className="form-group">
                        <label htmlFor="admin-rate">{dict.adminExchangeRate}</label>
                        <input type="number" id="admin-rate" className="form-input" step="0.1" value={adminRate} onChange={(e) => setAdminRate(parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="admin-dubai">{dict.adminDubaiCost}</label>
                        <input type="number" id="admin-dubai" className="form-input" value={adminDubai} onChange={(e) => setAdminDubai(parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="admin-korea">{dict.adminKoreaCost}</label>
                        <input type="number" id="admin-korea" className="form-input" value={adminKorea} onChange={(e) => setAdminKorea(parseFloat(e.target.value) || 0)} />
                      </div>
                      <button className="btn-submit" onClick={() => store.saveSettings(adminRate, adminDubai, adminKorea)}>Сохранить</button>
                    </div>

                    {/* Form adding new product */}
                    <div className="admin-card" style={{ marginBottom: 0 }}>
                      <h3>Добавить новый товар</h3>
                      <form onSubmit={handleAddProduct}>
                        <div className="form-group">
                          <label htmlFor="prod-brand-admin">Бренд</label>
                          <select id="prod-brand-admin" className="form-input" value={newBrand} onChange={(e) => setNewBrand(e.target.value as any)}>
                            <option value="Apple">Apple</option>
                            <option value="Samsung">Samsung</option>
                            <option value="Xiaomi">Xiaomi</option>
                            <option value="Feature Phones">Кнопочные</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="prod-model-admin">Модель</label>
                          <input type="text" id="prod-model-admin" className="form-input" placeholder="Galaxy S26 Ultra 512GB" value={newModel} onChange={(e) => setNewModel(e.target.value)} required />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                          <div className="form-group">
                            <label htmlFor="prod-price-admin">Цена розн. ($)</label>
                            <input type="number" id="prod-price-admin" className="form-input" placeholder="1350" value={newBasePrice} onChange={(e) => setNewBasePrice(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label htmlFor="prod-wholesale-admin">Цена опт ($)</label>
                            <input type="number" id="prod-wholesale-admin" className="form-input" placeholder="1250" value={newWholesalePrice} onChange={(e) => setNewWholesalePrice(e.target.value)} required />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                          <div className="form-group">
                            <label htmlFor="prod-qty-admin">Количество</label>
                            <input type="number" id="prod-qty-admin" className="form-input" placeholder="5" value={newStockQty} onChange={(e) => setNewStockQty(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label htmlFor="prod-tag-admin">Состояние</label>
                            <select id="prod-tag-admin" className="form-input" value={newStatusTag} onChange={(e) => setNewStatusTag(e.target.value as any)}>
                              <option value="all">Без тега</option>
                              <option value="new">Новое</option>
                              <option value="imported">Б/У</option>
                              <option value="promo">Промо</option>
                            </select>
                          </div>
                        </div>

                        {newBrand === "Apple" && newStatusTag === "imported" && (
                          <div className="form-group">
                            <label htmlFor="prod-battery-admin">Емкость АКБ (%)</label>
                            <input type="number" id="prod-battery-admin" className="form-input" min="0" max="100" placeholder="85" value={newBatteryCapacity} onChange={(e) => setNewBatteryCapacity(e.target.value)} />
                          </div>
                        )}

                        <div className="form-group">
                          <label>Фотографии товара (первая фото будет обложкой)</label>
                          
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem", minHeight: mediaItems.length ? "auto" : "50px", padding: "8px", border: "1px dashed var(--border)", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)" }}>
                            {mediaItems.map((item, idx) => (
                              <div key={item.id} className="media-preview-container" style={{ position: "relative", width: "80px", height: "80px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
                                {item.url.startsWith("http") || item.url.startsWith("/") || item.url.startsWith("data:") ? (
                                  <img src={item.url} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                ) : (
                                  <span style={{ fontSize: "0.75rem", color: "#333", fontWeight: "bold", textTransform: "uppercase" }}>{item.url}</span>
                                )}
                                
                                <div className="media-controls-overlay" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "4px", opacity: 0, transition: "opacity 0.2s" }}>
                                  <button type="button" onClick={() => handleRotateMedia(item.id)} style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", backgroundColor: "rgba(255,255,255,0.9)", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }} title="Повернуть 90°">
                                    ↻
                                  </button>
                                  {idx > 0 && (
                                    <button type="button" onClick={() => handleMoveMedia(idx, "left")} style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", backgroundColor: "rgba(255,255,255,0.9)", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }} title="Влево">
                                      ←
                                    </button>
                                  )}
                                  {idx < mediaItems.length - 1 && (
                                    <button type="button" onClick={() => handleMoveMedia(idx, "right")} style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", backgroundColor: "rgba(255,255,255,0.9)", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }} title="Вправо">
                                      →
                                    </button>
                                  )}
                                  <button type="button" onClick={() => handleDeleteMedia(item.id)} style={{ width: "24px", height: "24px", borderRadius: "4px", border: "none", backgroundColor: "var(--danger)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }} title="Удалить">
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                            
                            <label style={{ width: "80px", height: "80px", border: "2px dashed var(--border)", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", fontSize: "1.5rem" }} title="Добавить фото">
                              +
                              <span style={{ fontSize: "0.55rem", marginTop: "2px" }}>Выбрать</span>
                              <input type="file" multiple accept="image/*" onChange={handleFilesChange} style={{ display: "none" }} />
                            </label>
                          </div>

                          <style dangerouslySetInnerHTML={{__html: `
                            .media-preview-container:hover .media-controls-overlay {
                              opacity: 1 !important;
                            }
                          `}} />

                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input type="text" className="form-input" style={{ flex: 1 }} placeholder="Вставить URL или алиас (apple, samsung...)" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                            <button type="button" className="qty-btn" style={{ width: "auto", padding: "0 12px" }} onClick={() => {
                              if (urlInput.trim()) {
                                handleAddUrlMedia(urlInput);
                                setUrlInput("");
                              }
                            }}>Добавить</button>
                          </div>
                        </div>

                        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "1rem 0" }}>
                          <input type="checkbox" id="prod-active-admin" checked={newIsActive} onChange={(e) => setNewIsActive(e.target.checked)} style={{ cursor: "pointer", width: "16px", height: "16px" }} />
                          <label htmlFor="prod-active-admin" style={{ cursor: "pointer", marginBottom: 0 }}>Показывать товар на сайте</label>
                        </div>

                        <div className="form-group">
                          <label htmlFor="prod-desc-admin">Описание</label>
                          <textarea id="prod-desc-admin" className="form-input" style={{ minHeight: "60px", resize: "vertical", fontFamily: "inherit" }} placeholder="Краткое описание товара..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required />
                        </div>

                        <button type="submit" className="btn-submit" disabled={isSubmittingProduct} style={{ marginTop: "1rem" }}>
                          {isSubmittingProduct ? "Сохранение..." : "Добавить товар"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Telegram console log messages */}
                <div className="admin-card" style={{ marginTop: "1.5rem" }}>
                  <h3>{dict.adminTgLogs}</h3>
                  <div className="tg-log-console">
                    {store.tgLogs.map(log => (
                      <div className="tg-log-line" key={log.id}>
                        <div style={{ color: "#6c707e", marginBottom: "2px" }}>[{log.timestamp}] Hitting API hook dispatch:</div>
                        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)" }}>{log.payload}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      )}

      {/* Cart sliding drawer */}
      <div className={`drawer ${store.isCartOpen ? "open" : ""}`} id="cart-drawer">
        <div className="drawer-header">
          <h2>{dict.cartTitle}</h2>
          <span className="drawer-close" onClick={() => store.setCartOpen(false)}>&times;</span>
        </div>
        <div className="drawer-content">
          {store.cart.length === 0 ? (
            <div className="cart-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <p>{dict.cartEmpty}</p>
            </div>
          ) : (
            store.cart.map(item => {
              const itemPrice = isWholesale ? item.product.wholesalePriceUsd : item.product.basePriceUsd;
              return (
                <div className="cart-item" key={item.product.id}>
                  <div className="cart-item-img" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {item.product.imageUrl.startsWith("/") ? (
                      <img 
                        src={item.product.imageUrl.split(",")[0]} 
                        alt={item.product.model} 
                        style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px" }}
                      />
                    ) : (
                      svgIcons[item.product.imageUrl.split(",")[0]] || svgIcons.apple
                    )}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-title">{item.product.model}</div>
                    <div className="cart-item-specs">{item.product.brand} | {item.product.description.substring(0, 30)}...</div>
                    <div className="cart-item-price">{renderPrice(itemPrice)}</div>
                    <div className="cart-item-controls">
                      <button className="qty-btn" onClick={() => store.updateCartQty(item.product.id, -1)}>-</button>
                      <span className="cart-item-qty">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => store.updateCartQty(item.product.id, 1)}>+</button>
                      <span className="cart-item-remove" onClick={() => store.removeFromCart(item.product.id)}>Удалить</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {store.cart.length > 0 && (
          <div className="drawer-footer">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 500, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                <span>Сумма USD:</span>
                <span>${store.cart.reduce((sum, item) => sum + (isWholesale ? item.product.wholesalePriceUsd : item.product.basePriceUsd) * item.quantity, 0).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.125rem" }}>
                <span>Сумма сом:</span>
                <span style={{ color: "var(--success)" }}>
                  {renderPrice(store.cart.reduce((sum, item) => sum + (isWholesale ? item.product.wholesalePriceUsd : item.product.basePriceUsd) * item.quantity, 0))}
                </span>
              </div>
            </div>
            <button className="btn-submit" style={{ marginTop: 0 }} onClick={store.checkout}>{dict.checkout}</button>
          </div>
        )}
      </div>

      {/* Auth widget modal */}
      <div className={`modal ${store.isAuthOpen ? "open" : ""}`} id="auth-modal">
        <div className="modal-header">
          <h3>Аутентификация</h3>
          <span className="drawer-close" onClick={() => {
            store.setAuthOpen(false);
            setAuthMethod(null);
            setAuthInputValue("");
          }}>&times;</span>
        </div>
        <div className="modal-content">
          <div style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", backgroundColor: "var(--background)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
            {session?.user ? (
              <div>
                <p><strong>Пользователь:</strong> {session.user.name}</p>
                <p><strong>ID Индекс:</strong> <code style={{ backgroundColor: "var(--accent)", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem" }}>{(session.user as any).userIndex}</code></p>
                <p><strong>Уровень:</strong> {((session.user as any).role || "client").toUpperCase()}</p>
                <button onClick={() => {
                  store.logout();
                  setAuthMethod(null);
                  setAuthInputValue("");
                }} style={{ color: "var(--danger)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline", marginTop: "0.5rem", display: "block" }}>
                  Выйти из профиля
                </button>
              </div>
            ) : (
              <div>Войдите, чтобы сайт определил ваш уровень доступа для показа цен и функций администрирования.</div>
            )}
          </div>
          
          {!session?.user && (
            <>
              {authMethod === "google" && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (authInputValue.trim()) {
                    store.loginGoogle(authInputValue.trim());
                  }
                }}>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="gmail-input" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      Введите ваш Gmail адрес:
                    </label>
                    <input
                      type="email"
                      id="gmail-input"
                      className="form-input"
                      placeholder="owner@gmail.com, wholesale@gmail.com, etc."
                      value={authInputValue}
                      onChange={(e) => setAuthInputValue(e.target.value)}
                      required
                      autoFocus
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", display: "block" }}>
                      Симуляция Google SSO. Роль определится из БД. Попробуйте <code>owner@gmail.com</code> или <code>wholesale@gmail.com</code>.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button type="button" className="btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" }} onClick={() => { setAuthMethod(null); setAuthInputValue(""); }}>
                      Назад
                    </button>
                    <button type="submit" className="btn-submit" style={{ flex: 1, marginTop: 0, padding: "0.5rem" }}>
                      Войти
                    </button>
                  </div>
                </form>
              )}

              {authMethod === null && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* TELEGRAM FIRST */}
                  <button 
                    className="tg-login-btn" 
                    style={{ 
                      display: "flex", alignItems: "center", justifyContent: "center", 
                      background: "#0088cc", color: "#ffffff", padding: "0.8rem", 
                      borderRadius: "8px", cursor: "pointer", fontWeight: 600, border: "none" 
                    }} 
                    onClick={() => { setAuthMethod("telegram"); }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "10px" }}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.22z"/>
                    </svg>
                    Войти через Telegram
                  </button>

                  <button className="google-login-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", padding: "0.8rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }} onClick={() => { setAuthMethod("google"); setAuthInputValue(""); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "10px" }}>
                      <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.4-2.4C17.3 1.7 14.9 1 12.24 1c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.73 0 9.54-4.03 9.54-9.71 0-.66-.08-1.3-.23-1.85a42.92 42.92 0 0 0-9.31-.155z"/>
                    </svg>
                    Войти через Google
                  </button>

                  {/* QUICK TEST LOGIN - Marketplace Platform */}
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed var(--border)" }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem", textAlign: "center" }}>БЫСТРЫЙ ВХОД (ПЛАТФОРМА):</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
                      <button onClick={() => store.loginTelegram("M4328912312")} style={{ fontSize: "0.65rem", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", cursor: "pointer" }}>Магазин (M)</button>
                      <button onClick={() => store.loginTelegram("O775123456")} style={{ fontSize: "0.65rem", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", cursor: "pointer" }}>Оптовик (O)</button>
                      <button onClick={() => store.loginTelegram("C995506066")} style={{ fontSize: "0.65rem", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", cursor: "pointer" }}>Клиент (C)</button>
                    </div>
                  </div>
                </div>
              )}

              {authMethod === "telegram" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <style>{`
                    @keyframes pulse {
                      0%, 100% { opacity: 1; transform: scale(1); }
                      50% { opacity: 0.6; transform: scale(0.98); }
                    }
                    .tg-pulse-loader {
                      animation: pulse 1.5s infinite ease-in-out;
                    }
                  `}</style>
                  
                  <div style={{ background: "rgba(0, 136, 204, 0.08)", border: "1px solid rgba(0, 136, 204, 0.2)", borderRadius: "8px", padding: "1rem", color: "var(--text-primary)" }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", color: "#0088cc", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.95rem" }}>
                      Войти через Telegram-бота
                    </h4>
                    <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.8rem", lineHeight: "1.5", color: "var(--text-secondary)" }}>
                      <li>Нажмите синюю кнопку <b>«Открыть Telegram»</b> ниже</li>
                      <li>В чате с ботом нажмите <b>«Запустить»</b> (или кнопку <b>Start</b>)</li>
                      <li>После этого страница автоматически обновится</li>
                    </ol>
                  </div>

                  {tgAuthSessionCode ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
                      <a 
                        href={`https://t.me/MobilnikKGBot?start=${tgAuthSessionCode}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="tg-login-btn" 
                        style={{ 
                          display: "flex", alignItems: "center", justifyContent: "center", 
                          background: "#0088cc", color: "#ffffff", padding: "0.85rem 1.5rem", 
                          borderRadius: "8px", cursor: "pointer", fontWeight: 600, border: "none",
                          textDecoration: "none", width: "100%", textAlign: "center",
                          boxShadow: "0 4px 12px rgba(0,136,204,0.3)", transition: "all 0.2s"
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "10px" }}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.22z"/>
                        </svg>
                        Открыть Telegram
                      </a>

                      <div className="tg-pulse-loader" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#0088cc" }}></span>
                        Ожидаем подтверждения в боте...
                      </div>

                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", background: "var(--background-soft)", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)" }}>
                        Сессия: <code>{tgAuthSessionCode}</code>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      Генерация ссылки авторизации...
                    </div>
                  )}

                  {/* SIMULATION FOR TESTING AND LOCAL DEV */}
                  <details style={{ borderTop: "1px dashed var(--border)", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
                    <summary style={{ cursor: "pointer", fontSize: "0.75rem", color: "var(--text-muted)", userSelect: "none" }}>
                      🛠️ Альтернативный вход (Симуляция)
                    </summary>
                    <div style={{ paddingTop: "0.75rem" }}>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (authInputValue.trim()) {
                          store.loginTelegram(authInputValue.trim());
                        }
                      }}>
                        <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                          <label htmlFor="telegram-input" style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            ID, Username или Индекс:
                          </label>
                          <input
                            type="text"
                            id="telegram-input"
                            className="form-input"
                            placeholder="super_admin, C995506066, M4328912312"
                            value={authInputValue}
                            onChange={(e) => setAuthInputValue(e.target.value)}
                            required
                            style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button type="submit" className="btn-submit" style={{ flex: 1, marginTop: 0, padding: "0.4rem", fontSize: "0.8rem" }}>
                            Войти (симуляция)
                          </button>
                        </div>
                      </form>
                    </div>
                  </details>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button type="button" className="btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" }} onClick={() => { setAuthMethod(null); setAuthInputValue(""); }}>
                      Назад
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Database Explorer Modal */}
      {isDbExplorerOpen && isPlatformAdmin && (
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
              onClick={() => setIsDbExplorerOpen(false)}
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
                  /* TAB 1: BROWSE GRID */
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {dbCurrentTable ? (
                      <>
                        {/* Table Controls */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Показано: <b>{dbTableRows.length}</b> записей в таблице <code>{dbCurrentTable}</code>.
                            <span style={{ marginLeft: "10px", color: "var(--success)" }}>💡 Кликните по ячейке для редактирования.</span>
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

                        {/* Grid */}
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
                                      {col.type && <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "4px" }}>({col.type})</span>}
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
                                    {/* Action column (Delete) */}
                                    <td style={{ padding: "0.4rem", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                                      <button 
                                        onClick={() => handleRowDelete(row)}
                                        style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.9rem" }}
                                        title="Удалить строку"
                                      >
                                        &times;
                                      </button>
                                    </td>
                                    {/* Data columns */}
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
                                              className="form-input"
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
                  /* TAB 2: SQL TERMINAL */
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", overflow: "hidden" }}>
                    
                    {/* Input Console */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Введите SQL запрос:</span>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <button
                            onClick={() => setDbSqlQuery("SELECT * FROM users LIMIT 100;")}
                            style={{ fontSize: "0.7rem", padding: "2px 6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-secondary)", cursor: "pointer" }}
                          >
                            SELECT users
                          </button>
                          <button
                            onClick={() => setDbSqlQuery("SELECT * FROM products LIMIT 100;")}
                            style={{ fontSize: "0.7rem", padding: "2px 6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-secondary)", cursor: "pointer" }}
                          >
                            SELECT products
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={dbSqlQuery}
                        onChange={(e) => setDbSqlQuery(e.target.value)}
                        placeholder="SELECT * FROM users WHERE role = 'client';"
                        style={{
                          width: "100%",
                          height: "90px",
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          padding: "0.5rem",
                          background: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          color: "#e6c274", // Soft yellow code editor text
                          resize: "none"
                        }}
                      />

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => executeSqlQuery()}
                          disabled={dbIsLoading || !dbSqlQuery.trim()}
                          className="btn-submit"
                          style={{
                            marginTop: 0,
                            padding: "0.45rem 1.25rem",
                            fontSize: "0.8rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          {dbIsLoading ? "Выполнение..." : "⚡ Выполнить запрос"}
                        </button>
                      </div>
                    </div>

                    {/* Results Container */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid var(--border)", borderRadius: "6px" }}>
                      <div style={{ background: "rgba(0,0,0,0.1)", borderBottom: "1px solid var(--border)", padding: "0.35rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Результат выполнения:
                      </div>
                      <div style={{ flex: 1, overflow: "auto", padding: "0.5rem" }}>
                        {dbSqlResult ? (
                          Array.isArray(dbSqlResult) ? (
                            /* If return is row array, show table */
                            dbSqlResult.length === 0 ? (
                              <div style={{ padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                                Запрос успешно выполнен. Вернулось 0 строк.
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
                                          {row[key] === null ? <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>null</span> : String(row[key])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )
                          ) : (
                            /* If return is raw JSON metadata object */
                            <pre style={{ margin: 0, padding: "0.5rem", fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)", overflow: "auto" }}>
                              {JSON.stringify(dbSqlResult, null, 2)}
                            </pre>
                          )
                        ) : (
                          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            Введите SQL запрос и нажмите кнопку "Выполнить", чтобы увидеть результаты.
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
      )}
    </div>
  );
}

function matchedBuyerPhone(user: any): string {
  if (!user) return "Нет телефона";
  return user.email && user.email.startsWith("+") ? user.email : "Нет телефона";
}
