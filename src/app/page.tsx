"use client";

import React, { useState, useEffect } from "react";
import { useStore, Product } from "@/context/store-context";
import { locales } from "@/lib/locales";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { DatabaseExplorer } from "@/components/DatabaseExplorer";
import { AuthWidget } from "@/components/AuthWidget";
import { SellerDashboard } from "@/components/SellerDashboard";
import { PreorderCalculator } from "@/components/PreorderCalculator";
import { PlatformAdminDashboard } from "@/components/PlatformAdminDashboard";
import { ClientDashboard } from "@/components/ClientDashboard";

// --- SVG Icons Map for Device Rendering ---
const svgIcons: Record<string, React.ReactNode> = {
  apple: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <path d="M12 20.94c1.88 0 3.85-.73 5.05-2.13-1.12-1.28-2.65-1.99-4.32-1.99-1.67 0-3.2.71-4.32 1.99 1.2 1.4 3.17 2.13 5.05 2.13z"></path>
      <circle cx="12" cy="11" r="4"></circle>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  ),
  samsung: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <path d="M12 18h.01"></path>
      <rect x="8" y="5" width="8" height="10" rx="1" fill="currentColor" opacity="0.1"></rect>
    </svg>
  ),
  xiaomi: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.1"></circle>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  ),
  feature: (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <rect x="6" y="2" width="12" height="20" rx="2" ry="2"></rect>
      <rect x="8" y="4" width="8" height="6" rx="1"></rect>
      <circle cx="10" cy="13" r="1" fill="currentColor"></circle>
      <circle cx="12" cy="13" r="1" fill="currentColor"></circle>
      <circle cx="14" cy="13" r="1" fill="currentColor"></circle>
      <circle cx="10" cy="15" r="1" fill="currentColor"></circle>
      <circle cx="12" cy="15" r="1" fill="currentColor"></circle>
      <circle cx="14" cy="15" r="1" fill="currentColor"></circle>
      <circle cx="10" cy="17" r="1" fill="currentColor"></circle>
      <circle cx="12" cy="17" r="1" fill="currentColor"></circle>
      <circle cx="14" cy="17" r="1" fill="currentColor"></circle>
    </svg>
  )
};

