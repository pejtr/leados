CREATE TABLE `agent_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentType` varchar(50) NOT NULL,
	`skillId` varchar(100),
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`tagline` varchar(500),
	`industry` varchar(100),
	`targetAudience` text,
	`brandVoice` text,
	`uniqueValue` text,
	`products` text,
	`painPoints` text,
	`competitors` text,
	`pastCampaigns` text,
	`website` varchar(500),
	`socialLinks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_conversations` (
	`id` varchar(64) NOT NULL,
	`personaId` varchar(64) NOT NULL DEFAULT 'optivio-sales',
	`visitorEmail` varchar(255),
	`visitorName` varchar(255),
	`visitorPhone` varchar(64),
	`capturedLead` int NOT NULL DEFAULT 0,
	`inquiryId` int,
	`messageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agent_messages` ADD CONSTRAINT `agent_messages_sessionId_agent_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `agent_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_sessions` ADD CONSTRAINT `agent_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brand_memories` ADD CONSTRAINT `brand_memories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales_messages` ADD CONSTRAINT `sales_messages_conversationId_sales_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `sales_conversations`(`id`) ON DELETE no action ON UPDATE no action;