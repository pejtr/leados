CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`packageType` varchar(100) NOT NULL,
	`totalPrice` int NOT NULL,
	`depositPercentage` int NOT NULL DEFAULT 30,
	`depositAmount` int NOT NULL,
	`remainingAmount` int NOT NULL,
	`status` enum('pending','deposit_paid','completed','cancelled') NOT NULL DEFAULT 'pending',
	`stripeCheckoutSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('deposit','final','refund') NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`status` enum('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
	`invoiceUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
