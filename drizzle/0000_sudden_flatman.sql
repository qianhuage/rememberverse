CREATE TABLE `islands` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`theme` text NOT NULL,
	`story` text NOT NULL,
	`dates` text NOT NULL,
	`photo` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `islands_owner` ON `islands` (`owner`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`island` text NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`operation` text,
	`result` text,
	`error` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_island_provider` ON `jobs` (`island`,`provider`);--> statement-breakpoint
CREATE TABLE `memories` (
	`id` text PRIMARY KEY NOT NULL,
	`island` text NOT NULL,
	`kind` text NOT NULL,
	`text` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `memories_island` ON `memories` (`island`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mime` text NOT NULL
);
