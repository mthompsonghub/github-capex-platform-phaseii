import { z } from 'zod';

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

// Default thresholds
const DEFAULT_THRESHOLDS = {
  ON_TRACK: 0.9,   // >= 90% of target
  AT_RISK: 0.8,    // >= 80% but < 90% of target
  IMPACTED: 0      // < 80% of target
} as const;

// Get thresholds from localStorage or use defaults
const getStoredThresholds = () => {
  const stored = localStorage.getItem('capex_status_thresholds');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Validate stored values
      if (typeof parsed.AT_RISK === 'number' && 
          typeof parsed.ON_TRACK === 'number' &&
          parsed.AT_RISK > 0 && 
          parsed.AT_RISK < parsed.ON_TRACK && 
          parsed.ON_TRACK < 1) {
        return parsed;
      }
    } catch (e) {
      console.warn('Invalid stored thresholds, using defaults');
    }
  }
  return DEFAULT_THRESHOLDS;
};

// Export current thresholds
export const STATUS_THRESHOLDS = getStoredThresholds();

// Function to update thresholds
export const updateStatusThresholds = (
  impactedThreshold: number,
  atRiskThreshold: number
): boolean => {
  // Validate thresholds
  if (impactedThreshold >= 0 && 
      impactedThreshold < atRiskThreshold && 
      atRiskThreshold < 1) {
    const newThresholds = {
      ON_TRACK: atRiskThreshold,
      AT_RISK: impactedThreshold,
      IMPACTED: 0
    };
    
    // Save to localStorage
    localStorage.setItem('capex_status_thresholds', JSON.stringify(newThresholds));
    
    // Update current thresholds
    Object.assign(STATUS_THRESHOLDS, newThresholds);
    
    return true;
  }
  return false;
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

  let totalWeight = 0;
  let weightedCompletion = 0;

  // Calculate weighted sum of phase completions
  Object.entries(phases).forEach(([phaseName, phase]) => {
    const weight = phaseWeights[phaseName as keyof typeof phaseWeights];
    if (weight > 0) {
      totalWeight += weight;
      weightedCompletion += (phase.completion * weight);
    }
  });

  return totalWeight > 0 ? weightedCompletion / totalWeight : 0;
};

export const determineProjectStatus = (
  actualCompletion: number,
  targetCompletion: number
): Project['projectStatus'] => {
  if (targetCompletion === 0) return 'On Track';
  
  const ratio = actualCompletion / targetCompletion;
  
  if (ratio >= STATUS_THRESHOLDS.ON_TRACK) return 'On Track';
  if (ratio >= STATUS_THRESHOLDS.AT_RISK) return 'At Risk';
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