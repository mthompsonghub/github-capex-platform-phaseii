import { z } from 'zod';
import { CapExRecord } from '../../../types/capex';
import { convertCapExRecordToProject } from '../../../utils/projectUtils';

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
  upcomingMilestone?: string;
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
  upcomingMilestone: z.string().optional(),
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

export const calculateOverallCompletion = (
  phases: Project['phases'], 
  projectType: ProjectType
): number => {
  // Safety check for phases object
  if (!phases || typeof phases !== 'object') {
    console.warn('calculateOverallCompletion: phases is null or undefined');
    return 0;
  }

  // Safety check for projectType
  if (!projectType || !projectType.phaseWeights) {
    console.warn('calculateOverallCompletion: projectType or phaseWeights is null or undefined');
    return 0;
  }

  try {
    let totalWeightedCompletion = 0;
    let totalWeight = 0;

    // Phase names that should exist
    const phaseNames: (keyof typeof phases)[] = ['feasibility', 'planning', 'execution', 'close'];

    for (const phaseName of phaseNames) {
      // Safety check for each phase
      if (!phases[phaseName]) {
        console.warn(`calculateOverallCompletion: ${phaseName} phase is missing or null`);
        continue;
      }

      const phase = phases[phaseName];
      const phaseWeight = projectType.phaseWeights[phaseName];

      // Safety check for phase weight
      if (typeof phaseWeight !== 'number' || isNaN(phaseWeight)) {
        console.warn(`calculateOverallCompletion: ${phaseName} weight is invalid:`, phaseWeight);
        continue;
      }

      // Safety check for phase completion
      let phaseCompletion = 0;
      if (typeof phase.completion === 'number' && !isNaN(phase.completion)) {
        phaseCompletion = phase.completion;
      } else {
        console.warn(`calculateOverallCompletion: ${phaseName} completion is invalid:`, phase.completion);
        // Try to calculate from sub-items if completion is missing
        if (phase.subItems && Array.isArray(phase.subItems)) {
          phaseCompletion = calculatePhaseCompletionFromSubItems(phase.subItems);
        }
      }

      totalWeightedCompletion += (phaseCompletion * phaseWeight);
      totalWeight += phaseWeight;
    }

    // Avoid division by zero
    if (totalWeight === 0) {
      console.warn('calculateOverallCompletion: total weight is 0');
      return 0;
    }

    const result = totalWeightedCompletion / totalWeight;
    
    // Ensure result is a valid number between 0 and 100
    if (isNaN(result)) {
      console.warn('calculateOverallCompletion: result is NaN');
      return 0;
    }

    return Math.max(0, Math.min(100, result));

  } catch (error) {
    console.error('calculateOverallCompletion: Unexpected error:', error);
    return 0;
  }
};

// Helper function to calculate phase completion from sub-items
const calculatePhaseCompletionFromSubItems = (subItems: any[]): number => {
  if (!Array.isArray(subItems) || subItems.length === 0) {
    return 0;
  }

  const validItems = subItems.filter(item => 
    item && 
    typeof item.value === 'number' && 
    !item.isNA && 
    !isNaN(item.value)
  );

  if (validItems.length === 0) {
    return 0;
  }

  const total = validItems.reduce((sum, item) => sum + item.value, 0);
  return total / validItems.length;
};

// Add calculateOverallCompletionForBoth
export const calculateOverallCompletionForBoth = (project: Project | CapExRecord): number => {
  try {
    if ('phases' in project) {
      // This is a Project type
      return calculateOverallCompletion(project.phases, project.projectType);
    } else {
      // This is a CapExRecord type - convert to Project first
      const convertedProject = convertCapExRecordToProject(project);
      return calculateOverallCompletion(convertedProject.phases, convertedProject.projectType);
    }
  } catch (error) {
    console.error('calculateOverallCompletionForBoth error:', error);
    return 0;
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