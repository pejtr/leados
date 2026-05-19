CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`key_hash` varchar(256) NOT NULL,
	`permissions` varchar(512) NOT NULL DEFAULT 'read',
	`status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
	`last_used_at` bigint,
	`expires_at` bigint,
	`created_at` bigint NOT NULL,
	`revoked_at` bigint,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_key_hash_unique` UNIQUE(`key_hash`)
);
--> statement-breakpoint
CREATE TABLE `webhook_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhook_config_id` int NOT NULL,
	`user_id` int NOT NULL,
	`event` varchar(64) NOT NULL,
	`payload` json,
	`status_code` int,
	`response` text,
	`attempt` int NOT NULL DEFAULT 1,
	`status` enum('pending','success','failed','retrying') NOT NULL DEFAULT 'pending',
	`next_retry_at` bigint,
	`error` text,
	`created_at` bigint NOT NULL,
	`completed_at` bigint,
	CONSTRAINT `webhook_logs_id` PRIMARY KEY(`id`)
);
