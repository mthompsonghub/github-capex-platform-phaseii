import { z } from 'zod';
import { CapexProject, Phase, ProjectStatus, ProjectType, DEFAULT_PHASE_WEIGHTS } from '../../../types/capex-unified';

// Constants
export const PROJECT_TYPES = {
  PROJECTS: 'Complex Project' as ProjectType,
  ASSET_PURCHASES: 'Asset Purchase' as ProjectType
};

// Default settings for status thresholds
export const defaultSettings = {
  onTrackThreshold: 90,
  atRiskThreshold: 70,
  impactedThreshold: 0
};

// Utility functions
export const calculatePhaseCompletion = (phase: Phase): number => {
  if (!phase.items || phase.items.length === 0) return 0;
  
  const validItems = phase.items.filter(item => !item.isNA);
  if (validItems.length === 0) return 0;
  
  const totalCompletion = validItems.reduce((sum, item) => {
    const value = typeof item.value === 'string' ? parseFloat(item.value) : item.value;
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
  
  return totalCompletion / validItems.length;
};

export const calculateOverallCompletion = (phases: Record<string, Phase>, projectType: ProjectType): number => {
  let totalCompletion = 0;
  let totalWeight = 0;

  const weights = projectType === 'Complex Project' ? DEFAULT_PHASE_WEIGHTS.complexProject : DEFAULT_PHASE_WEIGHTS.assetPurchase;

  Object.entries(phases).forEach(([phaseName, phase]) => {
    const weight = weights[phaseName as keyof typeof weights] || 0;
    if (weight > 0) {
      totalCompletion += calculatePhaseCompletion(phase) * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? totalCompletion / totalWeight : 0;
};

export const determineProjectStatus = (
  actualCompletion: number,
  targetCompletion: number,
  onTrackThreshold: number = defaultSettings.onTrackThreshold,
  atRiskThreshold: number = defaultSettings.atRiskThreshold
): ProjectStatus => {
  const completionRatio = (actualCompletion / targetCompletion) * 100;
  
  if (completionRatio >= onTrackThreshold) {
    return 'On Track';
  } else if (completionRatio >= atRiskThreshold) {
    return 'At Risk';
  } else {
    return 'Impacted';
  }
};

// Helper function to create a base phase
const createBasePhase = (id: string, name: string, weight: number): Phase => ({
  id,
  name,
  weight,
  completion: 0,
  items: []
});

// Phase sub-items definitions
export const PHASE_SUB_ITEMS = {
  feasibility: {
    riskAssessment: { name: 'Risk Assessment', value: 0, isNA: false },
    projectCharter: { name: 'Project Charter', value: 0, isNA: false }
  },
  planning: {
    rfqPackage: { name: 'RFQ Package', value: 0, isNA: false },
    validationStrategy: { name: 'Validation Strategy', value: 0, isNA: false },
    financialForecast: { name: 'Financial Forecast', value: 0, isNA: false },
    vendorSolicitation: { name: 'Vendor Solicitation', value: 0, isNA: false },
    ganttChart: { name: 'Gantt Chart', value: 0, isNA: false },
    sesAssetNumberApproval: { name: 'SES Asset Number Approval', value: 0, isNA: false }
  },
  execution: {
    poSubmission: { name: 'PO Submission', value: 0, isNA: false },
    equipmentDesign: { name: 'Equipment Design', value: 0, isNA: false },
    equipmentBuild: { name: 'Equipment Build', value: 0, isNA: false },
    projectDocumentation: { name: 'Project Documentation', value: 0, isNA: false },
    demoInstall: { name: 'Demo Install', value: 0, isNA: false },
    validation: { name: 'Validation', value: 0, isNA: false },
    equipmentTurnover: { name: 'Equipment Turnover', value: 0, isNA: false },
    goLive: { name: 'Go Live', value: 0, isNA: false }
  },
  close: {
    poClosure: { name: 'PO Closure', value: 0, isNA: false },
    projectTurnover: { name: 'Project Turnover', value: 0, isNA: false }
  }
};

// Function to create empty phases
export const createEmptyPhase = (
  id: string,
  name: string,
  weight: number,
  subItems: typeof PHASE_SUB_ITEMS[keyof typeof PHASE_SUB_ITEMS]
): Phase => {
  const phase = createBasePhase(id, name, weight);
  phase.items = Object.entries(subItems).map(([key, item]) => ({
    id: crypto.randomUUID(),
    name: item.name,
    value: item.value,
    isNA: item.isNA
  }));
  return phase;
};

// Function to create an empty project
export const createEmptyProject = (
  id: string,
  type: ProjectType = PROJECT_TYPES.PROJECTS
): CapexProject => {
  const now = new Date();
  const weights = type === 'Complex Project' ? DEFAULT_PHASE_WEIGHTS.complexProject : DEFAULT_PHASE_WEIGHTS.assetPurchase;
  
  return {
    id,
    name: '',
    owner: '',
    type,
    status: 'On Track',
    budget: 0,
    spent: 0,
    overallCompletion: 0,
    phases: {
      feasibility: type === 'Complex Project' ? createEmptyPhase('feasibility', 'Feasibility', weights.feasibility, PHASE_SUB_ITEMS.feasibility) : undefined,
      planning: createEmptyPhase('planning', 'Planning', weights.planning, PHASE_SUB_ITEMS.planning),
      execution: createEmptyPhase('execution', 'Execution', weights.execution, PHASE_SUB_ITEMS.execution),
      close: createEmptyPhase('close', 'Close', weights.close, PHASE_SUB_ITEMS.close)
    },
    startDate: now,
    endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
    lastUpdated: now
  };
};

// Test function to verify phase weights
export const testPhaseWeights = () => {
  Object.entries(DEFAULT_PHASE_WEIGHTS).forEach(([typeName, weights]) => {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    console.log(`${typeName} phase weights total: ${total}%`);
  });
}; 