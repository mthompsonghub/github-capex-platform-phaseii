-- Add project_manager to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'project_manager'; 