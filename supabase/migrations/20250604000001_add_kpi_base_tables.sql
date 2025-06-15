-- Add project_type to projects if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'project_type'
    ) THEN
        ALTER TABLE public.projects
        ADD COLUMN project_type text CHECK (project_type IN ('project', 'asset_purchase'));
    END IF;
END $$;

-- Add phases_data column to projects if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'phases_data'
    ) THEN
        ALTER TABLE public.projects
        ADD COLUMN phases_data jsonb DEFAULT jsonb_build_object(
            'feasibility', jsonb_build_object(
                'risk_assessment', 0,
                'project_charter', 0
            ),
            'planning', jsonb_build_object(
                'rfq_package', 0,
                'validation_strategy', 0,
                'financial_forecast', 0,
                'vendor_solicitation', 0,
                'gantt_chart', 0,
                'ses_asset_number_approval', 0
            ),
            'execution', jsonb_build_object(
                'po_submission', 0,
                'equipment_design', 0,
                'equipment_build', 0,
                'project_documentation', 0,
                'demo_install', 0,
                'validation', 0,
                'equipment_turnover', 0,
                'go_live', 0
            ),
            'close', jsonb_build_object(
                'po_closure', 0,
                'project_turnover', 0
            )
        );
    END IF;
END $$;

-- Create the phase_weights table
CREATE TABLE IF NOT EXISTS public.phase_weights (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    feasibility_weight DECIMAL DEFAULT 0,
    planning_weight DECIMAL DEFAULT 0,
    execution_weight DECIMAL DEFAULT 0,
    close_weight DECIMAL DEFAULT 0.05,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id),
    CONSTRAINT weights_sum_check CHECK (
        feasibility_weight + planning_weight + execution_weight + close_weight = 1.0
    )
);

-- Create the KPI targets table
CREATE TABLE IF NOT EXISTS public.kpi_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    feasibility_start_date DATE,
    feasibility_end_date DATE,
    planning_start_date DATE,
    planning_end_date DATE,
    execution_start_date DATE,
    execution_end_date DATE,
    close_start_date DATE,
    close_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_feasibility_dates CHECK (feasibility_end_date >= feasibility_start_date),
    CONSTRAINT valid_planning_dates CHECK (planning_end_date >= planning_start_date),
    CONSTRAINT valid_execution_dates CHECK (execution_end_date >= execution_start_date),
    CONSTRAINT valid_close_dates CHECK (close_end_date >= close_start_date)
);

-- Create the KPI actuals table
CREATE TABLE IF NOT EXISTS public.kpi_actuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    yearly_budget DECIMAL,
    yearly_actual DECIMAL,
    risk_assessment_completion DECIMAL CHECK (risk_assessment_completion BETWEEN 0 AND 100),
    project_charter_completion DECIMAL CHECK (project_charter_completion BETWEEN 0 AND 100),
    rfq_package_completion DECIMAL CHECK (rfq_package_completion BETWEEN 0 AND 100),
    validation_strategy_completion DECIMAL CHECK (validation_strategy_completion BETWEEN 0 AND 100),
    financial_forecast_completion DECIMAL CHECK (financial_forecast_completion BETWEEN 0 AND 100),
    vendor_solicitation_completion DECIMAL CHECK (vendor_solicitation_completion BETWEEN 0 AND 100),
    gantt_chart_completion DECIMAL CHECK (gantt_chart_completion BETWEEN 0 AND 100),
    asset_number_approval_completion DECIMAL CHECK (asset_number_approval_completion BETWEEN 0 AND 100),
    po_submission_completion DECIMAL CHECK (po_submission_completion BETWEEN 0 AND 100),
    equipment_design_completion DECIMAL CHECK (equipment_design_completion BETWEEN 0 AND 100),
    equipment_build_completion DECIMAL CHECK (equipment_build_completion BETWEEN 0 AND 100),
    project_documentation_completion DECIMAL CHECK (project_documentation_completion BETWEEN 0 AND 100),
    demo_install_completion DECIMAL CHECK (demo_install_completion BETWEEN 0 AND 100),
    validation_completion DECIMAL CHECK (validation_completion BETWEEN 0 AND 100),
    equipment_turnover_completion DECIMAL CHECK (equipment_turnover_completion BETWEEN 0 AND 100),
    go_live_completion DECIMAL CHECK (go_live_completion BETWEEN 0 AND 100),
    po_closure_completion DECIMAL CHECK (po_closure_completion BETWEEN 0 AND 100),
    project_turnover_completion DECIMAL CHECK (project_turnover_completion BETWEEN 0 AND 100),
    upcoming_milestone TEXT,
    comment_risk TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.phase_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_actuals ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Enable read access for authenticated users"
    ON public.phase_weights FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users"
    ON public.kpi_targets FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users"
    ON public.kpi_actuals FOR SELECT
    TO authenticated
    USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kpi_targets_project_id ON public.kpi_targets(project_id);
CREATE INDEX IF NOT EXISTS idx_kpi_actuals_project_id ON public.kpi_actuals(project_id); 