import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// 1. Users Table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  telegramId: text("telegram_id"),
  googleId: text("google_id"),
  email: text("email"),
  name: text("name").notNull(),
  username: text("username").notNull(),
  phone: text("phone"),
  password: text("password"), // Secure hashed password
  userIndex: text("user_index").unique(), // M-ID, O-ID, C-ID
  role: text("role", { enum: ["owner", "admin", "wholesale", "client", "store_owner", "store_staff"] }).default("client").notNull(),
  parentId: integer("parent_id"), // For store owners adding staff
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

// 1.1 Stores Table
export const stores = sqliteTable("stores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  status: text("status", { enum: ["pending", "active", "blocked"] }).default("pending").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

// 2. Products Table
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").references(() => users.id), // Legacy: Which user owns this (fallback)
  storeId: integer("store_id").references(() => stores.id), // NEW: Which store owns this product
  brand: text("brand", { enum: ["Apple", "Samsung", "Xiaomi", "Feature Phones"] }).notNull(),
  model: text("model").notNull(),
  basePriceUsd: integer("base_price_usd").notNull(),
  wholesalePriceUsd: integer("wholesale_price_usd").notNull(),
  stockQuantity: integer("stock_quantity").notNull(),
  statusTag: text("status_tag", { enum: ["all", "new", "imported", "promo"] }).default("all").notNull(),
  imageUrl: text("image_url").notNull(), // SVG alias 'apple', 'samsung', 'xiaomi', 'feature'
  description: text("description").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  batteryCapacity: integer("battery_capacity"),
});

// 3. Orders Table
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  totalUsd: integer("total_usd").notNull(),
  currencyUsed: text("currency_used", { enum: ["USD", "KGS"] }).notNull(),
  exchangeRate: real("exchange_rate").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "cancelled"] }).default("pending").notNull(),
  deliveryType: text("delivery_type", { enum: ["local", "pre-order"] }).default("local").notNull(),
  createdAt: text("created_at").notNull(),
});

// 4. Order Items Table
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  pricePaidUsd: integer("price_paid_usd").notNull(),
});

// 5. System Settings Table
export const systemSettings = sqliteTable("system_settings", {
  id: integer("id").primaryKey(), // Usually single row with id = 1
  usdToKgsRate: real("usd_to_kgs_rate").notNull(),
  dubaiShippingCostUsd: real("dubai_shipping_cost_usd").notNull(),
  koreaShippingCostUsd: real("korea_shipping_cost_usd").notNull(),
});

// --- Schema Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
