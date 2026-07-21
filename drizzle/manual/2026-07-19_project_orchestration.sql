CREATE TABLE IF NOT EXISTS `project_tasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('todo', 'in_progress', 'review', 'completed', 'failed') NOT NULL DEFAULT 'todo',
  `manusTaskId` varchar(128),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `project_tasks_id` PRIMARY KEY (`id`),
  INDEX `project_tasks_projectId_idx` (`projectId`),
  INDEX `project_tasks_status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `project_milestones` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` enum('pending', 'active', 'completed') NOT NULL DEFAULT 'pending',
  `dueDate` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `project_milestones_id` PRIMARY KEY (`id`),
  INDEX `project_milestones_projectId_idx` (`projectId`),
  INDEX `project_milestones_status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `heartbeat_jobs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `jobName` varchar(255) NOT NULL,
  `status` enum('running', 'success', 'failed', 'timeout') NOT NULL DEFAULT 'running',
  `lastRunAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `nextRunAt` timestamp NULL,
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `heartbeat_jobs_id` PRIMARY KEY (`id`),
  INDEX `heartbeat_jobs_jobName_idx` (`jobName`),
  INDEX `heartbeat_jobs_status_idx` (`status`)
);
