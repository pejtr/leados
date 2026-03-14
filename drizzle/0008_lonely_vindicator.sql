CREATE TABLE `ai_agent_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`memoryType` enum('learning','optimization','preference','insight') NOT NULL,
	`key` varchar(256) NOT NULL,
	`value` text NOT NULL,
	`confidence` decimal(4,2) DEFAULT '0.50',
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_agent_memory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_chat_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`toolsUsed` text,
	`actionsExecuted` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_chat_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_performance_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cycleType` enum('scheduled','manual','triggered') NOT NULL DEFAULT 'scheduled',
	`metricsSnapshot` text NOT NULL,
	`actionsPerformed` text NOT NULL,
	`improvements` text NOT NULL,
	`score` decimal(5,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_performance_log_id` PRIMARY KEY(`id`)
);
