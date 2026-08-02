CREATE TABLE `customer_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`packageId` int NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`monthlyPrice` int NOT NULL,
	`nextBillingDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`businessDescription` text,
	`packageType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('new','contacted','converted') NOT NULL DEFAULT 'new',
	`notes` text,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `niche_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`niche` varchar(255) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`features` text NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `niche_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`imageUrl` varchar(500),
	`testimonialAuthor` varchar(255),
	`testimonialText` text,
	`testimonialRating` int,
	`results` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolio_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`author` varchar(255) NOT NULL,
	`role` varchar(255),
	`company` varchar(255),
	`text` text NOT NULL,
	`rating` int,
	`imageUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
