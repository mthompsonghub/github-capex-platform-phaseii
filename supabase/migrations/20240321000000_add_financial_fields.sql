-- Add financial fields to capex_projects table
ALTER TABLE capex_projects 
ADD COLUMN IF NOT EXISTS ses_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS upcoming_milestone TEXT,
ADD COLUMN IF NOT EXISTS milestone_due_date DATE,
ADD COLUMN IF NOT EXISTS financial_notes TEXT;

-- Add sample data for testing
UPDATE capex_projects 
SET 
  ses_number = CASE 
    WHEN project_name LIKE '%Capital IT Server%' THEN 'SES-2024-003'
    WHEN project_name LIKE '%Cardinal%' THEN 'SES-2024-001'
    WHEN project_name LIKE '%DeltaV%' THEN 'SES-2024-002'
    ELSE NULL
  END,
  upcoming_milestone = CASE 
    WHEN project_name LIKE '%Capital IT Server%' THEN 'Validation Testing'
    WHEN project_name LIKE '%Cardinal%' THEN 'Equipment Installation'
    WHEN project_name LIKE '%DeltaV%' THEN 'Vendor Selection'
    ELSE NULL
  END,
  milestone_due_date = CASE 
    WHEN project_name LIKE '%Capital IT Server%' THEN '2024-06-30'
    WHEN project_name LIKE '%Cardinal%' THEN '2024-05-15'
    WHEN project_name LIKE '%DeltaV%' THEN '2024-04-30'
    ELSE NULL
  END,
  financial_notes = CASE 
    WHEN project_name LIKE '%Capital IT Server%' THEN 'Budget on track, awaiting final vendor quotes'
    WHEN project_name LIKE '%Cardinal%' THEN 'Additional funding may be required for equipment upgrades'
    WHEN project_name LIKE '%DeltaV%' THEN 'Cost savings identified in implementation phase'
    ELSE NULL
  END
WHERE ses_number IS NULL; 