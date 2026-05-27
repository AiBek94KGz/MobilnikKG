import { db } from "./index";
import { users } from "./schema";

async function main() {
  try {
    const list = await db.select().from(users);
    console.log("Database contains " + list.length + " users:");
    list.forEach(u => {
      console.log(`- ID: ${u.id}, Username: ${u.username}, Name: ${u.name}, TelegramID: ${u.telegramId}, UserIndex: ${u.userIndex}, Role: ${u.role}`);
    });
  } catch (err: any) {
    console.error("Query failed:", err.message);
  }
}

main();

