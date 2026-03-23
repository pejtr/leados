CREATE TABLE `brain_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`contextType` varchar(32) NOT NULL DEFAULT 'project',
	`contextId` int,
	`contextData` text,
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`pragmaticArchitect` text,
	`creativeVisionary` text,
	`criticalInvestor` text,
	`technicalPurist` text,
	`growthHacker` text,
	`masterReport` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `brain_analyses_id` PRIMARY KEY(`id`)
);
