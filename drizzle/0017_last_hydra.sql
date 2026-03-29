CREATE TABLE `daily_report_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`send_hour` int NOT NULL DEFAULT 8,
	`include_projects` boolean NOT NULL DEFAULT true,
	`include_campaigns` boolean NOT NULL DEFAULT true,
	`include_leads` boolean NOT NULL DEFAULT true,
	`last_sent_at` bigint,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `daily_report_configs_id` PRIMARY KEY(`id`)
);
