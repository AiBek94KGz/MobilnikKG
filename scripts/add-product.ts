import { db } from "./index";
import { products } from "./schema";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.log("Использование: npx tsx src/db/add-product.ts <brand> <model> <retailPrice> <wholesalePrice> <quantity> [image_url] [description]");
    console.log("Пример: npx tsx src/db/add-product.ts Apple \"iPhone 17 Pro\" 1290 1190 5 \"apple\" \"New flagship model\"");
    process.exit(1);
  }

  const [brand, model, retailPriceStr, wholesalePriceStr, qtyStr, imageUrl, description] = args;

  const validBrands = ["Apple", "Samsung", "Xiaomi", "Feature Phones"];
  if (!validBrands.includes(brand)) {
    console.error(`Ошибка: Недопустимый бренд "${brand}". Разрешенные бренды: ${validBrands.join(", ")}`);
    process.exit(1);
  }

  const basePriceUsd = parseInt(retailPriceStr, 10);
  const wholesalePriceUsd = parseInt(wholesalePriceStr, 10);
  const stockQuantity = parseInt(qtyStr, 10);

  if (isNaN(basePriceUsd) || isNaN(wholesalePriceUsd) || isNaN(stockQuantity)) {
    console.error("Ошибка: Цены и количество должны быть числами.");
    process.exit(1);
  }

  try {
    const inserted = await db.insert(products).values({
      ownerId: 2, // Default store owner ID
      brand: brand as any,
      model,
      basePriceUsd,
      wholesalePriceUsd,
      stockQuantity,
      statusTag: "new",
      imageUrl: imageUrl || "apple",
      description: description || "No description provided",
      isActive: true,
    }).returning({ id: products.id });

    console.log(`✅ Товар успешно добавлен! ID нового товара: ${inserted[0].id}`);
  } catch (err: any) {
    console.error("❌ Не удалось добавить товар в базу данных:", err.message);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
