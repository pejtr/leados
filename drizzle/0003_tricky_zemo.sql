CREATE TABLE `heartbeat_jobs` (
	`id` varchar(64) NOT NULL,
	`taskUid` varchar(255) NOT NULL,
	`projectId` varchar(64),
	`jobType` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`cronExpression` varchar(50) NOT NULL,
	`isActive` int DEFAULT 1,
	`lastExecutedAt` bigint,
	`nextExecutionAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `heartbeat_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `heartbeat_jobs_taskUid_unique` UNIQUE(`taskUid`)
);
--> statement-breakpoint
CREATE TABLE `manus_task_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` varchar(100) NOT NULL,
	`eventType` varchar(50) NOT NULL,
	`agentStatus` varchar(30),
	`content` text,
	`rawEvent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `manus_task_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_milestones` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
	`dueDate` bigint,
	`completedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(64) NOT NULL,
	`orderId` int NOT NULL,
	`leadsOsProjectId` varchar(255),
	`status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`title` varchar(255) NOT NULL,
	`description` text,
	`packageType` varchar(50) NOT NULL,
	`assignedTo` varchar(255),
	`deadline` bigint,
	`completionPercentage` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `heartbeat_jobs` ADD CONSTRAINT `heartbeat_jobs_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;