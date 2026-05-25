import { db } from "./index";
import { products } from "./schema";

async function main() {
  try {
    const list = await db.select().from(products);
    console.log("Database contains " + list.length + " products:");
    list.forEach(p => {
      console.log(`- ${p.brand} ${p.model}: ${p.imageUrl}`);
    });
  } catch (err: any) {
    console.error("Query failed:", err.message);
  }
}

main();
