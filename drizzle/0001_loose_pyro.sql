CREATE TABLE `lead_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`industry` varchar(128) NOT NULL,
	`location` varchar(128) NOT NULL,
	`seniorityLevel` varchar(64) NOT NULL,
	`requestedCount` int NOT NULL,
	`generatedCount` int NOT NULL DEFAULT 0,
	`enrichedCount` int NOT NULL DEFAULT 0,
	`status` enum('pending','running','done','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `lead_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(256) NOT NULL,
	`email` varchar(320),
	`website` varchar(512),
	`industry` varchar(128) NOT NULL,
	`location` varchar(128),
	`companySize` varchar(64),
	`seniorityLevel` varchar(64),
	`contactName` varchar(256),
	`linkedinUrl` varchar(512),
	`companyDescription` text,
	`icebreaker` text,
	`isEnriched` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
