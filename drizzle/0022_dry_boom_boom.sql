CREATE TABLE `ai_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL DEFAULT 'general',
	`skill_type` varchar(32) NOT NULL DEFAULT 'prompt',
	`content` text NOT NULL,
	`variables` json,
	`example_input` json,
	`tags` varchar(512),
	`is_shared` boolean NOT NULL DEFAULT false,
	`usage_count` int NOT NULL DEFAULT 0,
	`last_used_at` bigint,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `ai_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roi_audit_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'draft',
	`processes` json,
	`feasibility_analysis` json,
	`total_time_saved_hours` int,
	`estimated_monthly_saving_eur` int,
	`top_priority_process` varchar(256),
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `roi_audit_sessions_id` PRIMARY KEY(`id`)
);
