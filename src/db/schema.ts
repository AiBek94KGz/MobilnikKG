import { pgTable, serial, text, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id"),
  googleId: text("google_id"),
  email: text("email"),
  name: text("name").notNull(),
  username: text("username").notNull(),
  phone: text("phone"),
  password: text("password"),
  userIndex: text("user_index").unique(),
  role: text("role", { enum: ["owner", "admin", "wholesale", "client", "store_owner", "store_staff"] }).default("client").notNull(),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 1.1 Stores Table
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  status: text("status", { enum: ["pending", "active", "blocked"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id),
  storeId: integer("store_id").references(() => stores.id),
  brand: text("brand", { enum: ["Apple", "Samsung", "Xiaomi", "Huawei", "Honor", "Realme", "Tecno", "Infinix", "Poco", "Google", "OnePlus", "Feature Phones"] }).notNull(),
  model: text("model").notNull(),
  memory: text("memory"),
  color: text("color"),
  basePriceUsd: integer("base_price_usd").notNull(),
  wholesalePriceUsd: integer("wholesale_price_usd").notNull(),
  stockQuantity: integer("stock_quantity").notNull(),
  statusTag: text("status_tag", { enum: ["all", "new", "imported", "promo"] }).default("all").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  batteryCapacity: integer("battery_capacity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Orders Table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  totalUsd: real("total_usd").notNull(),
  currencyUsed: text("currency_used", { enum: ["USD", "KGS"] }).default("USD").notNull(),
  exchangeRate: real("exchange_rate").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "cancelled", "sold"] }).default("pending").notNull(),
  deliveryType: text("delivery_type", { enum: ["local", "pre-order", "in-store"] }).default("local").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Order Items Table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  pricePaidUsd: integer("price_paid_usd").notNull(),
});

// 5. Logs / Logs Table for Telegram Notifications
export const telegramLogs = pgTable("telegram_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  payload: text("payload").notNull(),
  status: text("status").notNull(),
});

// 6. System Settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  usdToKgsRate: real("usd_to_kgs_rate").default(90.0).notNull(),
  dubaiShippingCostUsd: real("dubai_shipping_cost_usd").default(35.0).notNull(),
  koreaShippingCostUsd: real("korea_shipping_cost_usd").default(30.0).notNull(),
});

// 7. Auth Codes (For Telegram cross-instance auth)
export const authCodes = pgTable("auth_codes", {
  code: text("code").primaryKey(),
  telegramId: text("telegram_id"),
  username: text("username"),
  firstName: text("first_name"),
  status: text("status", { enum: ["pending", "verified"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Schema Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  managedStores: many(stores),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.ownerId],
    references: [users.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  owner: one(users, {
    fields: [products.ownerId],
    references: [users.id],
  }),
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
