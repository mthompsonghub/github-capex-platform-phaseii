-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better type safety
DO $$ BEGIN
    CREATE TYPE capex_project_type AS ENUM ('projects', 'asset_purchases');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE capex_status AS ENUM ('On Track', 'At Risk', 'Impacted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE capex_phase_type AS ENUM ('feasibility', 'planning', 'execution', 'close');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the main projects table
CREATE TABLE IF NOT EXISTS capex_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    project_owner VARCHAR(255) NOT NULL,
    project_type capex_project_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget DECIMAL(12,2) DEFAULT 0,
    total_actual DECIMAL(12,2) DEFAULT 0,
    project_status capex_status DEFAULT 'On Track',
    upcoming_milestone TEXT,
    project_comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Add constraints
    CONSTRAINT dates_check CHECK (end_date >= start_date),
    CONSTRAINT budget_check CHECK (total_budget >= 0),
    CONSTRAINT actual_check CHECK (total_actual >= 0)
);

-- Create phase completion tracking table
CREATE TABLE IF NOT EXISTS capex_phase_completion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES capex_projects(id) ON DELETE CASCADE,
    phase_type capex_phase_type NOT NULL,
    completion_percentage INTEGER DEFAULT 0,
    target_percentage INTEGER DEFAULT 100,
    weight INTEGER DEFAULT 25,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT completion_range CHECK (completion_percentage BETWEEN 0 AND 100),
    CONSTRAINT target_range CHECK (target_percentage BETWEEN 0 AND 100),
    CONSTRAINT weight_range CHECK (weight BETWEEN 0 AND 100),
    UNIQUE (project_id, phase_type)
);

-- Create phase items table for granular tracking
CREATE TABLE IF NOT EXISTS capex_phase_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phase_id UUID REFERENCES capex_phase_completion(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    completion_percentage INTEGER DEFAULT 0,
    is_na BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT item_completion_range CHECK (completion_percentage BETWEEN 0 AND 100)
);

-- Create project thresholds table for admin configuration
CREATE TABLE IF NOT EXISTS capex_thresholds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    on_track_threshold INTEGER NOT NULL DEFAULT 90,
    at_risk_threshold INTEGER NOT NULL DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Add constraints
    CONSTRAINT threshold_ranges CHECK (
        on_track_threshold > at_risk_threshold AND
        at_risk_threshold > 0 AND
        on_track_threshold <= 100
    )
);

-- Create system settings table for general configuration
CREATE TABLE IF NOT EXISTS capex_system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS capex_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES capex_projects(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB NOT NULL,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    performed_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON capex_projects(project_owner);
CREATE INDEX IF NOT EXISTS idx_projects_type ON capex_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON capex_projects(project_status);
CREATE INDEX IF NOT EXISTS idx_phase_completion_project ON capex_phase_completion(project_id);
CREATE INDEX IF NOT EXISTS idx_phase_items_phase ON capex_phase_items(phase_id);
CREATE INDEX IF NOT EXISTS idx_audit_project ON capex_audit_log(project_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_capex_projects_updated_at
    BEFORE UPDATE ON capex_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capex_phase_completion_updated_at
    BEFORE UPDATE ON capex_phase_completion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capex_phase_items_updated_at
    BEFORE UPDATE ON capex_phase_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capex_thresholds_updated_at
    BEFORE UPDATE ON capex_thresholds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default threshold values
INSERT INTO capex_thresholds (on_track_threshold, at_risk_threshold)
VALUES (90, 80)
ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO capex_system_settings (setting_key, setting_value) 
VALUES 
    ('phase_weights', '{"projects": {"feasibility": 25, "planning": 25, "execution": 25, "close": 25}, "asset_purchases": {"planning": 33, "execution": 33, "close": 34}}'),
    ('notification_settings', '{"email_notifications": true, "status_change_alerts": true}'),
    ('display_settings', '{"show_completed_projects": true, "default_view": "active"}')
ON CONFLICT (setting_key) DO NOTHING; 