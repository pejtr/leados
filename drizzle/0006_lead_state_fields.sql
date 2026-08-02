ALTER TABLE `prospects` ADD `leadState` enum('DISCOVERED','RESEARCHED','QUALIFIED','MESSAGE_READY','APPROVED','MANUALLY_SENT','CONNECTED','REPLIED','MEETING','PROPOSAL','WON','LOST','NURTURE') NOT NULL DEFAULT 'DISCOVERED';--> statement-breakpoint
ALTER TABLE `prospects` ADD `timingScore` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prospects` ADD `creepRisk` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prospects` ADD `verifiedSignals` text;--> statement-breakpoint
ALTER TABLE `prospects` ADD `sourceEvidence` text;--> statement-breakpoint
ALTER TABLE `prospects` ADD `whyThisCompany` text;
