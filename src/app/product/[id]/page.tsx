"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore, Product } from "@/context/store-context";
import { locales } from "@/lib/locales";
import { useSession } from "next-auth/react";

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const store = useStore();
  const { data: session } = useSession();
  const dict = locales[store.language];
  
  const [product, setProduct] = useState<Product | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  // Swipe logic
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  useEffect(() => {
    if (store.products.length > 0) {
      const found = store.products.find((p) => p.id === Number(id));
      if (found) setProduct(found);
    }
  }, [id, store.products]);

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

  if (!product) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Загрузка товара...</p>
      </div>
    );
  }

  const images = product.imageUrl.split(",");
  const isWholesale = session?.user && (((session.user as any).role === "wholesale") || ((session.user as any).role === "owner"));
  const priceUSD = isWholesale ? product.wholesalePriceUsd : product.basePriceUsd;

  const renderPrice = (usd: number) => {
    if (store.currency === "KGS") return `${Math.round(usd * store.exchangeRate).toLocaleString("ru-RU")} сом`;
    return `$${usd.toLocaleString("en-US")}`;
  };

  const nextImg = () => setCurrentImgIndex((prev) => (prev + 1) % images.length);
  const prevImg = () => setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) nextImg();
    if (isRightSwipe) prevImg();
  };

  return (
    <div className="app-layout">
      {/* Shared Header */}
      <header className="header" style={{ position: "sticky", top: 0, zIndex: 1000, background: "var(--header-bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="container header-container">
          <a href="/" className="logo" onClick={(e) => { e.preventDefault(); router.push("/"); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <span>Mobilnik.KG</span>
          </a>

          <div className="controls-group">
            <button className="icon-btn" onClick={toggleTheme}>
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>
            <div className="currency-toggle">
              <div className={`currency-btn ${store.currency === "KGS" ? "active" : ""}`} onClick={() => store.setCurrency("KGS")}>сом</div>
              <div className={`currency-btn ${store.currency === "USD" ? "active" : ""}`} onClick={() => store.setCurrency("USD")}>USD</div>
            </div>
            <button className="icon-btn" onClick={() => { router.push("/"); setTimeout(() => store.setCartOpen(true), 100); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              {store.cartCount > 0 && <span className="badge">{store.cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: "1.5rem" }}>
        <button 
          onClick={() => router.back()} 
          style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "var(--text-secondary)", background: "none", border: "none", font: "inherit" }}
        >
          &larr; Назад
        </button>

        <div className="product-details-grid">
          {/* Left: Gallery */}
          <div className="gallery-section">
            <div 
              className="main-image-container"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img src={images[currentImgIndex]} alt={product.model} className="details-img" />
              
              {images.length > 1 && (
                <>
                  <button className="nav-arrow left" onClick={prevImg}>&lsaquo;</button>
                  <button className="nav-arrow right" onClick={nextImg}>&rsaquo;</button>
                </>
              )}
            </div>
            <div className="thumbnails-row">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`thumb-item ${idx === currentImgIndex ? "active" : ""}`}
                  onClick={() => setCurrentImgIndex(idx)}
                >
                  <img src={img} alt="thumbnail" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Content */}
          <div className="info-section">
            <div className="brand-tag">{product.brand}</div>
            <h1 className="product-name">{product.model}</h1>
            
            <div className="price-block">
              <div className="main-price">{renderPrice(priceUSD)}</div>
              <div className="alt-price">
                {store.currency === "USD" ? `≈ ${Math.round(priceUSD * store.exchangeRate).toLocaleString()} сом` : `≈ $${priceUSD.toLocaleString()}`}
              </div>
            </div>

            <div className="specs-card">
              <h3>Характеристики</h3>
              <div className="spec-row">
                <span>Состояние</span>
                <strong>{product.statusTag === "new" ? "Новое" : "Б/У"}</strong>
              </div>
              <div className="spec-row">
                <span>Наличие</span>
                <strong>{product.stockQuantity} ед.</strong>
              </div>
              <p className="description">{product.description}</p>
            </div>

            <button className="buy-btn" onClick={() => store.addToCart(product.id)}>
              {dict.addToCart}
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .product-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
        }
        .main-image-container {
          background: #fff;
          border-radius: 12px;
          height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          padding: 1.5rem;
          overflow: hidden;
        }
        .details-img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
        }
        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.05);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .nav-arrow:hover { background: rgba(0,0,0,0.1); }
        .nav-arrow.left { left: 1rem; }
        .nav-arrow.right { right: 1rem; }

        .thumbnails-row {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }
        .thumb-item {
          width: 70px;
          height: 70px;
          background: #fff;
          border-radius: 8px;
          padding: 5px;
          cursor: pointer;
          border: 2px solid transparent;
          flex-shrink: 0;
        }
        .thumb-item.active { border-color: var(--accent); }
        .thumb-item img { width: 100%; height: 100%; object-fit: contain; }

        .brand-tag { color: var(--text-muted); text-transform: uppercase; font-weight: 700; font-size: 0.8rem; }
        .product-name { font-size: 2rem; font-weight: 800; margin: 0.5rem 0 1.5rem; }
        .price-block { margin-bottom: 2rem; }
        .main-price { font-size: 2rem; font-weight: 700; color: var(--success); }
        .alt-price { color: var(--text-muted); font-size: 1rem; }

        .specs-card {
          background: var(--card);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          margin-bottom: 2rem;
        }
        .spec-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
        }
        .description { margin-top: 1rem; color: var(--text-secondary); line-height: 1.5; }

        .buy-btn {
          width: 100%;
          padding: 1rem;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .product-details-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .main-image-container { height: 350px; }
          .product-name { font-size: 1.5rem; }
          .nav-arrow { width: 44px; height: 44px; background: rgba(255,255,255,0.8); box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        }
      `}</style>
    </div>
  );
}
