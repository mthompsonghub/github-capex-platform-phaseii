-- Drop existing triggers first
DROP TRIGGER IF EXISTS set_phase_weights_on_insert ON public.phase_weights;
DROP TRIGGER IF EXISTS create_phase_weights_on_project_insert ON public.projects;
DROP TRIGGER IF EXISTS handle_kpi_targets_updated_at ON public.kpi_targets;
DROP TRIGGER IF EXISTS handle_kpi_actuals_updated_at ON public.kpi_actuals;
DROP TRIGGER IF EXISTS handle_phase_weights_updated_at ON public.phase_weights;

-- Drop existing functions (but not handle_updated_at since it's used by other tables)
DROP FUNCTION IF EXISTS public.set_phase_weights();
DROP FUNCTION IF EXISTS public.create_phase_weights_for_project();

-- Create function to set weights based on project type
CREATE OR REPLACE FUNCTION public.set_phase_weights()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the project type from the projects table
    SELECT project_type INTO NEW.project_type
    FROM public.projects
    WHERE id = NEW.project_id;

    IF NEW.project_type = 'project' THEN
        NEW.feasibility_weight := 0.15;
        NEW.planning_weight := 0.35;
        NEW.execution_weight := 0.45;
        NEW.close_weight := 0.05;
    ELSE -- asset_purchase
        NEW.feasibility_weight := 0.00;
        NEW.planning_weight := 0.45;
        NEW.execution_weight := 0.50;
        NEW.close_weight := 0.05;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set weights on insert
CREATE TRIGGER set_phase_weights_on_insert
    BEFORE INSERT ON public.phase_weights
    FOR EACH ROW
    EXECUTE FUNCTION public.set_phase_weights();

-- Create function to automatically create phase weights when a project is created
CREATE OR REPLACE FUNCTION public.create_phase_weights_for_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create phase weights if they don't already exist
    IF NOT EXISTS (SELECT 1 FROM public.phase_weights WHERE project_id = NEW.id) THEN
        INSERT INTO public.phase_weights (project_id)
        VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create phase weights
CREATE TRIGGER create_phase_weights_on_project_insert
    AFTER INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.create_phase_weights_for_project();

-- Create triggers for KPI tables using existing handle_updated_at function
CREATE TRIGGER handle_kpi_targets_updated_at
    BEFORE UPDATE ON public.kpi_targets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_kpi_actuals_updated_at
    BEFORE UPDATE ON public.kpi_actuals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_phase_weights_updated_at
    BEFORE UPDATE ON public.phase_weights
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 