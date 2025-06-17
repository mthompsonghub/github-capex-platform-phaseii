import { z } from 'zod';
import { CapExRecord } from '../../../types/capex';
import { useCapExStore } from '../../../stores/capexStore';

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

// Detailed sub-item interfaces
export interface DetailedSubItem {
  name: string;
  value: number; // 0-100 percentage
  isNA: boolean;
  target?: number; // target percentage (optional)
}

// Base interface for detailed phases
export interface DetailedPhase {
  id: string;
  name: string;
  weight: number;
  completion: number;
}

export interface FeasibilityPhase extends DetailedPhase {
  subItems: {
    riskAssessment: DetailedSubItem;
    projectCharter: DetailedSubItem;
  };
}

export interface PlanningPhase extends DetailedPhase {
  subItems: {
    rfqPackage: DetailedSubItem;
    validationStrategy: DetailedSubItem;
    financialForecast: DetailedSubItem;
    vendorSolicitation: DetailedSubItem;
    ganttChart: DetailedSubItem;
    sesAssetNumberApproval: DetailedSubItem;
  };
}

export interface ExecutionPhase extends DetailedPhase {
  subItems: {
    poSubmission: DetailedSubItem;
    equipmentDesign: DetailedSubItem;
    equipmentBuild: DetailedSubItem;
    projectDocumentation: DetailedSubItem;
    demoInstall: DetailedSubItem;
    validation: DetailedSubItem;
    equipmentTurnover: DetailedSubItem;
    goLive: DetailedSubItem;
  };
}

export interface ClosePhase extends DetailedPhase {
  subItems: {
    poClosure: DetailedSubItem;
    projectTurnover: DetailedSubItem;
  };
}

// Updated Project phases interface
export interface DetailedPhases {
  feasibility: FeasibilityPhase;
  planning: PlanningPhase;
  execution: ExecutionPhase;
  close: ClosePhase;
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
    feasibility: FeasibilityPhase;
    planning: PlanningPhase;
    execution: ExecutionPhase;
    close: ClosePhase;
  };
  comments?: string;
  lastUpdated: Date;
  sesNumber?: string;
  upcomingMilestone?: string;
  milestoneDueDate?: Date;
  financialNotes?: string;
  
  // Additional fields for CapexProject compatibility
  name: string;
  owner: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  overallCompletion: number;
  timeline?: string;
  milestones?: {
    feasibility: string;
    planning: string;
    execution: string;
    close: string;
  };
}

// Zod Schema for Runtime Type Validation
export const SubItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number().min(0).max(100),
  isNA: z.boolean(),
  description: z.string().optional()
});

export const DetailedSubItemSchema = z.object({
  name: z.string(),
  value: z.number().min(0).max(100),
  isNA: z.boolean(),
  target: z.number().min(0).max(100).optional()
});

export const DetailedPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().min(0).max(100),
  completion: z.number().min(0).max(100)
});

export const FeasibilityPhaseSchema = DetailedPhaseSchema.extend({
  subItems: z.object({
    riskAssessment: DetailedSubItemSchema,
    projectCharter: DetailedSubItemSchema
  })
});

export const PlanningPhaseSchema = DetailedPhaseSchema.extend({
  subItems: z.object({
    rfqPackage: DetailedSubItemSchema,
    validationStrategy: DetailedSubItemSchema,
    financialForecast: DetailedSubItemSchema,
    vendorSolicitation: DetailedSubItemSchema,
    ganttChart: DetailedSubItemSchema,
    sesAssetNumberApproval: DetailedSubItemSchema
  })
});

export const ExecutionPhaseSchema = DetailedPhaseSchema.extend({
  subItems: z.object({
    poSubmission: DetailedSubItemSchema,
    equipmentDesign: DetailedSubItemSchema,
    equipmentBuild: DetailedSubItemSchema,
    projectDocumentation: DetailedSubItemSchema,
    demoInstall: DetailedSubItemSchema,
    validation: DetailedSubItemSchema,
    equipmentTurnover: DetailedSubItemSchema,
    goLive: DetailedSubItemSchema
  })
});

export const ClosePhaseSchema = DetailedPhaseSchema.extend({
  subItems: z.object({
    poClosure: DetailedSubItemSchema,
    projectTurnover: DetailedSubItemSchema
  })
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
    feasibility: FeasibilityPhaseSchema,
    planning: PlanningPhaseSchema,
    execution: ExecutionPhaseSchema,
    close: ClosePhaseSchema
  }),
  comments: z.string().optional(),
  lastUpdated: z.date(),
  sesNumber: z.string().optional(),
  upcomingMilestone: z.string().optional(),
  milestoneDueDate: z.date().optional(),
  financialNotes: z.string().optional()
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

