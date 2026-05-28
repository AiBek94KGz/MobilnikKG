const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

console.log('Starting migration...');

try {
  // 1. Get store owners
  const storeOwners = db.prepare("SELECT * FROM users WHERE role = 'store_owner'").all();
  console.log(`Found ${storeOwners.length} store owners.`);

  for (const owner of storeOwners) {
    const slug = owner.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check if store exists
    const existingStore = db.prepare("SELECT id FROM stores WHERE slug = ?").get(slug);
    
    let storeId;
    if (!existingStore) {
      const info = db.prepare("INSERT INTO stores (owner_id, name, slug, status, created_at) VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)")
        .run(owner.id, owner.name, slug);
      storeId = info.lastInsertRowid;
      console.log(`Created store '${owner.name}' (ID: ${storeId}) for user ${owner.username}`);
    } else {
      storeId = existingStore.id;
      console.log(`Store '${owner.name}' already exists (ID: ${storeId})`);
    }

    // 2. Link products
    const productUpdate = db.prepare("UPDATE products SET store_id = ? WHERE owner_id = ?").run(storeId, owner.id);
    console.log(`Updated ${productUpdate.changes} products for store ${storeId}`);
  }

  console.log('Migration completed successfully.');
} catch (err) {
  console.error('Migration failed:', err);
} finally {
  db.close();
}
