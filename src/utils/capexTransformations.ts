// utils/capexTransformations.ts - Unified transformation functions

import { 
  CapexProject, 
  CapexProjectDB, 
  Phase, 
  PhaseItem,
  ProjectType,
  ProjectStatus,
  DEFAULT_PHASE_WEIGHTS
} from '../types/capex-unified';

// Project type constants
const COMPLEX_PROJECT: ProjectType = 'Complex Project';
const ASSET_PURCHASE: ProjectType = 'Asset Purchase';

/**
 * Map project type string to enum value
 */
export function mapProjectType(dbType: string | null | undefined): ProjectType {
  if (!dbType) {
    return COMPLEX_PROJECT;
  }
  
  const typeStr = String(dbType).toLowerCase().trim();
  
  // Check for exact matches first
  if (dbType === COMPLEX_PROJECT) return COMPLEX_PROJECT;
  if (dbType === ASSET_PURCHASE) return ASSET_PURCHASE;
  
  // Then check for database values
  if (typeStr === 'projects' || typeStr.includes('complex') || typeStr.includes('project')) {
    return COMPLEX_PROJECT;
  } else if (typeStr === 'asset_purchases' || typeStr === 'asset_purchase' || typeStr.includes('asset')) {
    return ASSET_PURCHASE;
  }
  
  console.warn('Unknown project type:', dbType, 'defaulting to Complex Project');
  return COMPLEX_PROJECT;
}

/**
 * Map UI project type to database type
 */
export function mapProjectTypeToDb(uiType: ProjectType): string {
  return uiType === 'Complex Project' ? 'projects' : 'asset_purchases';
}

/**
 * Create default phases based on project type
 */
export function createDefaultPhases(projectType: ProjectType): CapexProject['phases'] {
  const weights = projectType === 'Complex Project' 
    ? DEFAULT_PHASE_WEIGHTS.complexProject 
    : DEFAULT_PHASE_WEIGHTS.assetPurchase;
  
  // Helper to create phase items with IDs
  const createPhaseItem = (name: string, value: number | string = 0, isNA: boolean = false): PhaseItem => ({
    id: crypto.randomUUID(),
    name,
    value,
    isNA
  });
  
  const phases: CapexProject['phases'] = {
    planning: {
      id: 'planning',
      name: 'Planning',
      weight: weights.planning,
      completion: 0,
      items: [
        createPhaseItem('RFQ Package'),
        createPhaseItem('Validation Strategy'),
        createPhaseItem('Financial Forecast'),
        createPhaseItem('Vendor Solicitation'),
        createPhaseItem('Gantt Chart'),
        createPhaseItem('SES/Asset# Approval')
      ]
    },
    execution: {
      id: 'execution',
      name: 'Execution',
      weight: weights.execution,
      completion: 0,
      items: [
        createPhaseItem('PO Submission'),
        createPhaseItem('Equipment Design'),
        createPhaseItem('Equipment Build'),
        createPhaseItem('Project Documentation'),
        createPhaseItem('Demo/Install'),
        createPhaseItem('Validation'),
        createPhaseItem('Equipment Turnover'),
        createPhaseItem('Go Live')
      ]
    },
    close: {
      id: 'close',
      name: 'Close',
      weight: weights.close,
      completion: 0,
      items: [
        createPhaseItem('PO Closure'),
        createPhaseItem('Project Turnover')
      ]
    }
  };
  
  // Add feasibility phase only for Complex Projects
  if (projectType === 'Complex Project') {
    phases.feasibility = {
      id: 'feasibility',
      name: 'Feasibility',
      weight: weights.feasibility,
      completion: 0,
      items: [
        createPhaseItem('Risk Assessment'),
        createPhaseItem('Project Charter')
      ]
    };
  }
  
  return phases;
}

/**
 * Parse phases data from database (handles JSON string or object)
 */
function parsePhasesData(phasesData: string | any): CapexProject['phases'] | null {
  if (!phasesData) return null;
  
  try {
    const parsed = typeof phasesData === 'string' ? JSON.parse(phasesData) : phasesData;
    return parsed;
  } catch (error) {
    console.error('Failed to parse phases data:', error);
    return null;
  }
}

/**
 * Transform database record to CapexProject
 */
