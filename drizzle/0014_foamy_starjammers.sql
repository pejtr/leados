CREATE TABLE `portfolio_share_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`label` varchar(128) DEFAULT 'Portfolio ROAS Report',
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolio_share_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_share_tokens_token_unique` UNIQUE(`token`)
);
