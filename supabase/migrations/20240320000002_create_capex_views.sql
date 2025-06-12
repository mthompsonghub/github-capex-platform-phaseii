-- Drop existing views if they exist
DROP VIEW IF EXISTS capex_project_statistics;
DROP MATERIALIZED VIEW IF EXISTS capex_performance_metrics;

-- Create view for project overview
CREATE OR REPLACE VIEW capex_project_overview AS
SELECT 
    p.id,
    p.project_name,
    p.project_owner,
    p.project_type,
    p.start_date,
    p.end_date,
    p.total_budget,
    p.total_actual,
    p.project_status,
    p.upcoming_milestone,
    COALESCE(
        SUM(pc.completion_percentage * pc.weight) / NULLIF(SUM(CASE WHEN pc.is_active THEN pc.weight ELSE 0 END), 0),
        0
    )::INTEGER as actual_completion,
    CASE
        WHEN p.total_budget > 0 THEN 
            ROUND((p.total_actual / p.total_budget * 100)::numeric, 2)
        ELSE 0
    END as budget_utilization,
    p.created_at,
    p.updated_at,
    u.email as created_by_email,
    u2.email as updated_by_email
FROM capex_projects p
LEFT JOIN capex_phase_completion pc ON p.id = pc.project_id
LEFT JOIN auth.users u ON p.created_by = u.id
LEFT JOIN auth.users u2 ON p.updated_by = u2.id
GROUP BY p.id, u.email, u2.email;

-- Create view for phase details
CREATE OR REPLACE VIEW capex_phase_details AS
SELECT 
    pc.id as phase_id,
    p.id as project_id,
    p.project_name,
    pc.phase_type,
    pc.completion_percentage,
    pc.target_percentage,
    pc.weight,
    pc.is_active,
    COUNT(pi.id) as total_items,
    COUNT(CASE WHEN pi.is_na THEN NULL ELSE pi.id END) as active_items,
    COALESCE(AVG(CASE WHEN NOT pi.is_na THEN pi.completion_percentage END), 0)::INTEGER as avg_item_completion
FROM capex_phase_completion pc
JOIN capex_projects p ON pc.project_id = p.id
LEFT JOIN capex_phase_items pi ON pc.id = pi.phase_id
GROUP BY pc.id, p.id, p.project_name;

-- Create function to get project completion history
CREATE OR REPLACE FUNCTION get_project_completion_history(project_id UUID)
RETURNS TABLE (
    date_point DATE,
    completion_percentage INTEGER,
    status project_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (a.performed_at AT TIME ZONE 'UTC')::DATE as date_point,
        (a.action_details->>'completion_percentage')::INTEGER as completion_percentage,
        (a.action_details->>'status')::project_status as status
    FROM capex_audit_log a
    WHERE a.project_id = $1
    AND a.action_type = 'status_update'
    ORDER BY a.performed_at;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate project metrics
CREATE OR REPLACE FUNCTION calculate_project_metrics(project_id UUID)
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_status TEXT
) AS $$
DECLARE
    project_data RECORD;
    completion_rate NUMERIC;
    days_elapsed INTEGER;
    days_total INTEGER;
BEGIN
    -- Get project data
    SELECT * INTO project_data 
    FROM capex_projects 
    WHERE id = project_id;

    -- Calculate time metrics
    days_elapsed := EXTRACT(DAY FROM (CURRENT_DATE - project_data.start_date));
    days_total := EXTRACT(DAY FROM (project_data.end_date - project_data.start_date));
    
    -- Return completion rate
    completion_rate := COALESCE(
        (SELECT actual_completion::NUMERIC FROM capex_project_overview WHERE id = project_id),
        0
    );
    RETURN QUERY SELECT 
        'Completion Rate'::TEXT,
        completion_rate,
        CASE 
            WHEN completion_rate >= 90 THEN 'Good'
            WHEN completion_rate >= 70 THEN 'Warning'
            ELSE 'Critical'
        END;

    -- Return schedule performance
    RETURN QUERY SELECT 
        'Schedule Performance'::TEXT,
        CASE 
            WHEN days_total = 0 THEN 0
            ELSE ROUND((days_elapsed::NUMERIC / days_total * 100)::numeric, 2)
        END,
        CASE 
            WHEN days_elapsed <= days_total THEN 'On Schedule'
            ELSE 'Delayed'
        END;

    -- Return budget performance
    RETURN QUERY SELECT 
        'Budget Performance'::TEXT,
        CASE 
            WHEN project_data.total_budget = 0 THEN 0
            ELSE ROUND((project_data.total_actual / project_data.total_budget * 100)::numeric, 2)
        END,
        CASE 
            WHEN project_data.total_actual <= project_data.total_budget THEN 'Within Budget'
            ELSE 'Over Budget'
        END;
