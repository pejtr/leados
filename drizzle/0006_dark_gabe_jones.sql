CREATE TABLE `ai_agent_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`userId` int NOT NULL,
	`input` text,
	`output` text,
	`status` enum('success','failed','timeout') NOT NULL DEFAULT 'success',
	`durationMs` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_agent_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`agentType` enum('lead_qualifier','email_writer','data_enricher','meeting_scheduler','custom') NOT NULL DEFAULT 'custom',
	`config` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`totalExecutions` int NOT NULL DEFAULT 0,
	`successRate` int DEFAULT 0,
	`lastExecutedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `capture_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`title` varchar(512) NOT NULL,
	`companyName` varchar(256),
	`stage` enum('identify','research','outreach','qualify','propose','close') NOT NULL DEFAULT 'identify',
	`notes` text,
	`estimatedValue` decimal(12,2),
	`probability` int DEFAULT 10,
	`expectedCloseAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `capture_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitive_maps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(256) NOT NULL,
	`industry` varchar(128) NOT NULL,
	`mapData` text NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitive_maps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sequence_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`leadId` int NOT NULL,
	`userId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`status` enum('active','paused','completed','unsubscribed') NOT NULL DEFAULT 'active',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`nextSendAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `email_sequence_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sequence_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`subject` varchar(512) NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_sequence_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(128) NOT NULL,
	`title` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`readTime` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_intel_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`industry` varchar(128) NOT NULL,
	`reportData` text NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_intel_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`title` varchar(512) NOT NULL,
	`description` text,
	`type` enum('call','email','meeting','follow_up','other') NOT NULL DEFAULT 'other',
	`status` enum('pending','done','cancelled') NOT NULL DEFAULT 'pending',
	`dueAt` timestamp,
	`reminderAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tech_stack_detections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`domain` varchar(256) NOT NULL,
	`technologies` text NOT NULL,
	`categories` text,
	`lastScannedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tech_stack_detections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;