CREATE TABLE `dsr_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'deep-sleep-reset',
	`total_revenue_cents` int NOT NULL DEFAULT 0,
	`today_revenue_cents` int NOT NULL DEFAULT 0,
	`last7d_revenue_cents` int NOT NULL DEFAULT 0,
	`last30d_revenue_cents` int NOT NULL DEFAULT 0,
	`total_orders` int NOT NULL DEFAULT 0,
	`total_leads` int NOT NULL DEFAULT 0,
	`converted_leads` int NOT NULL DEFAULT 0,
	`conversion_rate_pct` int NOT NULL DEFAULT 0,
	`raw_payload` json,
	`pushed_at` bigint NOT NULL,
	`created_at` bigint NOT NULL,
	CONSTRAINT `dsr_snapshots_id` PRIMARY KEY(`id`)
);