export function transformDbToProject(dbRecord: CapexProjectDB): CapexProject {
  const projectType = mapProjectType(dbRecord.project_type);
  const parsedPhases = parsePhasesData(dbRecord.phases_data);
  const phases = parsedPhases || createDefaultPhases(projectType);
  
  // Ensure status is a valid ProjectStatus
  let status: ProjectStatus = 'On Track';
  if (dbRecord.project_status) {
    const statusStr = dbRecord.project_status.trim();
    if (statusStr === 'On Track' || statusStr === 'At Risk' || statusStr === 'Impacted') {
      status = statusStr as ProjectStatus;
    }
  }
  
  // Calculate overall completion if not provided
  let overallCompletion = dbRecord.overall_completion ?? 0;
  if (!dbRecord.overall_completion && phases) {
    const totalWeight = Object.values(phases).reduce((sum, phase) => sum + (phase?.weight ?? 0), 0);
    const weightedCompletion = Object.values(phases).reduce(
      (sum, phase) => sum + ((phase?.completion ?? 0) * (phase?.weight ?? 0)), 
      0
    );
    overallCompletion = totalWeight > 0 ? Math.round(weightedCompletion / totalWeight) : 0;
  }
  
  const project: CapexProject = {
    id: dbRecord.id,
    name: dbRecord.project_name,
    type: projectType,
    owner: dbRecord.owner_name,
    status: status,
    budget: dbRecord.total_budget ?? 0,
    spent: dbRecord.total_actual ?? 0,
    overallCompletion,
    phases,
  };
  
  // Handle optional fields with proper null checking and type assertions
  if (dbRecord.start_date !== null && dbRecord.start_date !== undefined) {
    project.startDate = dbRecord.start_date as string;
  }
  if (dbRecord.end_date !== null && dbRecord.end_date !== undefined) {
    project.endDate = dbRecord.end_date as string;
  }
  if (dbRecord.timeline !== null && dbRecord.timeline !== undefined) {
    project.timeline = dbRecord.timeline as string;
  }
  if (dbRecord.upcoming_milestone !== null && dbRecord.upcoming_milestone !== undefined) {
    project.upcomingMilestone = dbRecord.upcoming_milestone as string;
  }
  if (dbRecord.ses_number !== null && dbRecord.ses_number !== undefined) {
    project.sesNumber = dbRecord.ses_number as string;
  }
  if (dbRecord.financial_notes !== null && dbRecord.financial_notes !== undefined) {
    project.financialNotes = dbRecord.financial_notes as string;
  }
  if (dbRecord.comments !== null && dbRecord.comments !== undefined) {
    project.comments = dbRecord.comments as string;
  }
  
  // Phase dates
  if (dbRecord.feasibility_start_date !== null && dbRecord.feasibility_start_date !== undefined) {
    project.feasibilityStartDate = dbRecord.feasibility_start_date as string;
  }
  if (dbRecord.feasibility_end_date !== null && dbRecord.feasibility_end_date !== undefined) {
    project.feasibilityEndDate = dbRecord.feasibility_end_date as string;
  }
  if (dbRecord.planning_start_date !== null && dbRecord.planning_start_date !== undefined) {
    project.planningStartDate = dbRecord.planning_start_date as string;
  }
  if (dbRecord.planning_end_date !== null && dbRecord.planning_end_date !== undefined) {
    project.planningEndDate = dbRecord.planning_end_date as string;
  }
  if (dbRecord.execution_start_date !== null && dbRecord.execution_start_date !== undefined) {
    project.executionStartDate = dbRecord.execution_start_date as string;
  }
  if (dbRecord.execution_end_date !== null && dbRecord.execution_end_date !== undefined) {
    project.executionEndDate = dbRecord.execution_end_date as string;
  }
  if (dbRecord.close_start_date !== null && dbRecord.close_start_date !== undefined) {
    project.closeStartDate = dbRecord.close_start_date as string;
  }
  if (dbRecord.close_end_date !== null && dbRecord.close_end_date !== undefined) {
    project.closeEndDate = dbRecord.close_end_date as string;
  }
  
  // Metadata
  if (dbRecord.updated_at || dbRecord.created_at) {
    project.lastUpdated = (dbRecord.updated_at || dbRecord.created_at) as string;
  }
  if (dbRecord.created_at) {
    project.createdAt = dbRecord.created_at as string;
  }
  if (dbRecord.updated_at) {
    project.updatedAt = dbRecord.updated_at as string;
  }
  
  return project;
}

