CREATE TABLE `stores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`logo_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stores_slug_unique` ON `stores` (`slug`);--> statement-breakpoint
ALTER TABLE `products` ADD `owner_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `products` ADD `store_id` integer REFERENCES stores(id);--> statement-breakpoint
ALTER TABLE `products` ADD `battery_capacity` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `email` text;--> statement-breakpoint
ALTER TABLE `users` ADD `user_index` text;--> statement-breakpoint
ALTER TABLE `users` ADD `parent_id` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `users_user_index_unique` ON `users` (`user_index`);