// Define sub-items for each phase type
export const PHASE_SUB_ITEMS = {
  feasibility: [
    { id: 'riskAssessment', name: 'Risk Assessment' },
    { id: 'projectCharter', name: 'Project Charter' }
  ],
  planning: [
    { id: 'rfqPackage', name: 'RFQ Package' },
    { id: 'validationStrategy', name: 'Validation Strategy' },
    { id: 'financialForecast', name: 'Financial Forecast' },
    { id: 'vendorSolicitation', name: 'Vendor Solicitation' },
    { id: 'ganttChart', name: 'Gantt Chart' },
    { id: 'sesAssetNumberApproval', name: 'SES Asset Number Approval' }
  ],
  execution: [
    { id: 'poSubmission', name: 'PO Submission' },
    { id: 'equipmentDesign', name: 'Equipment Design' },
    { id: 'equipmentBuild', name: 'Equipment Build' },
    { id: 'projectDocumentation', name: 'Project Documentation/SOP' },
    { id: 'demoInstall', name: 'Demo/Install' },
    { id: 'validation', name: 'Validation' },
    { id: 'equipmentTurnover', name: 'Equipment Turnover/Training' },
    { id: 'goLive', name: 'Go-Live' }
  ],
  close: [
    { id: 'poClosure', name: 'PO Closure' },
    { id: 'projectTurnover', name: 'Project Turnover' }
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
export const calculatePhaseCompletion = (phase: FeasibilityPhase | PlanningPhase | ExecutionPhase | ClosePhase): number => {
  if (!phase || !phase.subItems) {
    return 0;
  }

  const subItemsArray = Object.values(phase.subItems);
  const validItems = subItemsArray.filter(item => 
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

export const calculateOverallCompletion = (phases: any, projectType: string): number => {
  try {
    // Get dynamic weights from store
    const store = useCapExStore.getState();
    const weights = store.actions.getPhaseWeights(projectType);
    
    console.log('Using dynamic weights for', projectType, ':', weights);
    
    let totalWeightedCompletion = 0;
    let totalWeight = 0;
    
    const phaseNames = ['feasibility', 'planning', 'execution', 'close'];
    
    for (const phaseName of phaseNames) {
      if (!phases[phaseName]) continue;
      
      const phase = phases[phaseName];
      const phaseWeight = weights[phaseName] || 0;
      const phaseCompletion = phase.completion || 0;
      
      totalWeightedCompletion += (phaseCompletion * phaseWeight);
      totalWeight += phaseWeight;
    }
    
    if (totalWeight === 0) return 0;
    
    const result = totalWeightedCompletion / totalWeight;
    return Math.max(0, Math.min(100, Math.round(result)));
    
  } catch (error) {
    console.error('Error calculating completion:', error);
    return 0;
  }
};

export const calculateOverallCompletionForBoth = (project: Project | CapExRecord): number => {
  if ('phases' in project) {
    return calculateOverallCompletion(project.phases, project.projectType.id);
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

const createBasePhase = (id: string, name: string, weight: number) => ({
  id,
  name,
  weight,
  completion: 0
});

export const createEmptyFeasibilityPhase = (
  subItems: typeof PHASE_SUB_ITEMS.feasibility
): FeasibilityPhase => {
  const basePhase = createBasePhase('feasibility', 'Feasibility', 15);
  return {
    ...basePhase,
    subItems: {
      riskAssessment: {
        name: subItems[0].name,
        value: 0,
        isNA: false
      },
      projectCharter: {
        name: subItems[1].name,
        value: 0,
        isNA: false
      }
    }
  };
};

export const createEmptyPlanningPhase = (
  subItems: typeof PHASE_SUB_ITEMS.planning
): PlanningPhase => {
  const basePhase = createBasePhase('planning', 'Planning', 35);
  return {
    ...basePhase,
    subItems: {
      rfqPackage: {
        name: subItems[0].name,
        value: 0,
        isNA: false
      },
      validationStrategy: {
        name: subItems[1].name,
        value: 0,
        isNA: false
      },
      financialForecast: {
        name: subItems[2].name,
        value: 0,
        isNA: false
      },
      vendorSolicitation: {
        name: subItems[3].name,
        value: 0,
        isNA: false
      },
      ganttChart: {
        name: subItems[4].name,
        value: 0,
        isNA: false
      },
      sesAssetNumberApproval: {
        name: subItems[5].name,
        value: 0,
        isNA: false
      }
    }
  };
};

export const createEmptyExecutionPhase = (
  subItems: typeof PHASE_SUB_ITEMS.execution
): ExecutionPhase => {
  const basePhase = createBasePhase('execution', 'Execution', 45);
  return {
    ...basePhase,
    subItems: {
      poSubmission: {
        name: subItems[0].name,
        value: 0,
        isNA: false
      },
      equipmentDesign: {
        name: subItems[1].name,
        value: 0,
        isNA: false
      },
      equipmentBuild: {
        name: subItems[2].name,
        value: 0,
        isNA: false
      },
      projectDocumentation: {
        name: subItems[3].name,
        value: 0,
        isNA: false
      },
      demoInstall: {
        name: subItems[4].name,
        value: 0,
        isNA: false
      },
      validation: {
        name: subItems[5].name,
        value: 0,
        isNA: false
      },
      equipmentTurnover: {
        name: subItems[6].name,
        value: 0,
        isNA: false
      },
      goLive: {
        name: subItems[7].name,
        value: 0,
        isNA: false
      }
    }
  };
};

export const createEmptyClosePhase = (
  subItems: typeof PHASE_SUB_ITEMS.close
): ClosePhase => {
  const basePhase = createBasePhase('close', 'Close', 5);
  return {
    ...basePhase,
    subItems: {
      poClosure: {
        name: subItems[0].name,
        value: 0,
        isNA: false
      },
      projectTurnover: {
        name: subItems[1].name,
        value: 0,
        isNA: false
      }
    }
  };
};

// Helper function to create the appropriate phase based on type
export const createEmptyPhase = (
  id: string,
  name: string,
  weight: number,
  subItems: typeof PHASE_SUB_ITEMS[keyof typeof PHASE_SUB_ITEMS]
): FeasibilityPhase | PlanningPhase | ExecutionPhase | ClosePhase => {
  switch (id) {
    case 'feasibility':
      return createEmptyFeasibilityPhase(subItems as typeof PHASE_SUB_ITEMS.feasibility);
    case 'planning':
      return createEmptyPlanningPhase(subItems as typeof PHASE_SUB_ITEMS.planning);
    case 'execution':
      return createEmptyExecutionPhase(subItems as typeof PHASE_SUB_ITEMS.execution);
    case 'close':
      return createEmptyClosePhase(subItems as typeof PHASE_SUB_ITEMS.close);
    default:
      throw new Error(`Unknown phase type: ${id}`);
  }
};

export const createEmptyProject = (
  id: string,
  type: ProjectType = PROJECT_TYPES.PROJECTS
): Project => {
  const now = new Date();
  return {
    id,
    projectName: '',
    projectOwner: '',
    startDate: now,
    endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
    projectType: type,
    totalBudget: 0,
    totalActual: 0,
    projectStatus: 'On Track',
    phases: {
      feasibility: createEmptyFeasibilityPhase(PHASE_SUB_ITEMS.feasibility),
      planning: createEmptyPlanningPhase(PHASE_SUB_ITEMS.planning),
      execution: createEmptyExecutionPhase(PHASE_SUB_ITEMS.execution),
      close: createEmptyClosePhase(PHASE_SUB_ITEMS.close)
    },
    lastUpdated: now,
    sesNumber: '',
    upcomingMilestone: '',
    milestoneDueDate: undefined,
    financialNotes: '',
    
    // Additional fields for CapexProject compatibility
    name: '',
    owner: '',
    type: '',
    status: '',
    budget: 0,
    spent: 0,
    overallCompletion: 0,
    timeline: '',
    milestones: {
      feasibility: '',
      planning: '',
      execution: '',
      close: ''
    }
  };
};

// Test function to verify phase weight calculations
export const testPhaseWeights = () => {
  console.log('=== TESTING PHASE WEIGHTS ===');
  
  const testPhases = {
    feasibility: { completion: 80 },
    planning: { completion: 60 },
    execution: { completion: 40 },
    close: { completion: 20 }
  };
  
  const projectResult = calculateOverallCompletion(testPhases, 'project');
  console.log('Project result:', projectResult, '(Expected: 52%)');
  
  const assetResult = calculateOverallCompletion(testPhases, 'asset_purchase');
  console.log('Asset result:', assetResult, '(Expected: 48%)');
}; 