/**
 * Transform CapexProject to database record
 */
export function transformProjectToDb(project: CapexProject): Partial<CapexProjectDB> {
  return {
    project_name: project.name,
    project_type: mapProjectTypeToDb(project.type),
    owner_name: project.owner,
    project_status: project.status,
    total_budget: project.budget,
    total_actual: project.spent,
    overall_completion: project.overallCompletion,
    phases_data: JSON.stringify(project.phases),
    
    // Convert undefined to null for database
    timeline: project.timeline ?? null,
    upcoming_milestone: project.upcomingMilestone ?? null,
    ses_number: project.sesNumber ?? null,
    financial_notes: project.financialNotes ?? null,
    comments: project.comments ?? null,
    
    // Phase dates - convert undefined to null
    feasibility_start_date: project.feasibilityStartDate ?? null,
    feasibility_end_date: project.feasibilityEndDate ?? null,
    planning_start_date: project.planningStartDate ?? null,
    planning_end_date: project.planningEndDate ?? null,
    execution_start_date: project.executionStartDate ?? null,
    execution_end_date: project.executionEndDate ?? null,
    close_start_date: project.closeStartDate ?? null,
    close_end_date: project.closeEndDate ?? null,
  };
}

/**
 * Adapt phase item with weight/target/actual to value-based structure
 */
export function adaptPhaseItem(item: any): PhaseItem {
  return {
    id: item.id || crypto.randomUUID(),
    name: item.name || 'Unnamed Item',
    value: item.value ?? item.actual ?? item.target ?? 0,
    isNA: item.isNA ?? false
  };
}

/**
 * Convert legacy project structure to CapexProject
 */
export function adaptLegacyProject(legacyProject: any): CapexProject {
  if (!legacyProject) {
    throw new Error('Cannot adapt null or undefined project');
  }
  
  // Handle different property names
  const project: CapexProject = {
    id: legacyProject.id || '',
    name: legacyProject.projectName || legacyProject.project_name || legacyProject.name || '',
    type: mapProjectType(
      legacyProject.projectType?.name || 
      legacyProject.project_type || 
      legacyProject.type || 
      'Complex Project'
    ),
    owner: legacyProject.projectOwner || legacyProject.project_owner || legacyProject.owner || '',
    status: (legacyProject.projectStatus || legacyProject.project_status || legacyProject.status || 'On Track') as ProjectStatus,
    budget: Number(legacyProject.totalBudget || legacyProject.total_budget || legacyProject.budget) || 0,
    spent: Number(legacyProject.totalActual || legacyProject.total_actual || legacyProject.spent) || 0,
    overallCompletion: Number(legacyProject.overallCompletion || legacyProject.overall_completion) || 0,
    phases: {},
    
    // Optional fields
    timeline: legacyProject.timeline,
    upcomingMilestone: legacyProject.upcomingMilestone || legacyProject.upcoming_milestone,
    sesNumber: legacyProject.sesNumber || legacyProject.ses_number,
    financialNotes: legacyProject.financialNotes || legacyProject.financial_notes,
  };
  
  // Handle phases - check if it's the old structure with subItems
  if (legacyProject.phases) {
    Object.entries(legacyProject.phases).forEach(([key, phase]: [string, any]) => {
      if (phase) {
        const items = phase.items || 
                     (phase.subItems && Array.isArray(phase.subItems) ? phase.subItems : 
                      phase.subItems ? convertPhaseItemsToArray(phase.subItems) : []);
        
        project.phases[key as keyof typeof project.phases] = {
          id: phase.id || key,
          name: phase.name || key.charAt(0).toUpperCase() + key.slice(1),
          weight: Number(phase.weight) || 0,
          completion: Number(phase.completion) || 0,
          items: items.map(adaptPhaseItem)
        };
      }
    });
  }
  
  return project;
}

export function convertPhaseItemsToArray(subItems: Record<string, any>): PhaseItem[] {
  return Object.entries(subItems).map(([key, item]) => ({
    id: item.id || crypto.randomUUID(),
    name: item.name || key,
    value: typeof item === 'object' ? (item.value ?? item.actual ?? item.target ?? 0) : item,
    isNA: item.isNA ?? false
  }));
} 