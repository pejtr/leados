CREATE TABLE `call_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`filename` varchar(255) NOT NULL,
	`s3Url` text NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`duration` int,
	`transcription` text,
	`aiAnalysis` text,
	`sentiment` enum('positive','neutral','negative'),
	`actionItems` text,
	`callStatus` enum('uploaded','transcribing','analyzing','done','error') NOT NULL DEFAULT 'uploaded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_recordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`userId` int NOT NULL,
	`rate` decimal(5,2) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'CZK',
	`paidAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deal_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('call','email','meeting','note','task','demo') NOT NULL,
	`content` text,
	`duration` int,
	`outcome` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deal_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`title` varchar(256) NOT NULL,
	`value` decimal(12,2) DEFAULT '0',
	`currency` varchar(8) NOT NULL DEFAULT 'CZK',
	`stage` enum('new','qualified','presentation','proposal','negotiation','won','lost') NOT NULL DEFAULT 'new',
	`probability` int DEFAULT 0,
	`expectedCloseDate` timestamp,
	`lostReason` varchar(512),
	`lostTo` varchar(256),
	`wonAt` timestamp,
	`aiScore` int DEFAULT 0,
	`nextAction` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follow_up_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int NOT NULL,
	`status` enum('active','paused','completed','meeting_booked') NOT NULL DEFAULT 'active',
	`followUpCount` int NOT NULL DEFAULT 0,
	`maxFollowUps` int NOT NULL DEFAULT 5,
	`nextFollowUpAt` timestamp,
	`lastFollowUpAt` timestamp,
	`meetingBooked` boolean NOT NULL DEFAULT false,
	`meetingAt` timestamp,
	`meetingLinkId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `follow_up_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dealId` int,
	`type` enum('sale','rent') NOT NULL DEFAULT 'sale',
	`propertyType` enum('apartment','house','land','commercial','garage','other') NOT NULL DEFAULT 'apartment',
	`title` varchar(256) NOT NULL,
	`description` text,
	`address` varchar(512),
	`city` varchar(128),
	`district` varchar(128),
	`price` decimal(14,2),
	`currency` varchar(8) NOT NULL DEFAULT 'CZK',
	`area` decimal(8,2),
	`rooms` varchar(16),
	`floor` int,
	`totalFloors` int,
	`hasElevator` boolean DEFAULT false,
	`hasParking` boolean DEFAULT false,
	`hasGarden` boolean DEFAULT false,
	`energyClass` varchar(4),
	`photosJson` text,
	`portalSyncJson` text,
	`status` enum('draft','active','reserved','sold','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`duration` int NOT NULL DEFAULT 30,
	`description` text,
	`availabilityJson` text,
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meeting_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `meeting_links_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `morning_briefings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`topLeads` text,
	`pipelineAlerts` text,
	`nextActions` text,
	`dismissed` boolean NOT NULL DEFAULT false,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `morning_briefings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persona_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`personaId` varchar(100) NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`rating` enum('up','down') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictive_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int NOT NULL,
	`score` decimal(5,2) NOT NULL,
	`scoreLabel` enum('hot','warm','cold') NOT NULL,
	`factors` text,
	`modelVersion` varchar(32) DEFAULT 'v1',
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictive_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`userId` int NOT NULL,
	`buyerName` varchar(256),
	`buyerEmail` varchar(320),
	`buyerPhone` varchar(64),
	`stage` enum('interest','viewing','reservation','contract','handover','completed') NOT NULL DEFAULT 'interest',
	`reservationDate` timestamp,
	`contractDate` timestamp,
	`handoverDate` timestamp,
	`finalPrice` decimal(14,2),
	`commission` decimal(12,2),
	`documentsJson` text,
	`checklistJson` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `property_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`period` varchar(16) NOT NULL,
	`periodType` enum('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
	`targetValue` decimal(12,2) NOT NULL,
	`achievedValue` decimal(12,2) DEFAULT '0',
	`currency` varchar(8) NOT NULL DEFAULT 'CZK',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_playbooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`type` enum('inbound','outbound','real_estate','enterprise','upsell') NOT NULL DEFAULT 'inbound',
	`stepsJson` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_playbooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_persona_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`personaId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_persona_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_sequence_steps` ADD `stepType` enum('email','linkedin_connect','linkedin_message','call') DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE `email_sequence_steps` ADD `linkedinNote` text;