"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore, Product } from "@/context/store-context";
import { locales } from "@/lib/locales";
import { useSession } from "next-auth/react";

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { products, language, currency, exchangeRate, addToCart } = useStore();
  const { data: session } = useSession();
  const dict = locales[language];
  
  const [product, setProduct] = useState<Product | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    if (products.length > 0) {
      const found = products.find((p) => p.id === Number(id));
      if (found) setProduct(found);
    }
  }, [id, products]);

  if (!product) {
    return (
      <div className="container" style={{ padding: "4rem text-align: center" }}>
        <p>Загрузка товара...</p>
        <button className="btn-secondary" onClick={() => router.back()} style={{ marginTop: "1rem" }}>Назад</button>
      </div>
    );
  }

  const images = product.imageUrl.split(",");
  const isWholesale = session?.user && (((session.user as any).role === "wholesale") || ((session.user as any).role === "owner"));
  const priceUSD = isWholesale ? product.wholesalePriceUsd : product.basePriceUsd;

  const renderPrice = (usd: number) => {
    if (currency === "KGS") return `${Math.round(usd * exchangeRate).toLocaleString()} сом`;
    return `$${usd.toLocaleString()}`;
  };

  return (
    <main className="container" style={{ padding: "2rem 1.5rem" }}>
      <button 
        onClick={() => router.back()} 
        style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "var(--text-secondary)" }}
      >
        &larr; {dict.navInStock}
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}>
        {/* Left: Images */}
        <div>
          <div style={{ 
            backgroundColor: "#fff", 
            borderRadius: "16px", 
            padding: "2rem", 
            height: "500px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            position: "relative"
          }}>
            <img 
              src={images[currentImgIndex]} 
              alt={product.model} 
              style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
            />
            {images.length > 1 && (
              <div style={{ position: "absolute", width: "100%", display: "flex", justifyContent: "space-between", padding: "0 1rem" }}>
                <button className="qty-btn" onClick={() => setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)}>&larr;</button>
                <button className="qty-btn" onClick={() => setCurrentImgIndex((prev) => (prev + 1) % images.length)}>&rarr;</button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
            {images.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setCurrentImgIndex(idx)}
                style={{ 
                  width: "80px", 
                  height: "80px", 
                  backgroundColor: "#fff", 
                  borderRadius: "8px", 
                  padding: "0.5rem", 
                  cursor: "pointer",
                  border: idx === currentImgIndex ? "2px solid var(--accent)" : "1px solid var(--border)",
                  flexShrink: 0
                }}
              >
                <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            {product.brand}
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0.5rem 0 1.5rem", lineHeight: 1.1 }}>
            {product.model}
          </h1>
          
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--success)" }}>
              {renderPrice(priceUSD)}
            </div>
            <div style={{ color: "var(--text-muted)" }}>
              {currency === "USD" ? `≈ ${Math.round(priceUSD * exchangeRate).toLocaleString()} сом` : `≈ $${priceUSD.toLocaleString()}`}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Характеристики</h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>Состояние</span>
                <strong>{product.statusTag === "new" ? "Новое" : "Б/У"}</strong>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>Наличие</span>
                <strong>{product.stockQuantity} ед.</strong>
              </li>
              <li style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginTop: "0.5rem" }}>
                {product.description}
              </li>
            </ul>
          </div>

          <button 
            className="btn-submit" 
            style={{ padding: "1.25rem", fontSize: "1.125rem" }}
            onClick={() => addToCart(product.id)}
          >
            {dict.addToCart}
          </button>
        </div>
      </div>
    </main>
  );
}
