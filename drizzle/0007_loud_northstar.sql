ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` varchar(32) DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` varchar(32) DEFAULT 'free';