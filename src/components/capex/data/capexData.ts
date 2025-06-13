import { z } from 'zod';
import { CapExRecord } from '../../../types/capex';

// TypeScript Interfaces
export interface SubItem {
  id: string;
  name: string;
  value: number;
  isNA: boolean;
  description?: string;
}

export interface PhaseProgress {
  id: string;
  name: string;
  weight: number;
  subItems: SubItem[];
  completion: number;
}

export interface ProjectType {
  id: string;
  name: string;
  phaseWeights: {
    feasibility: number;
    planning: number;
    execution: number;
    close: number;
  };
}

export interface Project {
  id: string;
  projectName: string;
  projectOwner: string;
  startDate: Date;
  endDate: Date;
  projectType: ProjectType;
  totalBudget: number;
  totalActual: number;
  projectStatus: 'On Track' | 'At Risk' | 'Impacted';
  phases: {
    feasibility: PhaseProgress;
    planning: PhaseProgress;
    execution: PhaseProgress;
    close: PhaseProgress;
  };
  comments?: string;
  lastUpdated: Date;
}

// Zod Schema for Runtime Type Validation
export const SubItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number().min(0).max(100),
  isNA: z.boolean(),
  description: z.string().optional()
});

export const PhaseProgressSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().min(0).max(100),
  subItems: z.array(SubItemSchema),
  completion: z.number().min(0).max(100)
});

export const ProjectTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  phaseWeights: z.object({
    feasibility: z.number().min(0).max(100),
    planning: z.number().min(0).max(100),
    execution: z.number().min(0).max(100),
    close: z.number().min(0).max(100)
  })
});

export const ProjectSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  projectOwner: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  projectType: ProjectTypeSchema,
  totalBudget: z.number().min(0),
  totalActual: z.number().min(0),
  projectStatus: z.enum(['On Track', 'At Risk', 'Impacted']),
  phases: z.object({
    feasibility: PhaseProgressSchema,
    planning: PhaseProgressSchema,
    execution: PhaseProgressSchema,
    close: PhaseProgressSchema
  }),
  comments: z.string().optional(),
  lastUpdated: z.date()
});

// Constants
export const PROJECT_TYPES: Record<string, ProjectType> = {
  PROJECTS: {
    id: 'projects',
    name: 'Projects',
    phaseWeights: {
      feasibility: 15,
      planning: 35,
      execution: 45,
      close: 5
    }
  },
  ASSET_PURCHASES: {
    id: 'asset_purchases',
    name: 'Asset Purchases',
    phaseWeights: {
      feasibility: 0,
      planning: 45,
      execution: 50,
      close: 5
    }
  }
} as const;

export const PHASE_SUB_ITEMS = {
  feasibility: [
    { 
      id: 'risk_assessment', 
      name: 'Risk Assessment',
      description: 'Evaluate project risks and mitigation strategies'
    },
    { 
      id: 'project_charter', 
      name: 'Project Charter',
      description: 'Define project scope, objectives, and success criteria'
    }
  ],
  planning: [
    { 
      id: 'rfq_package', 
      name: 'RFQ Package',
      description: 'Prepare and finalize Request for Quotation documentation'
    },
    { 
      id: 'validation_strategy', 
      name: 'Validation Strategy',
      description: 'Define validation approach and requirements'
    },
    { 
      id: 'financial_forecast', 
      name: 'Financial Forecast',
      description: 'Project cost estimates and financial planning'
    },
    { 
      id: 'vendor_solicitation', 
      name: 'Vendor Solicitation',
      description: 'Identify and evaluate potential vendors'
    },
    { 
      id: 'gantt_chart', 
      name: 'Gantt Chart',
      description: 'Detailed project timeline and dependencies'
    },
    { 
      id: 'ses_asset_number', 
      name: 'SES Asset Number Approval',
      description: 'Obtain required asset number approvals'
    }
  ],
  execution: [
    { 
      id: 'po_submission', 
      name: 'PO Submission',
      description: 'Submit and process Purchase Orders'
    },
    { 
      id: 'equipment_design', 
      name: 'Equipment Design',
      description: 'Finalize equipment specifications and design'
    },
    { 
      id: 'equipment_build', 
      name: 'Equipment Build',
      description: 'Equipment manufacturing and assembly'
    },
    { 
      id: 'project_documentation', 
      name: 'Project Documentation/SOP',
      description: 'Create Standard Operating Procedures and documentation'
    },
    { 
      id: 'demo_install', 
      name: 'Demo/Install',
      description: 'Equipment installation and demonstration'
    },
    { 
      id: 'validation', 
      name: 'Validation',
      description: 'Validate equipment performance and functionality'
    },
    { 
      id: 'equipment_turnover', 
      name: 'Equipment Turnover/Training',
      description: 'Train operators and hand over equipment'
    },
    { 
      id: 'go_live', 
      name: 'Go-Live',
      description: 'Begin production operations'
    }
  ],
  close: [
    { 
      id: 'po_closure', 
      name: 'PO Closure',
      description: 'Complete all purchase order requirements'
    },
    { 
      id: 'project_turnover', 
      name: 'Project Turnover',
      description: 'Final project handover and documentation'
    }
  ]
} as const;

