CREATE TABLE `ai_constitutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`company_name` varchar(255),
	`company_description` text,
	`industry` varchar(128),
	`company_size` varchar(64),
	`website` varchar(255),
	`icp_industries` text,
	`icp_company_size` varchar(64),
	`icp_seniority` varchar(128),
	`icp_geography` varchar(255),
	`icp_pain_points` text,
	`icp_buying_triggers` text,
	`unique_value_prop` text,
	`top_competitors` text,
	`differentiators` text,
	`communication_tone` varchar(64) DEFAULT 'professional',
	`language_style` varchar(64) DEFAULT 'direct',
	`forbidden_words` text,
	`primary_goal` varchar(128) DEFAULT 'generate_leads',
	`monthly_lead_target` int,
	`avg_deal_value` int,
	`sales_cycle_length` varchar(64),
	`custom_context` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `ai_constitutions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_constitutions_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `benchmark_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`total_score` int NOT NULL DEFAULT 0,
	`pass_rate` int NOT NULL DEFAULT 0,
	`tasks_run` int NOT NULL DEFAULT 0,
	`tier_scores` json,
	`results` json,
	`created_at` bigint NOT NULL,
	CONSTRAINT `benchmark_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `captured_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'exit_intent',
	`first_name` varchar(128),
	`utm_source` varchar(128),
	`utm_medium` varchar(128),
	`utm_campaign` varchar(128),
	`page_url` text,
	`welcome_email_sent` boolean NOT NULL DEFAULT false,
	`welcome_email_sent_at` bigint,
	`converted_to_user` boolean NOT NULL DEFAULT false,
	`converted_at` bigint,
	`created_at` bigint NOT NULL,
	CONSTRAINT `captured_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hermes_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` varchar(16) NOT NULL,
	`agent_name` varchar(64),
	`content` text NOT NULL,
	`metadata` json,
	`created_at` bigint NOT NULL,
	CONSTRAINT `hermes_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hermes_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_id` int,
	`mission_type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`plan` json,
	`result` json,
	`sub_agents_involved` json,
	`started_at` bigint,
	`completed_at` bigint,
	`created_at` bigint NOT NULL,
	CONSTRAINT `hermes_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hermes_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_name` varchar(255),
	`intent` varchar(64) NOT NULL DEFAULT 'general',
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`message_count` int NOT NULL DEFAULT 0,
	`sub_agents_used` json,
	`last_activity` bigint NOT NULL,
	`created_at` bigint NOT NULL,
	CONSTRAINT `hermes_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `brain_analyses` ADD `confidenceScore` int;--> statement-breakpoint
ALTER TABLE `brain_analyses` ADD `advocateAnalysis` text;--> statement-breakpoint
ALTER TABLE `brain_analyses` ADD `skepticAnalysis` text;--> statement-breakpoint
ALTER TABLE `brain_analyses` ADD `confidenceReasoning` text;