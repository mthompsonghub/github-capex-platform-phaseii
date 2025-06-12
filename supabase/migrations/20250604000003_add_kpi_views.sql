-- Drop existing views if they exist
DROP VIEW IF EXISTS public.project_completion CASCADE;
DROP VIEW IF EXISTS public.target_completion CASCADE;
DROP VIEW IF EXISTS public.project_completion_status CASCADE;

-- Create the completion status view
CREATE OR REPLACE VIEW public.project_completion_status AS
WITH project_metrics AS (
    SELECT 
        ka.project_id,
        p.project_type,
        -- Feasibility metrics
        NULLIF(COUNT(*) FILTER (WHERE ka.risk_assessment_completion IS NOT NULL 
            OR ka.project_charter_completion IS NOT NULL), 0) as feasibility_count,
        SUM(COALESCE(ka.risk_assessment_completion, 0) + 
            COALESCE(ka.project_charter_completion, 0)) as feasibility_sum,
        
        -- Planning metrics
        NULLIF(COUNT(*) FILTER (WHERE ka.rfq_package_completion IS NOT NULL 
            OR ka.validation_strategy_completion IS NOT NULL
            OR ka.financial_forecast_completion IS NOT NULL
            OR ka.vendor_solicitation_completion IS NOT NULL
            OR ka.gantt_chart_completion IS NOT NULL
            OR ka.asset_number_approval_completion IS NOT NULL), 0) as planning_count,
        SUM(COALESCE(ka.rfq_package_completion, 0) + 
            COALESCE(ka.validation_strategy_completion, 0) +
            COALESCE(ka.financial_forecast_completion, 0) +
            COALESCE(ka.vendor_solicitation_completion, 0) +
            COALESCE(ka.gantt_chart_completion, 0) +
            COALESCE(ka.asset_number_approval_completion, 0)) as planning_sum,
            
        -- Execution metrics
        NULLIF(COUNT(*) FILTER (WHERE ka.po_submission_completion IS NOT NULL 
            OR ka.equipment_design_completion IS NOT NULL
            OR ka.equipment_build_completion IS NOT NULL
            OR ka.project_documentation_completion IS NOT NULL
            OR ka.demo_install_completion IS NOT NULL
            OR ka.validation_completion IS NOT NULL
            OR ka.equipment_turnover_completion IS NOT NULL
            OR ka.go_live_completion IS NOT NULL), 0) as execution_count,
        SUM(COALESCE(ka.po_submission_completion, 0) +
            COALESCE(ka.equipment_design_completion, 0) +
            COALESCE(ka.equipment_build_completion, 0) +
            COALESCE(ka.project_documentation_completion, 0) +
            COALESCE(ka.demo_install_completion, 0) +
            COALESCE(ka.validation_completion, 0) +
            COALESCE(ka.equipment_turnover_completion, 0) +
            COALESCE(ka.go_live_completion, 0)) as execution_sum,
            
        -- Close metrics
        NULLIF(COUNT(*) FILTER (WHERE ka.po_closure_completion IS NOT NULL 
            OR ka.project_turnover_completion IS NOT NULL), 0) as close_count,
        SUM(COALESCE(ka.po_closure_completion, 0) +
            COALESCE(ka.project_turnover_completion, 0)) as close_sum
    FROM 
        public.kpi_actuals ka
        JOIN public.projects p ON ka.project_id = p.id
    GROUP BY 
        ka.project_id, p.project_type
)
SELECT
    project_id,
    CASE 
        WHEN project_type = 'project' THEN 
            COALESCE(feasibility_sum / NULLIF(feasibility_count * 2, 0), 0)
        ELSE NULL 
    END as feasibility_status,
    COALESCE(planning_sum / NULLIF(planning_count * 6, 0), 0) as planning_status,
    COALESCE(execution_sum / NULLIF(execution_count * 8, 0), 0) as execution_status,
    COALESCE(close_sum / NULLIF(close_count * 2, 0), 0) as close_status
FROM 
    project_metrics;

-- Create the target completion view
CREATE OR REPLACE VIEW public.target_completion AS
SELECT 
    kt.project_id,
    CASE 
        WHEN CURRENT_DATE < kt.feasibility_start_date THEN 0
        WHEN CURRENT_DATE > kt.close_end_date THEN 100
        ELSE (
            CASE 
                WHEN CURRENT_DATE BETWEEN kt.feasibility_start_date AND kt.feasibility_end_date 
                THEN (EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - kt.feasibility_start_date::timestamp))::float / 
                      NULLIF(EXTRACT(EPOCH FROM (kt.feasibility_end_date::timestamp - kt.feasibility_start_date::timestamp))::float, 0)) * 15
                WHEN CURRENT_DATE BETWEEN kt.planning_start_date AND kt.planning_end_date 
                THEN 15 + (EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - kt.planning_start_date::timestamp))::float / 
                          NULLIF(EXTRACT(EPOCH FROM (kt.planning_end_date::timestamp - kt.planning_start_date::timestamp))::float, 0)) * 35
                WHEN CURRENT_DATE BETWEEN kt.execution_start_date AND kt.execution_end_date 
                THEN 50 + (EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - kt.execution_start_date::timestamp))::float / 
                          NULLIF(EXTRACT(EPOCH FROM (kt.execution_end_date::timestamp - kt.execution_start_date::timestamp))::float, 0)) * 45
                WHEN CURRENT_DATE BETWEEN kt.close_start_date AND kt.close_end_date 
                THEN 95 + (EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - kt.close_start_date::timestamp))::float / 
                          NULLIF(EXTRACT(EPOCH FROM (kt.close_end_date::timestamp - kt.close_start_date::timestamp))::float, 0)) * 5
                ELSE 0
            END
        )
    END as targeted_completion
FROM 
    public.kpi_targets kt;

-- Create the final project completion view
CREATE OR REPLACE VIEW public.project_completion AS
WITH completion_calc AS (
    SELECT 
        cs.project_id,
        (COALESCE(cs.feasibility_status, 1) * pw.feasibility_weight +
         COALESCE(cs.planning_status, 1) * pw.planning_weight +
         COALESCE(cs.execution_status, 1) * pw.execution_weight +
         COALESCE(cs.close_status, 1) * pw.close_weight) * 100 as actual_completion,
        tc.targeted_completion
    FROM 
        public.project_completion_status cs
        JOIN public.phase_weights pw ON cs.project_id = pw.project_id
        LEFT JOIN public.target_completion tc ON cs.project_id = tc.project_id
)
SELECT 
    project_id,
    actual_completion,
    targeted_completion,
    LEAST(
        CASE 
            WHEN COALESCE(targeted_completion, 0) = 0 THEN 0
            ELSE (actual_completion / NULLIF(targeted_completion, 0)) * 100
        END,
        110
    ) as capped_ratio
FROM 
    completion_calc; 