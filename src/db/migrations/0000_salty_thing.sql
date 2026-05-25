CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`price_paid_usd` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`total_usd` integer NOT NULL,
	`currency_used` text NOT NULL,
	`exchange_rate` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`delivery_type` text DEFAULT 'local' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`base_price_usd` integer NOT NULL,
	`wholesale_price_usd` integer NOT NULL,
	`stock_quantity` integer NOT NULL,
	`status_tag` text DEFAULT 'all' NOT NULL,
	`image_url` text NOT NULL,
	`description` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`usd_to_kgs_rate` real NOT NULL,
	`dubai_shipping_cost_usd` real NOT NULL,
	`korea_shipping_cost_usd` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` text,
	`google_id` text,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`phone` text,
	`role` text DEFAULT 'client' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
