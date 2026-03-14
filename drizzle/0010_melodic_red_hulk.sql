CREATE TABLE `connected_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`url` varchar(512),
	`category` varchar(64) DEFAULT 'ecommerce',
	`apiKey` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`currency` varchar(8) NOT NULL DEFAULT 'CZK',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connected_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `connected_projects_apiKey_unique` UNIQUE(`apiKey`)
);
--> statement-breakpoint
CREATE TABLE `project_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`value` decimal(14,2) DEFAULT '0',
	`currency` varchar(8) NOT NULL DEFAULT 'CZK',
	`metadata` text,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_events_id` PRIMARY KEY(`id`)
);
