ALTER TABLE `sales_conversations` MODIFY COLUMN `personaId` varchar(64) NOT NULL DEFAULT 'onyxweb-sales';--> statement-breakpoint
ALTER TABLE `inquiries` ADD `details` text;--> statement-breakpoint
ALTER TABLE `inquiries` ADD `source` varchar(100);