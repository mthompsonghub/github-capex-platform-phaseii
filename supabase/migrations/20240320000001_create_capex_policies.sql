-- Drop existing policies if they exist
DO $$ 
DECLARE
    drop_statements text;
BEGIN
    SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON ' || tablename || ';', E'\n')
    INTO drop_statements
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('capex_projects', 'capex_phase_completion', 'capex_phase_items', 'capex_thresholds', 'capex_audit_log', 'capex_system_settings');

    IF drop_statements IS NOT NULL THEN
        EXECUTE drop_statements;
    END IF;
END $$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has admin role in auth.users
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = user_id
        AND raw_user_meta_data->>'role' = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is project owner
CREATE OR REPLACE FUNCTION is_project_owner(user_id UUID, project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM capex_projects
        WHERE id = project_id
        AND project_owner = (
            SELECT email FROM auth.users WHERE id = user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically create phase records
CREATE OR REPLACE FUNCTION create_project_phases()
RETURNS TRIGGER AS $$
DECLARE
    phase capex_phase_type;
BEGIN
    -- For each phase type, create a phase completion record
    FOR phase IN SELECT unnest(enum_range(NULL::capex_phase_type))
    LOOP
        INSERT INTO capex_phase_completion (
            project_id,
            phase_type,
            completion_percentage,
            target_percentage,
            weight,
            is_active
        ) VALUES (
            NEW.id,
            phase,
            0,
            100,
            CASE 
                WHEN NEW.project_type = 'projects' THEN 25
                WHEN phase = 'feasibility' THEN 0
                ELSE 33
            END,
            CASE 
                WHEN NEW.project_type = 'asset_purchases' AND phase = 'feasibility' THEN false
                ELSE true
            END
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to calculate project completion
CREATE OR REPLACE FUNCTION calculate_project_completion(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_completion INTEGER;
BEGIN
    SELECT COALESCE(
        SUM(pc.completion_percentage * pc.weight) / NULLIF(SUM(CASE WHEN pc.is_active THEN pc.weight ELSE 0 END), 0),
        0
    )::INTEGER INTO total_completion
    FROM capex_phase_completion pc
    WHERE pc.project_id = project_uuid;
    
    RETURN total_completion;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically update project status
CREATE OR REPLACE FUNCTION update_project_status()
RETURNS TRIGGER AS $$
DECLARE
    total_completion INTEGER;
    thresholds RECORD;
BEGIN
    -- Get current completion percentage using helper function
    total_completion := calculate_project_completion(NEW.project_id);
    
    -- Get current thresholds
    SELECT * INTO thresholds FROM capex_thresholds LIMIT 1;
    
    -- Update project status
    UPDATE capex_projects SET
        project_status = CASE
            WHEN total_completion >= thresholds.on_track_threshold THEN 'On Track'::capex_status
            WHEN total_completion >= thresholds.at_risk_threshold THEN 'At Risk'::capex_status
            ELSE 'Impacted'::capex_status
        END,
        updated_at = NOW()
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE capex_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE capex_phase_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE capex_phase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE capex_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE capex_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE capex_system_settings ENABLE ROW LEVEL SECURITY;

-- Projects table policies
CREATE POLICY "Projects viewable by all authenticated users"
    ON capex_projects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Projects creatable by admins only"
    ON capex_projects FOR INSERT
    TO authenticated
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Projects updatable by admins and owners"
    ON capex_projects FOR UPDATE
    TO authenticated
    USING (
        is_admin(auth.uid()) OR 
        is_project_owner(auth.uid(), id)
    )
    WITH CHECK (
        is_admin(auth.uid()) OR 
        is_project_owner(auth.uid(), id)
    );

CREATE POLICY "Projects deletable by admins only"
    ON capex_projects FOR DELETE
    TO authenticated
    USING (is_admin(auth.uid()));

-- Phase completion policies
CREATE POLICY "Phase completion viewable by all authenticated users"
    ON capex_phase_completion FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Phase completion modifiable by admins and project owners"
    ON capex_phase_completion FOR ALL
    TO authenticated
    USING (
        is_admin(auth.uid()) OR 
        is_project_owner(auth.uid(), project_id)
    )
    WITH CHECK (
        is_admin(auth.uid()) OR 
        is_project_owner(auth.uid(), project_id)
    );

-- Phase items policies
CREATE POLICY "Phase items viewable by all authenticated users"
    ON capex_phase_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Phase items modifiable by admins and project owners"
    ON capex_phase_items FOR ALL
    TO authenticated
    USING (
        is_admin(auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM capex_phase_completion pc
            WHERE pc.id = phase_id
            AND is_project_owner(auth.uid(), pc.project_id)
        )
    )
    WITH CHECK (
        is_admin(auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM capex_phase_completion pc
            WHERE pc.id = phase_id
            AND is_project_owner(auth.uid(), pc.project_id)
        )
    );

-- Thresholds policies
CREATE POLICY "Thresholds viewable by all authenticated users"
    ON capex_thresholds FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Thresholds modifiable by admins only"
    ON capex_thresholds FOR ALL
    TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- System settings policies
CREATE POLICY "System settings viewable by all authenticated users"
    ON capex_system_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "System settings modifiable by admins only"
    ON capex_system_settings FOR ALL
    TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Audit log policies
CREATE POLICY "Audit log viewable by admins only"
    ON capex_audit_log FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "Audit log insertable by all authenticated users"
    ON capex_audit_log FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_project_phases_trigger ON capex_projects;

-- Create trigger to automatically create phases
CREATE TRIGGER create_project_phases_trigger
    AFTER INSERT ON capex_projects
    FOR EACH ROW
    EXECUTE FUNCTION create_project_phases();

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_project_status_trigger ON capex_phase_completion;

-- Create trigger to automatically update project status
CREATE TRIGGER update_project_status_trigger
    AFTER INSERT OR UPDATE OF completion_percentage, weight, is_active
    ON capex_phase_completion
    FOR EACH ROW
    EXECUTE FUNCTION update_project_status(); 