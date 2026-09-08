ALTER TABLE tickets ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS other_note text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_priority_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_priority_check CHECK(priority IN ('Low','Medium','High','Critical'));
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK(status IN ('New','Acknowledged','Assigned','In Progress','Pending User','Resolved','Closed','Pending','Completed'));
ALTER TABLE tickets ALTER COLUMN status SET DEFAULT 'New';
CREATE UNIQUE INDEX IF NOT EXISTS tickets_reference_idx ON tickets(reference);
