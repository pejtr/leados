CREATE TABLE `ad_campaign_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`snapshotDate` varchar(10) NOT NULL,
	`adSpend` decimal(12,2) NOT NULL DEFAULT '0',
	`revenue` decimal(12,2) NOT NULL DEFAULT '0',
	`conversions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`roas` decimal(8,4) NOT NULL DEFAULT '0',
	`pno` decimal(8,4) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_campaign_snapshots_id` PRIMARY KEY(`id`)
);
