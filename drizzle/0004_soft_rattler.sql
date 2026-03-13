CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`subject` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`memberId` int NOT NULL,
	`memberRole` enum('admin','agent') NOT NULL DEFAULT 'agent',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `qualityRating` enum('good','bad');--> statement-breakpoint
ALTER TABLE `leads` ADD `qualityNote` varchar(256);--> statement-breakpoint
ALTER TABLE `leads` ADD `dealValue` decimal(12,2);--> statement-breakpoint
ALTER TABLE `leads` ADD `dealClosed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `dealClosedAt` timestamp;--> statement-breakpoint
ALTER TABLE `leads` ADD `currency` varchar(8) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE `leads` ADD `assignedTo` int;--> statement-breakpoint
ALTER TABLE `leads` ADD `segment` varchar(64);