// Status Thresholds
export interface ThresholdSettings {
  onTrackThreshold: number;
  atRiskThreshold: number;
  impactedThreshold: number;
}

export const defaultSettings: ThresholdSettings = {
  onTrackThreshold: 100,
  atRiskThreshold: 85,
  impactedThreshold: 70
};

export const getStoredThresholds = (): ThresholdSettings => {
  try {
    const stored = localStorage.getItem('statusThresholds');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        onTrackThreshold: Number(parsed.onTrackThreshold) || defaultSettings.onTrackThreshold,
        atRiskThreshold: Number(parsed.atRiskThreshold) || defaultSettings.atRiskThreshold,
        impactedThreshold: Number(parsed.impactedThreshold) || defaultSettings.impactedThreshold
      };
    }
  } catch (error) {
    console.error('Error reading thresholds from storage:', error);
  }
  return defaultSettings;
};

export const updateStatusThresholds = (
  onTrackThreshold: number,
  atRiskThreshold: number,
  impactedThreshold: number
): boolean => {
  try {
    const thresholds: ThresholdSettings = {
      onTrackThreshold,
      atRiskThreshold,
      impactedThreshold
    };
    localStorage.setItem('statusThresholds', JSON.stringify(thresholds));
    return true;
  } catch (error) {
    console.error('Error updating thresholds:', error);
    return false;
  }
};

// Helper Functions
export const calculatePhaseCompletion = (subItems: SubItem[]): number => {
  const validItems = subItems.filter(item => !item.isNA);
  if (validItems.length === 0) return 0;

  const totalValue = validItems.reduce((sum, item) => sum + item.value, 0);
  return totalValue / validItems.length;
};

export const calculateOverallCompletion = (project: Project): number => {
  const { phases, projectType } = project;
  const { phaseWeights } = projectType;

  const feasibilityCompletion = phases.feasibility.completion * (phaseWeights.feasibility / 100);
  const planningCompletion = phases.planning.completion * (phaseWeights.planning / 100);
  const executionCompletion = phases.execution.completion * (phaseWeights.execution / 100);
  const closeCompletion = phases.close.completion * (phaseWeights.close / 100);

  return Math.round(feasibilityCompletion + planningCompletion + executionCompletion + closeCompletion);
};

export const calculateOverallCompletionForBoth = (project: Project | CapExRecord): number => {
  if ('phases' in project) {
    return calculateOverallCompletion(project);
  } else {
    return project.actual_project_completion;
  }
};

export const determineProjectStatus = (
  actualCompletion: number,
  targetCompletion: number,
  onTrackThreshold: number = defaultSettings.onTrackThreshold,
  atRiskThreshold: number = defaultSettings.atRiskThreshold
): Project['projectStatus'] => {
  const ratio = actualCompletion / targetCompletion;
  
  if (ratio >= onTrackThreshold) return 'On Track';
  if (ratio >= atRiskThreshold) return 'At Risk';
  return 'Impacted';
};

export const createEmptyPhase = (
  id: string,
  name: string,
  weight: number,
  subItems: typeof PHASE_SUB_ITEMS[keyof typeof PHASE_SUB_ITEMS]
): PhaseProgress => ({
  id,
  name,
  weight,
  completion: 0,
  subItems: subItems.map(item => ({
    id: item.id,
    name: item.name,
    value: 0,
    isNA: false
  }))
});

export const createEmptyProject = (
  id: string,
  type: ProjectType = PROJECT_TYPES.PROJECTS
): Project => ({
  id,
  projectName: '',
  projectOwner: '',
  startDate: new Date(),
  endDate: new Date(),
  projectType: type,
  totalBudget: 0,
  totalActual: 0,
  projectStatus: 'On Track',
  phases: {
    feasibility: createEmptyPhase('feasibility', 'Feasibility', type.phaseWeights.feasibility, PHASE_SUB_ITEMS.feasibility),
    planning: createEmptyPhase('planning', 'Planning', type.phaseWeights.planning, PHASE_SUB_ITEMS.planning),
    execution: createEmptyPhase('execution', 'Execution', type.phaseWeights.execution, PHASE_SUB_ITEMS.execution),
    close: createEmptyPhase('close', 'Close', type.phaseWeights.close, PHASE_SUB_ITEMS.close)
  },
  lastUpdated: new Date()
}); 