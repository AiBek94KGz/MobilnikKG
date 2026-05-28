CREATE TABLE "auth_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"telegram_id" text,
	"username" text,
	"first_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
