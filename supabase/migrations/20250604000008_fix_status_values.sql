-- First convert status to text type to allow any value temporarily
ALTER TABLE projects 
ALTER COLUMN status TYPE text;

-- Update the values while they're text type
UPDATE projects
SET status = 'Active'
WHERE status IN ('In Progress', 'Impacted');

UPDATE projects
SET status = 'Planned'
WHERE status = 'Not Started';

UPDATE projects
SET status = 'Inactive'
WHERE status = 'N/A';

-- Drop the old enum type
DROP TYPE IF EXISTS project_status CASCADE;

-- Create the new enum type matching frontend expectations
CREATE TYPE project_status AS ENUM (
    'Active',
    'Inactive',
    'Planned',
    'Completed',
    'On Hold'
);

-- Convert the column back to the enum type
ALTER TABLE projects 
ALTER COLUMN status TYPE project_status USING status::project_status;

-- Add a comment explaining the valid status values
COMMENT ON TYPE project_status IS 'Valid values: Active, Inactive, Planned, Completed, On Hold';

-- Recreate any views that were dropped (if needed)
-- Note: You'll need to add the view recreation code here if it exists

-- Update any views that might reference the old status
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_matviews 
        WHERE matviewname = 'project_summary_view'
    ) THEN
        REFRESH MATERIALIZED VIEW project_summary_view;
    END IF;
END $$; 