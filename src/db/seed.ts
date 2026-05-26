import { db } from "./index";
import { users, products, systemSettings } from "./schema";

async function main() {
  console.log("🚀 Restoring full catalog with Marketplace logic...");

  // 1. Settings
  await db.insert(systemSettings).values({
    id: 1, usdToKgsRate: 90.0, dubaiShippingCostUsd: 35.0, koreaShippingCostUsd: 30.0,
  }).onConflictDoNothing();

  // 2. Clear old to avoid ID conflicts
  await db.delete(products);

  // 3. Ensure Store exists
  const storeId = 2;

  const productData = [
    {
      id: 1, ownerId: storeId, brand: "Samsung", model: "Galaxy Z Fold 7 (2025) 5G 12/256GB Black", 
      basePriceUsd: 1899, wholesalePriceUsd: 1750, stockQuantity: 2, statusTag: "new", 
      imageUrl: "/images/zfold/2026-03-31-09-37-40-img-0-77-6914-0-1-ME4Fel.webp,/images/zfold/2026-03-31-09-38-22-img-0-77-6914-0-1-KKhoF5.webp,/images/zfold/2026-03-31-09-38-23-img-0-77-6914-0-1-2GbHtH.webp", 
      description: "Latest foldable from Samsung.", isActive: true
    },
    {
      id: 2, ownerId: storeId, brand: "Apple", model: "iPhone 17 Pro 256 GB Deep Blue", 
      basePriceUsd: 1299, wholesalePriceUsd: 1199, stockQuantity: 5, statusTag: "new", 
      imageUrl: "/images/apple-iphone-17-pro-256-gb-deep-blue_1.png,/images/apple-iphone-17-pro-256-gb-deep-blue_2.jpg",
      description: "Apple's 2026 Pro model.", isActive: true
    },
    {
      id: 3, ownerId: storeId, brand: "Apple", model: "iPhone 17 Pro Max 256 GB Silver", 
      basePriceUsd: 1499, wholesalePriceUsd: 1399, stockQuantity: 4, statusTag: "new", 
      imageUrl: "/images/apple-iphone-17-pro-max-256-gb-silver_1.jpg",
      description: "Silver flagship 2026.", isActive: true
    },
    {
      id: 4, ownerId: storeId, brand: "Apple", model: "iPhone 17 Pro Max 256 GB Cosmic Orange", 
      basePriceUsd: 1499, wholesalePriceUsd: 1399, stockQuantity: 3, statusTag: "new", 
      imageUrl: "/images/iphone17promax_orange_1.jpg,/images/iphone17promax_orange_2.jpg",
      description: "Cosmic Orange titanium finish.", isActive: true
    },
    {
      id: 5, ownerId: storeId, brand: "Apple", model: "iPhone 17 256 GB Lavender", 
      basePriceUsd: 899, wholesalePriceUsd: 820, stockQuantity: 10, statusTag: "new", 
      imageUrl: "/images/apple-iphone-17-256-gb-lavender_1.jpg",
      description: "Fresh Lavender color.", isActive: true
    },
    {
      id: 6, ownerId: storeId, brand: "Xiaomi", model: "Poco M7 6/128 GB Black", 
      basePriceUsd: 220, wholesalePriceUsd: 195, stockQuantity: 15, statusTag: "promo", 
      imageUrl: "/images/poco-m7-6128-gb-black_1.png,/images/poco-m7-6128-gb-black_2.png",
      description: "Mid-range performance king.", isActive: true
    },
    {
      id: 7, ownerId: storeId, brand: "Samsung", model: "Galaxy S26 Ultra 5G 12/512GB Violet", 
      basePriceUsd: 1350, wholesalePriceUsd: 1250, stockQuantity: 4, statusTag: "new", 
      imageUrl: "/images/samsung-s948-s26-ultra-5g-12512gb-violet_1.jpg",
      description: "Ultimate zoom and AI.", isActive: true
    },
    {
      id: 8, ownerId: storeId, brand: "Samsung", model: "Galaxy Z Flip 7 (2025) 5G 12/256GB Blue", 
      basePriceUsd: 1099, wholesalePriceUsd: 999, stockQuantity: 6, statusTag: "new", 
      imageUrl: "/images/samsung-f766-z-flip-7-2025-5g-12256gb-blue_1.webp",
      description: "Stylish foldable 2025.", isActive: true
    },
    {
      id: 9, ownerId: storeId, brand: "Samsung", model: "Galaxy A36 (2025) 5G 8/256GB Green", 
      basePriceUsd: 350, wholesalePriceUsd: 310, stockQuantity: 12, statusTag: "new", 
      imageUrl: "/images/galaxya36.png",
      description: "Reliable A-series.", isActive: true
    },
    {
      id: 10, ownerId: storeId, brand: "Samsung", model: "Galaxy A36 (2025) 5G 8/256GB Black", 
      basePriceUsd: 350, wholesalePriceUsd: 310, stockQuantity: 10, statusTag: "new", 
      imageUrl: "/images/samsung-a366-a36-2025-5g-8256gb-black_1.jpg",
      description: "Classic Black A-series.", isActive: true
    },
    {
      id: 11, ownerId: storeId, brand: "Samsung", model: "Galaxy S25 12/256GB 5G Silver", 
      basePriceUsd: 799, wholesalePriceUsd: 740, stockQuantity: 8, statusTag: "new", 
      imageUrl: "/images/samsung-s931-s25-12256gb-5g-silver_1.jpg",
      description: "Compact Silver flagship.", isActive: true
    },
    {
      id: 12, ownerId: storeId, brand: "Samsung", model: "Galaxy S25 12/256GB 5G Blue", 
      basePriceUsd: 799, wholesalePriceUsd: 740, stockQuantity: 7, statusTag: "new", 
      imageUrl: "/images/samsung-s931-s25-12256gb-5g-blue_1.jpg",
      description: "Arctic Blue S25.", isActive: true
    }
  ];

  for (const p of productData) {
    await db.insert(products).values(p as any);
  }

  console.log("✅ Catalog restored with 12 products.");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
