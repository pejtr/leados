CREATE TABLE IF NOT EXISTS omni_ad_sites (
  siteKey varchar(96) NOT NULL,
  name varchar(160) NOT NULL,
  domain varchar(255),
  enabled boolean NOT NULL DEFAULT false,
  customStreamEnabled boolean NOT NULL DEFAULT true,
  mainstreamFallbackEnabled boolean NOT NULL DEFAULT true,
  autoPlacement boolean NOT NULL DEFAULT false,
  frequencyCap int NOT NULL DEFAULT 3,
  frequencyWindowHours int NOT NULL DEFAULT 168,
  minRepeatMinutes int NOT NULL DEFAULT 360,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (siteKey)
);

CREATE TABLE IF NOT EXISTS omni_ad_creatives (
  creativeKey varchar(128) NOT NULL,
  advertiserKey varchar(96) NOT NULL,
  stream varchar(32) NOT NULL DEFAULT 'mainstream',
  format varchar(32) NOT NULL DEFAULT 'image',
  title varchar(255) NOT NULL,
  assetUrl varchar(1024) NOT NULL,
  destinationUrl varchar(1024) NOT NULL,
  altText varchar(512),
  tags json NOT NULL,
  targetSiteKeys json NOT NULL,
  priority int NOT NULL DEFAULT 100,
  frequencyCap int NOT NULL DEFAULT 3,
  frequencyWindowHours int NOT NULL DEFAULT 168,
  minRepeatMinutes int NOT NULL DEFAULT 360,
  enabled boolean NOT NULL DEFAULT true,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (creativeKey),
  KEY omni_ad_creatives_stream_idx (stream, enabled, priority)
);

CREATE TABLE IF NOT EXISTS omni_ad_events (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  timestamp bigint NOT NULL,
  siteKey varchar(96) NOT NULL,
  creativeKey varchar(128) NOT NULL,
  eventType varchar(16) NOT NULL,
  placement varchar(96),
  pagePath varchar(512),
  referrerHost varchar(255),
  PRIMARY KEY (id),
  KEY omni_ad_events_site_time_idx (siteKey, timestamp),
  KEY omni_ad_events_creative_time_idx (creativeKey, timestamp)
);
