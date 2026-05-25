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
    <div className="product-card" onClick={() => router.push(`/product/${product.id}`)} style={{ cursor: "pointer" }}>
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
          <li><span>Остаток:</span> <strong>{product.stockQuantity} ед</strong></li>
          <li style={{ marginTop: "4px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
            <span>{priceLabel}</span>
          </li>
        </ul>
      </div>

      {/* Stock status dot */}
      {product.stockQuantity > 3 ? (
        <div className="product-stock stock-ok"><span className="stock-dot"></span>{dict.inStock}</div>
      ) : product.stockQuantity > 0 ? (
        <div className="product-stock stock-low"><span className="stock-dot"></span>{dict.lowStock}</div>
      ) : (
        <div className="product-stock stock-out"><span className="stock-dot"></span>{dict.outOfStock}</div>
      )}

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

  const [authMethod, setAuthMethod] = useState<null | "google" | "telegram">(null);
  const [authInputValue, setAuthInputValue] = useState("");

  useEffect(() => {
    // Handle successful Telegram Auth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get("auth_success");
    const tgUsername = urlParams.get("username");

    if (authSuccess === "true" && tgUsername) {
      store.loginTelegram(tgUsername);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [store]);

  useEffect(() => {
    // Dynamically load Telegram Widget when authMethod is 'telegram'
    if (authMethod === "telegram") {
      const container = document.getElementById("telegram-login-container");
      if (container && container.innerHTML === "") {
        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        script.setAttribute("data-telegram-login", "MobilnikKGBot");
        script.setAttribute("data-size", "large");
        script.setAttribute("data-auth-url", window.location.origin + "/api/auth/telegram-callback");
        script.setAttribute("data-request-access", "write");
        container.appendChild(script);
      }
    }
  }, [authMethod]);

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
      {(store.isCartOpen || store.isAuthOpen) && (
        <div className="overlay open" onClick={() => {
          store.setCartOpen(false);
          store.setAuthOpen(false);
          setAuthMethod(null);
          setAuthInputValue("");
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
            {session?.user && ((session.user as any).role === "owner" || (session.user as any).role === "admin") && (
              <div className={`section-tab ${store.section === "admin" ? "active" : ""}`} style={{ backgroundColor: "var(--danger)", color: "#fff" }} onClick={() => store.setSection("admin")}>
                Админка
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
            <div className="user-badge" onClick={() => store.setAuthOpen(true)} style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="user-avatar" style={{ width: "24px", height: "24px", fontSize: "0.75rem" }}>
                {session?.user?.name ? session.user.name.charAt(0) : "Г"}
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{session?.user?.name ? session.user.name.split(" ")[0] : "Войти"}</span>
              {session?.user && (
                <span className={`status-badge badge-${(session?.user as any)?.role || "client"}`} style={{ marginLeft: "4px" }}>
                  {((session?.user as any)?.role || "client").toUpperCase()}
                </span>
              )}
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

      {/* Main Container View: Панель Администратора */}
      {store.section === "admin" && (
        <main className="admin-section">
          <div className="container">
            <div className="admin-header-row">
              <h1>{dict.adminTitle}</h1>
              <button className="hero-btn" style={{ backgroundColor: "var(--border)", color: "var(--text-primary)" }} onClick={() => store.setSection("instock")}>Вернуться</button>
            </div>

            {/* Quick Metrics */}
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

            {/* Settings config form and Orders log table */}
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

              {/* Form editing settings */}
              <div className="admin-card">
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
                <p><strong>Покупатель:</strong> {session.user.name}</p>
                <p><strong>Email / TG:</strong> {session.user.email}</p>
                <p><strong>Уровень доступа:</strong> {((session.user as any).role || "client").toUpperCase()}</p>
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
              {authMethod === null && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button className="google-login-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", padding: "0.75rem", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }} onClick={() => { setAuthMethod("google"); setAuthInputValue(""); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "8px" }}>
                      <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.4-2.4C17.3 1.7 14.9 1 12.24 1c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.73 0 9.54-4.03 9.54-9.71 0-.66-.08-1.3-.23-1.85a42.92 42.92 0 0 0-9.31-.155z"/>
                    </svg>
                    Войти через Google
                  </button>
                  <button className="tg-login-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#3574f0", color: "#ffffff", padding: "0.75rem", borderRadius: "6px", cursor: "pointer", fontWeight: 500, border: "none" }} onClick={() => { setAuthMethod("telegram"); setAuthInputValue(""); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "8px" }}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.22z"/>
                    </svg>
                    Войти через Telegram
                  </button>
                </div>
              )}

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

              {authMethod === "telegram" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", textAlign: "center" }}>
                    Нажмите на кнопку ниже, чтобы авторизоваться через ваш Telegram аккаунт.
                  </p>
                  
                  {/* Real Telegram Login Widget */}
                  <div id="telegram-login-container"></div>

                  <button type="button" className="btn-secondary" style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" }} onClick={() => { setAuthMethod(null); setAuthInputValue(""); }}>
                    Назад
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function matchedBuyerPhone(user: any): string {
  if (!user) return "Нет телефона";
  return user.email && user.email.startsWith("+") ? user.email : "Нет телефона";
}
