import { db } from "./index";
import { users, products, systemSettings } from "./schema";

async function main() {
  console.log("🚀 FINAL update: Only 12 new models with FULL localized high-res galleries...");
  
  try {
    await db.delete(products);
    console.log("🧹 Old products cleared.");
  } catch (e) {
    console.log("⚠️ Products table was already empty or not initialized yet.");
  }
  await db.insert(systemSettings).values({
    id: 1, usdToKgsRate: 90.0, dubaiShippingCostUsd: 35.0, koreaShippingCostUsd: 30.0,
  }).onConflictDoUpdate({ target: systemSettings.id, set: { usdToKgsRate: 90.0 } });

  // 2. Exact 12 Models from RTF list with their NEW localized galleries
  const productData = [
    {
      id: 1, brand: "Samsung", model: "Galaxy Z Fold 7 (2025) 5G 12/256GB Black", 
      basePriceUsd: 1899, wholesalePriceUsd: 1750, stockQuantity: 2, statusTag: "new", 
      imageUrl: "/images/zfold/2026-03-31-09-37-40-img-0-77-6914-0-1-ME4Fel.webp,/images/zfold/2026-03-31-09-38-22-img-0-77-6914-0-1-KKhoF5.webp,/images/zfold/2026-03-31-09-38-23-img-0-77-6914-0-1-2GbHtH.webp,/images/zfold/2026-03-31-09-38-23-img-0-77-6914-0-1-q82uYT.webp,/images/zfold/2026-03-31-09-38-24-img-0-77-6914-0-1-2u7mBB.webp,/images/zfold/2026-03-31-09-38-24-img-0-77-6914-0-1-KaHqXa.webp", 
      description: "Latest 2025 foldable flagship from Samsung.", isActive: true
    },
    {
      id: 2, brand: "Apple", model: "iPhone 17 Pro 256 GB Deep Blue", 
      basePriceUsd: 1299, wholesalePriceUsd: 1199, stockQuantity: 5, statusTag: "new", 
      imageUrl: "/images/apple-iphone-17-pro-256-gb-deep-blue_1.png,/images/apple-iphone-17-pro-256-gb-deep-blue_2.jpg,/images/apple-iphone-17-pro-256-gb-deep-blue_3.jpg,/images/apple-iphone-17-pro-256-gb-deep-blue_4.jpg,/images/apple-iphone-17-pro-256-gb-deep-blue_5.jpg",
      description: "Apple's 2026 Pro model in stunning Deep Blue Titanium.", isActive: true
    },
    {
      id: 3, brand: "Apple", model: "iPhone 17 Pro Max 256 GB Silver", 
      basePriceUsd: 1499, wholesalePriceUsd: 1399, stockQuantity: 4, statusTag: "new", 
      imageUrl: "/images/apple-iphone-17-pro-max-256-gb-silver_1.jpg,/images/apple-iphone-17-pro-max-256-gb-silver_2.webp,/images/apple-iphone-17-pro-max-256-gb-silver_3.webp,/images/apple-iphone-17-pro-max-256-gb-silver_4.webp",
      description: "The largest 2026 iPhone flagship in Silver finish.", isActive: true
    },
    {
      id: 4, brand: "Apple", model: "iPhone 17 Pro Max 256 GB Cosmic Orange", 
      basePriceUsd: 1499, wholesalePriceUsd: 1399, stockQuantity: 3, statusTag: "new", 
      imageUrl: "/images/iphone17promax_orange_1.jpg,/images/iphone17promax_orange_2.jpg,/images/iphone17promax_orange_3.jpg,/images/iphone17promax_orange_4.jpg",
      description: "Exclusive Cosmic Orange titanium finish for 2026.", isActive: true
    },
    {
      id: 5, brand: "Apple", model: "iPhone 17 256 GB Lavender", 
      basePriceUsd: 899, wholesalePriceUsd: 820, stockQuantity: 10, statusTag: "new", 
      imageUrl: "/images/apple-iphone-17-256-gb-lavender_1.jpg,/images/apple-iphone-17-256-gb-lavender_2.jpg,/images/apple-iphone-17-256-gb-lavender_3.jpg,/images/apple-iphone-17-256-gb-lavender_4.jpg,/images/apple-iphone-17-256-gb-lavender_5.jpg",
      description: "Fresh Lavender color for the new 2026 base model.", isActive: true
    },
    {
      id: 6, brand: "Xiaomi", model: "Poco M7 6/128 GB Black", 
      basePriceUsd: 220, wholesalePriceUsd: 195, stockQuantity: 15, statusTag: "promo", 
      imageUrl: "/images/poco-m7-6128-gb-black_1.png,/images/poco-m7-6128-gb-black_2.png,/images/poco-m7-6128-gb-black_3.png,/images/poco-m7-6128-gb-black_4.png,/images/poco-m7-6128-gb-black_5.png",
      description: "The new performance king of entry-level phones.", isActive: true
    },
    {
      id: 7, brand: "Samsung", model: "Galaxy S26 Ultra 5G 12/512GB Violet", 
      basePriceUsd: 1350, wholesalePriceUsd: 1250, stockQuantity: 4, statusTag: "new", 
      imageUrl: "/images/samsung-s948-s26-ultra-5g-12512gb-violet_1.jpg",
      description: "Samsung's 2026 flagship vision. Violet Titanium.", isActive: true
    },
    {
      id: 8, brand: "Samsung", model: "Galaxy Z Flip 7 (2025) 5G 12/256GB Blue", 
      basePriceUsd: 1099, wholesalePriceUsd: 999, stockQuantity: 6, statusTag: "new", 
      imageUrl: "/images/samsung-f766-z-flip-7-2025-5g-12256gb-blue_1.webp,/images/samsung-f766-z-flip-7-2025-5g-12256gb-blue_2.webp,/images/samsung-f766-z-flip-7-2025-5g-12256gb-blue_3.webp,/images/samsung-f766-z-flip-7-2025-5g-12256gb-blue_4.webp",
      description: "Iconic flip design with 2025 performance upgrades.", isActive: true
    },
    {
      id: 9, brand: "Samsung", model: "Galaxy A36 (2025) 5G 8/256GB Green", 
      basePriceUsd: 350, wholesalePriceUsd: 310, stockQuantity: 12, statusTag: "new", 
      imageUrl: "/images/galaxya36.png",
      description: "Stylish 2025 A-series in Lime Green.", isActive: true
    },
    {
      id: 10, brand: "Samsung", model: "Galaxy A36 (2025) 5G 8/256GB Black", 
      basePriceUsd: 350, wholesalePriceUsd: 310, stockQuantity: 10, statusTag: "new", 
      imageUrl: "/images/samsung-a366-a36-2025-5g-8256gb-black_1.jpg,/images/samsung-a366-a36-2025-5g-8256gb-black_2.jpg,/images/samsung-a366-a36-2025-5g-8256gb-black_3.jpg",
      description: "Classic Black finish for the new Galaxy A36.", isActive: true
    },
    {
      id: 11, brand: "Samsung", model: "Galaxy S25 12/256GB 5G Silver", 
      basePriceUsd: 799, wholesalePriceUsd: 740, stockQuantity: 8, statusTag: "new", 
      imageUrl: "/images/samsung-s931-s25-12256gb-5g-silver_1.jpg,/images/samsung-s931-s25-12256gb-5g-silver_5.png",
      description: "Compact flagship performance in Silver finish.", isActive: true
    },
    {
      id: 12, brand: "Samsung", model: "Galaxy S25 12/256GB 5G Blue", 
      basePriceUsd: 799, wholesalePriceUsd: 740, stockQuantity: 7, statusTag: "new", 
      imageUrl: "/images/samsung-s931-s25-12256gb-5g-blue_1.jpg,/images/samsung-s931-s25-12256gb-5g-blue_2.png",
      description: "Stunning Arctic Blue for the new Galaxy S25.", isActive: true
    }
  ];

  for (const p of productData) {
    await db.insert(products).values(p as any);
  }

  console.log("✅ SUCCESS! All 12 models now have FULL localized high-res galleries.");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
