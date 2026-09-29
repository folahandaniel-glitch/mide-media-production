CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`token_version` integer DEFAULT 0 NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`link_text` text DEFAULT '' NOT NULL,
	`link_url` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`starts_at` text DEFAULT '' NOT NULL,
	`ends_at` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`service` text DEFAULT '' NOT NULL,
	`preferred_date` text DEFAULT '' NOT NULL,
	`budget` text DEFAULT '' NOT NULL,
	`message` text NOT NULL,
	`referral` text DEFAULT '' NOT NULL,
	`project` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `enquiries_status_idx` ON `enquiries` (`status`);--> statement-breakpoint
CREATE TABLE `hero_slides` (
	`id` text PRIMARY KEY NOT NULL,
	`eyebrow` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`image_alt` text DEFAULT '' NOT NULL,
	`video` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `instagram_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`image` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`post_url` text DEFAULT '' NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`storage_key` text DEFAULT '' NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'image' NOT NULL,
	`mime` text DEFAULT '' NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`width` integer,
	`height` integer,
	`category` text DEFAULT 'general' NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `navigation_items` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`href` text NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portfolio_categories_slug_unique` ON `portfolio_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `portfolio_media` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`url` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `portfolio_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `portfolio_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category_id` text,
	`cover_image` text DEFAULT '' NOT NULL,
	`cover_alt` text DEFAULT '' NOT NULL,
	`video_url` text DEFAULT '' NOT NULL,
	`youtube_url` text DEFAULT '' NOT NULL,
	`vimeo_url` text DEFAULT '' NOT NULL,
	`project_date` text DEFAULT '' NOT NULL,
	`client` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`project_type` text DEFAULT '' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`is_placeholder` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `portfolio_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portfolio_projects_slug_unique` ON `portfolio_projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `portfolio_projects` (`status`);--> statement-breakpoint
CREATE TABLE `sections` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text,
	`built_in` integer DEFAULT false NOT NULL,
	`type` text NOT NULL,
	`anchor` text DEFAULT '' NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`eyebrow` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`image_alt` text DEFAULT '' NOT NULL,
	`video` text DEFAULT '' NOT NULL,
	`button_text` text DEFAULT '' NOT NULL,
	`button_url` text DEFAULT '' NOT NULL,
	`background` text DEFAULT 'dark' NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sections_key_idx` ON `sections` (`key`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT 'film' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`video` text DEFAULT '' NOT NULL,
	`whatsapp_message` text DEFAULT '' NOT NULL,
	`highlighted` integer DEFAULT false NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '{}' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_links` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`url` text NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`position` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`photo` text DEFAULT '' NOT NULL,
	`skills` text DEFAULT '' NOT NULL,
	`instagram` text DEFAULT '' NOT NULL,
	`facebook` text DEFAULT '' NOT NULL,
	`linkedin` text DEFAULT '' NOT NULL,
	`x` text DEFAULT '' NOT NULL,
	`youtube` text DEFAULT '' NOT NULL,
	`tiktok` text DEFAULT '' NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`is_placeholder` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`service` text DEFAULT '' NOT NULL,
	`rating` integer DEFAULT 5 NOT NULL,
	`message` text NOT NULL,
	`photo` text DEFAULT '' NOT NULL,
	`consent` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`source` text DEFAULT 'website' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE INDEX `testimonials_status_idx` ON `testimonials` (`status`);--> statement-breakpoint
CREATE TABLE `why_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT 'aperture' NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
