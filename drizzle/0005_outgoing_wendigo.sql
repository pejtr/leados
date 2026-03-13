CREATE TABLE `agency_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agencyUserId` int NOT NULL,
	`clientName` varchar(256) NOT NULL,
	`clientEmail` varchar(320),
	`clientDomain` varchar(256),
	`industry` varchar(128),
	`brandColor` varchar(16),
	`brandLogo` text,
	`totalLeads` int NOT NULL DEFAULT 0,
	`totalCampaigns` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agency_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`conditionType` enum('high_intent_visitor','new_lead_generated','lead_status_change','deal_closed','visitor_returning','keyword_match') NOT NULL,
	`conditionValue` varchar(256),
	`channel` enum('email','slack','webhook') NOT NULL,
	`channelTarget` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalFired` int NOT NULL DEFAULT 0,
	`lastFiredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `autopilot_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`industry` varchar(128) NOT NULL,
	`location` varchar(128) NOT NULL,
	`seniorityLevel` varchar(64) NOT NULL,
	`leadCount` int NOT NULL DEFAULT 10,
	`segment` varchar(64),
	`scheduleType` enum('daily','weekly','monthly') NOT NULL DEFAULT 'weekly',
	`scheduleDayOfWeek` int DEFAULT 1,
	`scheduleHour` int NOT NULL DEFAULT 9,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`totalRuns` int NOT NULL DEFAULT 0,
	`totalLeadsGenerated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autopilot_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `autopilot_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`leadsGenerated` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `autopilot_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaign_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`triggerType` enum('lead_created','status_changed','email_opened','email_replied','intent_score_above','visitor_returned','deal_value_above') NOT NULL,
	`triggerValue` varchar(256),
	`actionType` enum('send_email','change_status','assign_to','add_to_list','send_webhook','send_slack','create_task') NOT NULL,
	`actionValue` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalExecutions` int NOT NULL DEFAULT 0,
	`lastExecutedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`email` varchar(320) NOT NULL,
	`status` enum('valid','invalid','risky','unknown','pending') NOT NULL DEFAULT 'pending',
	`provider` varchar(64) DEFAULT 'bouncer',
	`score` int,
	`reason` varchar(256),
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `icp_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`industries` text NOT NULL,
	`companySizeMin` int DEFAULT 10,
	`companySizeMax` int DEFAULT 500,
	`revenueRange` varchar(64),
	`locations` text NOT NULL,
	`technologies` text,
	`buyingSignals` text,
	`painPoints` text,
	`fitScore` int DEFAULT 0,
	`matchedLeads` int NOT NULL DEFAULT 0,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `icp_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`webhookConfigId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`payload` text,
	`responseStatus` int,
	`responseBody` text,
	`success` boolean NOT NULL DEFAULT false,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedin_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int NOT NULL,
	`connectionName` varchar(256) NOT NULL,
	`connectionTitle` varchar(256),
	`connectionCompany` varchar(256),
	`connectionLinkedinUrl` varchar(512),
	`relationshipStrength` enum('strong','moderate','weak') DEFAULT 'moderate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `linkedin_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`industries` text NOT NULL,
	`companySizeMin` int DEFAULT 10,
	`companySizeMax` int DEFAULT 500,
	`revenueMin` varchar(32),
	`revenueMax` varchar(32),
	`locations` text NOT NULL,
	`keywords` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `match_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nba_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int NOT NULL,
	`action` enum('call','email','linkedin','qualify','disqualify','wait') NOT NULL,
	`priority` int NOT NULL DEFAULT 50,
	`reason` text NOT NULL,
	`aiScore` int NOT NULL DEFAULT 50,
	`status` enum('pending','actioned','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`actionedAt` timestamp,
	CONSTRAINT `nba_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sdr_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`leadId` int,
	`type` enum('lead_generated','email_sent','reply_received','meeting_booked','follow_up_sent') NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sdr_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sdr_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`industry` varchar(128) NOT NULL,
	`location` varchar(128) NOT NULL DEFAULT '',
	`seniorityLevel` varchar(64) NOT NULL DEFAULT 'C-Level',
	`leadCount` int NOT NULL DEFAULT 20,
	`emailSubject` varchar(256),
	`emailTone` enum('professional','friendly','direct') NOT NULL DEFAULT 'professional',
	`followUpDays` int NOT NULL DEFAULT 3,
	`maxFollowUps` int NOT NULL DEFAULT 2,
	`leadsGenerated` int NOT NULL DEFAULT 0,
	`emailsSent` int NOT NULL DEFAULT 0,
	`replies` int NOT NULL DEFAULT 0,
	`meetings` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sdr_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smart_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`filters` text NOT NULL,
	`autoRefresh` boolean NOT NULL DEFAULT false,
	`refreshInterval` enum('hourly','daily','weekly') DEFAULT 'daily',
	`leadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smart_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_monitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`keywords` text NOT NULL,
	`platforms` varchar(128) NOT NULL DEFAULT 'linkedin',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastCheckedAt` timestamp,
	`signalsFound` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_monitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monitorId` int NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('linkedin','reddit','twitter') NOT NULL,
	`authorName` varchar(128),
	`authorTitle` varchar(128),
	`authorCompany` varchar(128),
	`content` text NOT NULL,
	`url` varchar(512),
	`matchedKeyword` varchar(128),
	`convertedToLead` boolean NOT NULL DEFAULT false,
	`leadId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `speed_to_lead_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`autoEmailEnabled` boolean NOT NULL DEFAULT true,
	`autoEmailTemplateId` int,
	`responseDelaySeconds` int NOT NULL DEFAULT 60,
	`notifyOnNewLead` boolean NOT NULL DEFAULT true,
	`notifyChannel` enum('email','slack','both') DEFAULT 'email',
	`notifyTarget` text,
	`totalAutoResponses` int NOT NULL DEFAULT 0,
	`avgResponseTime` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `speed_to_lead_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tracking_pixels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`domain` varchar(256) NOT NULL,
	`pixelCode` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalVisitors` int NOT NULL DEFAULT 0,
	`identifiedCompanies` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tracking_pixels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitor_page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorSessionId` int NOT NULL,
	`pageUrl` varchar(512) NOT NULL,
	`pageTitle` varchar(256),
	`timeOnPage` int DEFAULT 0,
	`scrollDepth` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitor_page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitor_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pixelId` int NOT NULL,
	`userId` int NOT NULL,
	`visitorIp` varchar(64),
	`companyName` varchar(256),
	`companyDomain` varchar(256),
	`industry` varchar(128),
	`location` varchar(128),
	`pageViews` int NOT NULL DEFAULT 1,
	`intentScore` int NOT NULL DEFAULT 0,
	`isIsp` boolean NOT NULL DEFAULT false,
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitor_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('generic','clickup','slack') NOT NULL DEFAULT 'generic',
	`webhookUrl` text,
	`clickupApiKey` text,
	`clickupListId` varchar(64),
	`slackWebhookUrl` text,
	`triggerOnGenerate` boolean NOT NULL DEFAULT true,
	`triggerOnStatusChange` boolean NOT NULL DEFAULT false,
	`triggerOnDealClose` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `team_members` ADD `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `name` text;--> statement-breakpoint
ALTER TABLE `team_members` ADD `role` enum('admin','agent','viewer') DEFAULT 'agent' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `status` enum('pending','active') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` DROP COLUMN `memberId`;--> statement-breakpoint
ALTER TABLE `team_members` DROP COLUMN `memberRole`;