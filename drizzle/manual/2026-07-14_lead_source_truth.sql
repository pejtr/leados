ALTER TABLE `leads`
  MODIFY COLUMN `dataSource` enum(
    'mock',
    'linkedin_apify',
    'xing_apify',
    'google_maps',
    'web_audit'
  ) NOT NULL DEFAULT 'mock';