export default function Storefront() {
  const { data: session } = useSession();
  const store = useStore();
  const dict = locales[store.language];

  const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);

  const isWholesale = session?.user && (
    ((session.user as any).role === "wholesale") || 
    ((session.user as any).role === "owner")
  );

  const role = session?.user ? (session.user as any).role : null;
  const isStoreOwner = role === "store_owner";
  const isPlatformAdmin = role === "owner" || role === "admin";

  const renderPrice = (usdVal: number) => {
    if (store.currency === "KGS") {
      return `${Math.round(usdVal * store.exchangeRate).toLocaleString("ru-RU")} сом`;
    }
    return `$${usdVal.toLocaleString("en-US")}`;
  };

  const renderAltPrice = (usdVal: number) => {
    if (store.currency === "KGS") return `$${usdVal.toLocaleString("en-US")}`;
    return `${Math.round(usdVal * store.exchangeRate).toLocaleString("ru-RU")} сом`;
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {(store.isCartOpen || store.isAuthOpen || isDbExplorerOpen) && (
        <div className="overlay open" onClick={() => {
          store.setCartOpen(false);
          store.setAuthOpen(false);
          setIsDbExplorerOpen(false);
        }}></div>
      )}

      <header>
        <div className="container header-container">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); store.setSection("instock"); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <span>Mobilnik.KG</span>
          </a>

          <div className="section-tabs">
            <div className={`section-tab ${store.section === "instock" ? "active" : ""}`} onClick={() => store.setSection("instock")}>
              {dict.navInStock}
            </div>
            <div className={`section-tab ${store.section === "preorder" ? "active" : ""}`} onClick={() => store.setSection("preorder")}>
              {dict.navPreOrder}
            </div>
            {session?.user && (isPlatformAdmin || isStoreOwner || role === "client" || role === "wholesale") && (
              <div className={`section-tab ${store.section === "admin" ? "active" : ""}`} style={{ backgroundColor: "var(--danger)", color: "#fff" }} onClick={() => store.setSection("admin")}>
                {isStoreOwner ? "ЛК Магазина" : (isPlatformAdmin ? "Админка" : "Мои заказы")}
              </div>
            )}
          </div>

          <div className="controls-group">
            <button className="icon-btn" onClick={store.toggleTheme} title="Переключить тему">
              {store.theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>

            <div className="currency-toggle">
              <div className={`currency-btn ${store.currency === "USD" ? "active" : ""}`} onClick={() => store.setCurrency("USD")}>USD</div>
              <div className={`currency-btn ${store.currency === "KGS" ? "active" : ""}`} onClick={() => store.setCurrency("KGS")}>сом</div>
            </div>

            <button className="icon-btn" onClick={() => store.setCartOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              {store.cartCount > 0 && <span className="badge">{store.cartCount}</span>}
            </button>

            <div className="user-badge" onClick={() => store.setAuthOpen(true)} style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "var(--accent)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              <div className="user-avatar" style={{ width: "24px", height: "24px", fontSize: "0.75rem", background: "rgba(255,255,255,0.2)" }}>
                {session?.user?.name ? session.user.name.charAt(0) : "Г"}
              </div>
              <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{session?.user?.name || "Войти"}</span>
            </div>
          </div>
        </div>
      </header>

      {store.section === "instock" && (
        <main>
          <section className="hero">
            <div className="container">
              <div className="hero-banner">
                <div className="hero-image" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                  <div style={{ marginTop: "-2rem" }}>
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
                      <rect x="5" y="1.5" width="14" height="21" rx="2.5" ry="2.5" fill="var(--card)"></rect>
                      <path d="M12 18h.01"></path>
                      <path d="M9 3h6"></path>
                      <rect x="6.5" y="4.5" width="11" height="12" rx="1" fill="var(--background)" stroke="var(--border)" strokeWidth="0.5"></rect>
                      <circle cx="12" cy="10" r="2" stroke="var(--text-muted)" strokeWidth="0.5"></circle>
                      <line x1="8" y1="14" x2="16" y2="14" stroke="var(--text-muted)" strokeWidth="0.5"></line>
                    </svg>
                  </div>
                  <div style={{ 
                    fontSize: "1.5rem", 
                    fontWeight: 900, 
                    textTransform: "uppercase", 
                    letterSpacing: "2px",
                    color: "#ffffff",
                    fontFamily: "'JetBrains Mono', monospace",
                    textAlign: "center",
                    marginTop: "-1rem"
                  }}>
                    Abdulatif Optom
                  </div>
                </div>

                <div className="hero-content">
                  <h1 className="hero-title">В наличии и под заказ<br/>без лишних переплат.</h1>
                  <p className="hero-subtitle">Оригинальные девайсы по лучшим оптовым и розничным ценам в Бишкеке.</p>
                  <button className="hero-btn" onClick={() => store.setSection("preorder")}>Заказать из-за рубежа</button>
                </div>
              </div>
            </div>
          </section>

          <section className="brand-tabs-container">
            <div className="container">
              <div className="brand-tabs">
                {/* Dynamically show only brands that have products available, plus 'all' */}
                {(() => {
                  const availableBrands = Array.from(new Set(store.products.map(p => p.brand)));
                  const tabsToShow = ["all", "Apple", "Samsung", "Xiaomi", "Poco", "Huawei", "Honor", "Realme", "Tecno", "Infinix", "Google", "OnePlus", "Feature Phones"]
                    .filter(b => b === "all" || availableBrands.includes(b));
                  
                  return tabsToShow.map(b => (
                    <button key={b} className={`brand-tab ${store.selectedBrand === b ? "active" : ""}`} onClick={() => { store.setSelectedBrand(b); store.setSelectedStatus("all"); }}>
                      {b === "all" ? dict.brandAll : (b === "Feature Phones" ? "Другие" : b)}
                    </button>
                  ));
                })()}
              </div>
              <div className="status-pills">
                {(["all", "new", "imported", "promo"] as const).map(s => (
                  <button key={s} className={`status-pill ${store.selectedStatus === s ? "active" : ""}`} onClick={() => store.setSelectedStatus(s)}>
                    {s === "all" ? dict.statusAll : (s === "new" ? dict.statusNew : (s === "imported" ? "Б/У" : "Промо"))}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="catalog-section">
            <div className="container">
              <div className="products-grid">
                {store.products.map(p => (
                  <ProductCard key={p.id} product={p} isWholesale={!!isWholesale} dict={dict} renderPrice={renderPrice} renderAltPrice={renderAltPrice} addToCart={store.addToCart} triggerPreorderFromCatalog={(id) => { store.setSection("preorder"); }} svgIcons={svgIcons} />
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {store.section === "preorder" && (
        <PreorderCalculator dict={dict} isWholesale={!!isWholesale} renderPrice={renderPrice} />
      )}

      {store.section === "admin" && session?.user && (
        <main className="admin-section">
          <div className="container">
            <div className="admin-header-row">
              <h1>{isStoreOwner ? "Личный кабинет магазина" : (isPlatformAdmin ? "Панель управления" : "Ваши заказы")}</h1>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {isPlatformAdmin && (
                  <button className="hero-btn" style={{ background: "var(--success)", color: "#fff" }} onClick={() => setIsDbExplorerOpen(true)}>🛢️ БД</button>
                )}
                <button className="hero-btn" onClick={() => store.setSection("instock")}>Вернуться</button>
              </div>
            </div>

            {isStoreOwner ? (
              <SellerDashboard dict={dict} />
            ) : isPlatformAdmin ? (
              <PlatformAdminDashboard dict={dict} isPlatformAdmin={isPlatformAdmin} />
            ) : (
              <ClientDashboard dict={dict} />
            )}
          </div>
        </main>
      )}

      <AuthWidget isOpen={store.isAuthOpen} onClose={() => store.setAuthOpen(false)} />
      <DatabaseExplorer isOpen={isDbExplorerOpen} onClose={() => setIsDbExplorerOpen(false)} isPlatformAdmin={isPlatformAdmin} />
      
      {/* Cart Drawer */}
      <div className={`drawer ${store.isCartOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h2>{dict.cartTitle}</h2>
          <span className="drawer-close" onClick={() => store.setCartOpen(false)}>&times;</span>
        </div>
        <div className="drawer-content">
          {store.cart.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem" }}>{dict.cartEmpty}</p>
          ) : (
            store.cart.map(item => (
              <div key={item.product.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.product.model}</div>
                  <div className="cart-item-price">{renderPrice(isWholesale ? item.product.wholesalePriceUsd : item.product.basePriceUsd)}</div>
                  <div className="cart-item-controls">
                    <button onClick={() => store.updateCartQty(item.product.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => store.updateCartQty(item.product.id, 1)}>+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {store.cart.length > 0 && (
          <div className="drawer-footer">
            <button className="btn-submit" onClick={store.checkout}>{dict.checkout}</button>
          </div>
        )}
      </div>
    </div>
  );
}