END;
$$ LANGUAGE plpgsql;

-- Create view for project statistics
CREATE VIEW capex_project_statistics AS
SELECT
    p.id,
    p.project_name,
    p.project_owner,
    p.project_type::capex_project_type,
    p.project_status::capex_status,
    p.start_date,
    p.end_date,
    p.total_budget,
    p.total_actual,
    COALESCE(
        SUM(pc.completion_percentage * pc.weight) / NULLIF(SUM(CASE WHEN pc.is_active THEN pc.weight ELSE 0 END), 0),
        0
    )::INTEGER as overall_completion,
    jsonb_agg(
        jsonb_build_object(
            'phase', pc.phase_type::capex_phase_type,
            'completion', pc.completion_percentage,
            'target', pc.target_percentage,
            'weight', pc.weight,
            'is_active', pc.is_active
        )
    ) as phase_details
FROM capex_projects p
LEFT JOIN capex_phase_completion pc ON p.id = pc.project_id
GROUP BY p.id, p.project_name, p.project_owner, p.project_type, p.project_status, p.start_date, p.end_date, p.total_budget, p.total_actual;

-- Create materialized view for project performance metrics
CREATE MATERIALIZED VIEW capex_performance_metrics AS
WITH project_completions AS (
    SELECT 
        p.id,
        p.project_type,
        p.project_status,
        p.total_budget,
        p.total_actual,
        COALESCE(
            SUM(pc.completion_percentage * pc.weight) / NULLIF(SUM(CASE WHEN pc.is_active THEN pc.weight ELSE 0 END), 0),
            0
        )::INTEGER as completion_percentage
    FROM capex_projects p
    LEFT JOIN capex_phase_completion pc ON p.id = pc.project_id
    GROUP BY p.id, p.project_type, p.project_status, p.total_budget, p.total_actual
)
SELECT
    project_type::capex_project_type,
    project_status::capex_status,
    COUNT(*) as project_count,
    AVG(completion_percentage)::INTEGER as avg_completion,
    SUM(total_budget) as total_budget_allocated,
    SUM(total_actual) as total_actual_spent,
    AVG(
        CASE 
            WHEN total_budget > 0 
            THEN (total_actual / total_budget * 100)::INTEGER 
            ELSE 0 
        END
    ) as avg_budget_utilization
FROM project_completions
GROUP BY project_type, project_status;

-- Create index on materialized view
DROP INDEX IF EXISTS idx_performance_metrics;
CREATE UNIQUE INDEX idx_performance_metrics ON capex_performance_metrics (project_type, project_status);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY capex_performance_metrics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS refresh_performance_metrics_trigger ON capex_projects;

-- Create trigger to refresh materialized view
CREATE TRIGGER refresh_performance_metrics_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON capex_projects
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_performance_metrics();

-- Create function to get project phase history
CREATE OR REPLACE FUNCTION get_project_phase_history(project_id UUID)
RETURNS TABLE (
    phase capex_phase_type,
    action_type TEXT,
    old_completion INTEGER,
    new_completion INTEGER,
    changed_at TIMESTAMPTZ,
    changed_by TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (action_details->>'phase_type')::capex_phase_type as phase,
        action_details->>'action' as action_type,
        (action_details->>'old_completion')::INTEGER as old_completion,
        (action_details->>'new_completion')::INTEGER as new_completion,
        performed_at as changed_at,
        auth.users.email as changed_by
    FROM capex_audit_log
    JOIN auth.users ON capex_audit_log.performed_by = auth.users.id
    WHERE capex_audit_log.project_id = get_project_phase_history.project_id
    AND action_details->>'phase_type' IS NOT NULL
    ORDER BY performed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to refresh project statistics
CREATE OR REPLACE FUNCTION refresh_project_statistics()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY capex_project_statistics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh statistics
CREATE TRIGGER refresh_project_statistics_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON capex_projects
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_project_statistics(); 