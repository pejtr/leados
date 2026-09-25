CREATE TABLE IF NOT EXISTS omni_ad_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  site_key TEXT NOT NULL,
  creative_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  placement TEXT,
  page_path TEXT,
  referrer_host TEXT
);

CREATE INDEX IF NOT EXISTS idx_omni_ad_events_site_time
  ON omni_ad_events(site_key, timestamp);

CREATE INDEX IF NOT EXISTS idx_omni_ad_events_creative_time
  ON omni_ad_events(creative_key, timestamp);
