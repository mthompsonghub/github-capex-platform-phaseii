-- Create enum types for status values
DROP TYPE IF EXISTS project_status CASCADE;
CREATE TYPE project_status AS ENUM ('Not Started', 'In Progress', 'Completed', 'N/A', 'Impacted', 'Active');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create project_phases table to track completion of each major phase
CREATE TABLE project_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    -- Feasibility
    feasibility_start DATE,
    feasibility_end DATE,
    feasibility_targeted_status INTEGER DEFAULT 100,
    feasibility_actual_status INTEGER DEFAULT 0,
    feasibility_milestones JSONB DEFAULT '[]',
    -- Planning
    planning_start DATE,
    planning_end DATE,
    planning_targeted_status INTEGER DEFAULT 100,
    planning_actual_status INTEGER DEFAULT 0,
    planning_milestones JSONB DEFAULT '[]',
    -- Execution
    execution_start DATE,
    execution_end DATE,
    execution_targeted_status INTEGER DEFAULT 100,
    execution_actual_status INTEGER DEFAULT 0,
    execution_milestones JSONB DEFAULT '[]',
    -- Close
    close_start DATE,
    close_end DATE,
    close_targeted_status INTEGER DEFAULT 0,
    close_actual_status INTEGER DEFAULT 0,
    close_milestones JSONB DEFAULT '[]',
    -- Overall Progress
    targeted_project_completion INTEGER DEFAULT 0,
    actual_project_completion INTEGER DEFAULT 0,
    -- Additional Info
    upcoming_milestone TEXT,
    comments_risk TEXT,
    yearly_budget DECIMAL,
    yearly_actual DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add RLS policies
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project phases" ON project_phases
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Project managers can modify project phases" ON project_phases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'project_manager')
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER update_project_phases_updated_at
    BEFORE UPDATE ON project_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update projects table with new columns
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS owner TEXT,
ADD COLUMN IF NOT EXISTS phase_weights JSONB DEFAULT '{
    "feasibility": 0.35,
    "planning": 0.45,
    "execution": 0.45,
    "close": 0.05
}'::jsonb;

-- First, create a temporary column with the new type
ALTER TABLE projects ADD COLUMN status_new project_status;

-- Update the new column with converted values
UPDATE projects 
SET status_new = CASE status::text
    WHEN 'Not Started' THEN 'Not Started'::project_status
    WHEN 'In Progress' THEN 'In Progress'::project_status
    WHEN 'Completed' THEN 'Completed'::project_status
    WHEN 'N/A' THEN 'N/A'::project_status
    WHEN 'Impacted' THEN 'Impacted'::project_status
    WHEN 'Active' THEN 'Active'::project_status
    ELSE 'Not Started'::project_status
END;

-- Drop the old column and rename the new one
ALTER TABLE projects DROP COLUMN status;
ALTER TABLE projects RENAME COLUMN status_new TO status; 