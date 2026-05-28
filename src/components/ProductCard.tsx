"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/context/store-context";

interface ProductCardProps {
  product: Product;
  isWholesale: boolean;
  dict: any;
  renderPrice: (val: number) => string;
  renderAltPrice: (val: number) => string;
  addToCart: (productId: number) => void;
  triggerPreorderFromCatalog: (productId: number) => void;
  svgIcons: Record<string, React.ReactNode>;
}

export function ProductCard({
  product,
  isWholesale,
  dict,
  renderPrice,
  renderAltPrice,
  addToCart,
  triggerPreorderFromCatalog,
  svgIcons,
}: ProductCardProps) {
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

        {images.length > 1 && (
          <>
            <button 
              className="carousel-btn-prev" 
              onClick={handlePrev}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: `translateY(-50%) ${isHovered ? 'scale(1)' : 'scale(0.9)'}`,
                background: "#ffffff",
                border: "none",
                color: "#1e1f22",
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
                boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: isHovered ? 1 : 0,
                pointerEvents: isHovered ? "auto" : "none"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button 
              className="carousel-btn-next" 
              onClick={handleNext}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: `translateY(-50%) ${isHovered ? 'scale(1)' : 'scale(0.9)'}`,
                background: "#ffffff",
                border: "none",
                color: "#1e1f22",
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
                boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: isHovered ? 1 : 0,
                pointerEvents: isHovered ? "auto" : "none"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
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
