// types/capex-unified.ts - Single source of truth for all CapEx types

// Base types
export type ProjectType = 'Complex Project' | 'Asset Purchase';
export type ProjectStatus = 'On Track' | 'At Risk' | 'Impacted';

// Phase item structure
export interface PhaseItem {
  id?: string;
  name: string;
  value: number | string;
  isNA?: boolean;
  description?: string;
}

// Phase structure
export interface Phase {
  id: string;
  name: string;
  weight: number;
  completion: number;
  items: PhaseItem[];
}

// Main project interface
export interface CapexProject {
  // Core fields
  id: string;
  name: string;
  type: ProjectType;
  owner: string;
  status: ProjectStatus;
  
  // Financial fields
  budget: number;
  spent: number;
  
  // Timeline fields
  startDate?: Date | string;
  endDate?: Date | string;
  timeline?: string;
  
  // Progress fields
  overallCompletion: number;
  phases: {
    feasibility?: Phase;
    planning?: Phase;
    execution?: Phase;
    close?: Phase;
  };
  
  // Additional fields
  upcomingMilestone?: string;
  sesNumber?: string;
  financialNotes?: string;
  comments?: string;
  
  // Schedule adherence (for new feature)
  feasibilityStartDate?: string;
  feasibilityEndDate?: string;
  planningStartDate?: string;
  planningEndDate?: string;
  executionStartDate?: string;
  executionEndDate?: string;
  closeStartDate?: string;
  closeEndDate?: string;
  scheduleAdherence?: {
    overall: number;
    byPhase: {
      feasibility: number;
      planning: number;
      execution: number;
      close: number;
    };
  };
  
  // Metadata
  lastUpdated?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Database record interface (snake_case)
export interface CapexProjectDB {
  id: string;
  project_name: string;
  project_type: string | null;
  owner_name: string;
  project_status: string | null;
  total_budget: number;
  total_actual: number;
  overall_completion: number | null;
  phases_data: string | null;
  
  // Optional fields
  start_date: string | null | undefined;
  end_date: string | null | undefined;
  timeline: string | null | undefined;
  upcoming_milestone: string | null | undefined;
  ses_number: string | null | undefined;
  financial_notes: string | null | undefined;
  comments: string | null | undefined;
  
  // Phase dates
  feasibility_start_date: string | null | undefined;
  feasibility_end_date: string | null | undefined;
  planning_start_date: string | null | undefined;
  planning_end_date: string | null | undefined;
  execution_start_date: string | null | undefined;
  execution_end_date: string | null | undefined;
  close_start_date: string | null | undefined;
  close_end_date: string | null | undefined;
  
  // Metadata
  created_at: string | null | undefined;
  updated_at: string | null | undefined;
}

// Admin settings
export interface AdminSettings {
  thresholds: {
    onTrack: number;
    atRisk: number;
  };
  phaseWeights: {
    complexProject: {
      feasibility: number;
      planning: number;
      execution: number;
      close: number;
    };
    assetPurchase: {
      planning: number;
      execution: number;
      close: number;
    };
  };
}

// Default phase weights
export const DEFAULT_PHASE_WEIGHTS = {
  complexProject: {
    feasibility: 15,
    planning: 35,
    execution: 45,
    close: 5
  },
  assetPurchase: {
    feasibility: 0,
    planning: 45,
    execution: 50,
    close: 5
  }
};

// Helper type guards
export function isComplexProject(project: CapexProject): boolean {
  return project.type === 'Complex Project';
}

export function isAssetPurchase(project: CapexProject): boolean {
  return project.type === 'Asset Purchase';
}

// Legacy type aliases (for backward compatibility during migration)
export type CapExRecord = CapexProjectDB;
export type SubItem = PhaseItem;

// Additional types
export interface ProjectOwner {
  id: string;
  name: string;
  email?: string;
}

export interface ScheduleAdherence {
  overall: number;
  byPhase: {
    feasibility: number;
    planning: number;
    execution: number;
    close: number;
  };
}

export interface ModalState<T = any> {
  isOpen: boolean;
  data: T | null;
}

export interface StatusPercentage {
  onTrack: number;
  atRisk: number;
  impacted: number;
}

export const STATUS_PERCENTAGES: StatusPercentage = {
  onTrack: 90,
  atRisk: 80,
  impacted: 0
};

export type ProjectSection = 'projects' | 'asset_purchases';

export interface PhaseField {
  name: string;
  field: string;
  type: 'percentage' | 'boolean';
}

export interface YearlyFinancials {
  year: number;
  budget: number;
  actual: number;
  spent: number;
}

// Helper function to convert between phase structures
export function convertPhaseItemsToArray(subItems: Record<string, any>): PhaseItem[] {
  return Object.entries(subItems).map(([key, item]) => ({
    name: item.name || key,
    value: typeof item === 'object' ? (item.value ?? item.actual ?? item.target ?? 0) : item,
    isNA: item.isNA ?? false
  }));
}

export function convertPhaseItemsToObject(items: PhaseItem[]): Record<string, any> {
  const result: Record<string, any> = {};
  items.forEach(item => {
    const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    result[key] = {
      name: item.name,
      value: item.value,
      isNA: item.isNA
    };
  });
  return result;
}

// Type guard for ProjectType
export function isValidProjectType(type: string): type is ProjectType {
  return type === 'Complex Project' || type === 'Asset Purchase';
} 