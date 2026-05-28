"use client";

import React, { useState } from "react";
import { useStore } from "@/context/store-context";

interface PreorderCalculatorProps {
  dict: any;
  isWholesale: boolean;
  renderPrice: (val: number) => string;
}

export function PreorderCalculator({ dict, isWholesale, renderPrice }: PreorderCalculatorProps) {
  const store = useStore();
  const [calcProductId, setCalcProductId] = useState<number>(store.products.length > 0 ? store.products[0].id : 0);
  const [calcQty, setCalcQty] = useState(1);
  const [calcHub, setCalcHub] = useState<"dubai" | "korea">("dubai");

  const matchedProd = store.products.find(p => p.id === calcProductId);
  const prodPriceUsd = matchedProd ? (isWholesale ? matchedProd.wholesalePriceUsd : matchedProd.basePriceUsd) : 0;
  const shipCostUsd = calcHub === "dubai" ? store.dubaiCost : store.koreaCost;
  
  const totalProdUsd = prodPriceUsd * calcQty;
  const totalShipUsd = shipCostUsd * calcQty;
  const totalUsd = totalProdUsd + totalShipUsd;

  return (
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
  );
}
