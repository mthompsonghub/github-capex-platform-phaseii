-- Add 'Active' to project_status if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'project_status' 
        AND e.enumlabel = 'Active'
    ) THEN
        ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'Active';
    END IF;
END $$; 