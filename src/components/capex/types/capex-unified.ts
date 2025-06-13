import { z } from 'zod';

// Base Enums
export const ProjectStatus = z.enum(['On Track', 'At Risk', 'Impacted']);
export const ProjectType = z.enum(['project', 'asset_purchase']);

// Sub-item Schema (used across all phases)
export const SubItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number().min(0).max(100),
  isNA: z.boolean().default(false),
  description: z.string().optional()
});

// Phase Schema
export const PhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().min(0).max(100),
  subItems: z.array(SubItemSchema),
  completion: z.number().min(0).max(100)
});

// Main Project Schema - Single source of truth
export const ProjectSchema = z.object({
  // Identity
  id: z.string(),
  projectName: z.string(),
  projectOwner: z.string(),
  projectType: ProjectType,
  
  // Dates
  startDate: z.date(),
  endDate: z.date(),
  
  // Financials
  totalBudget: z.number().min(0),
  totalActual: z.number().min(0),
  yearlyBudget: z.number().min(0).optional(),
  yearlyActual: z.number().min(0).optional(),
  
  // Status (auto-calculated)
  projectStatus: ProjectStatus,
  overallCompletion: z.number().min(0).max(100),
  
  // Phases
  phases: z.object({
    feasibility: PhaseSchema,
    planning: PhaseSchema,
    execution: PhaseSchema,
    close: PhaseSchema
  }),
  
  // Metadata
  upcomingMilestone: z.string().optional(),
  comments: z.string().optional(),
  lastUpdated: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Admin Settings Schema
export const AdminSettingsSchema = z.object({
  id: z.number().default(1),
  onTrackThreshold: z.number().min(0).max(100).default(90),
  atRiskThreshold: z.number().min(0).max(100).default(80),
  showFinancials: z.boolean().default(true),
  phaseWeights: z.object({
    project: z.object({
      feasibility: z.number().default(15),
      planning: z.number().default(35),
      execution: z.number().default(45),
      close: z.number().default(5)
    }),
    asset_purchase: z.object({
      feasibility: z.number().default(0),
      planning: z.number().default(45),
      execution: z.number().default(50),
      close: z.number().default(5)
    })
  })
});

// Modal State Schema
export const ModalStateSchema = z.object({
  isOpen: z.boolean(),
  data: z.any().nullable()
});

// Derived Types
export type Project = z.infer<typeof ProjectSchema>;
export type SubItem = z.infer<typeof SubItemSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type AdminSettings = z.infer<typeof AdminSettingsSchema>;
export type ModalState<T> = {
  isOpen: boolean;
  data: T | null;
};

// Database to Frontend Transformer
export class ProjectTransformer {
  static fromDatabase(dbRecord: any): Project {
    // Transform database record to unified Project type
    const phases = this.buildPhasesFromRecord(dbRecord);
    const overallCompletion = this.calculateOverallCompletion(phases, dbRecord.project_type);
    const projectStatus = this.determineStatus(overallCompletion);
    
    return ProjectSchema.parse({
      id: dbRecord.id,
      projectName: dbRecord.project_name,
      projectOwner: dbRecord.project_owner,
      projectType: dbRecord.project_type,
      startDate: new Date(dbRecord.start_date),
      endDate: new Date(dbRecord.end_date),
      totalBudget: dbRecord.total_budget,
      totalActual: dbRecord.total_actual,
      yearlyBudget: dbRecord.yearly_budget,
      yearlyActual: dbRecord.yearly_actual,
      projectStatus,
      overallCompletion,
      phases,
      upcomingMilestone: dbRecord.upcoming_milestone,
      comments: dbRecord.comments,
      lastUpdated: new Date(dbRecord.last_updated || dbRecord.updated_at),
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.updated_at)
    });
  }
  
  static toDatabase(project: Project): any {
    // Transform unified Project to database record
    return {
      id: project.id,
      project_name: project.projectName,
      project_owner: project.projectOwner,
      project_type: project.projectType,
      start_date: project.startDate.toISOString(),
      end_date: project.endDate.toISOString(),
      total_budget: project.totalBudget,
      total_actual: project.totalActual,
      yearly_budget: project.yearlyBudget,
      yearly_actual: project.yearlyActual,
      upcoming_milestone: project.upcomingMilestone,
      comments: project.comments,
      // Flatten phase data for database
      ...this.flattenPhases(project.phases)
    };
  }
  
  private static buildPhasesFromRecord(record: any): Project['phases'] {
    // Implementation to build phases from database record
    return {
      feasibility: this.buildPhase('feasibility', record),
      planning: this.buildPhase('planning', record),
      execution: this.buildPhase('execution', record),
      close: this.buildPhase('close', record)
    };
  }
  
  private static buildPhase(phaseName: string, record: any): Phase {
    // Map of phase sub-items
    const phaseSubItems: Record<string, string[]> = {
      feasibility: ['risk_assessment', 'project_charter'],
      planning: ['rfq_package', 'validation_strategy', 'financial_forecast', 
                 'vendor_solicitation', 'gantt_chart', 'ses_asset_number_approval'],
      execution: ['po_submission', 'equipment_design', 'equipment_build',
                  'project_documentation', 'demo_install', 'validation',
                  'equipment_turnover', 'go_live'],
      close: ['po_closure', 'project_turnover']
    };
    
    const subItems = phaseSubItems[phaseName].map((itemId: string) => ({
      id: itemId,
      name: this.formatSubItemName(itemId),
      value: this.parseValue(record[itemId]),
      isNA: record[itemId] === 'N/A'
    }));
    
    const completion = this.calculatePhaseCompletion(subItems);
    
    return {
      id: phaseName,
      name: this.formatPhaseName(phaseName),
      weight: this.getPhaseWeight(phaseName, record.project_type),
      subItems,
      completion
    };
  }
  
  private static calculatePhaseCompletion(subItems: SubItem[]): number {
    const activeItems = subItems.filter(item => !item.isNA);
    if (activeItems.length === 0) return 0;
    
    const sum = activeItems.reduce((acc, item) => acc + item.value, 0);
    return Math.round(sum / activeItems.length);
  }
  
  private static calculateOverallCompletion(phases: Project['phases'], projectType: string): number {
    const weights = this.getPhaseWeights(projectType);
    
    return Math.round(
      phases.feasibility.completion * weights.feasibility / 100 +
      phases.planning.completion * weights.planning / 100 +
      phases.execution.completion * weights.execution / 100 +
      phases.close.completion * weights.close / 100
    );
  }
  
  private static determineStatus(completion: number): Project['projectStatus'] {
    // This will use admin settings in actual implementation
    if (completion >= 90) return 'On Track';
    if (completion >= 80) return 'At Risk';
    return 'Impacted';
  }
  
  private static parseValue(value: any): number {
    if (value === 'N/A' || value === null || value === undefined) return 0;
    if (typeof value === 'string' && value.endsWith('%')) {
      return parseInt(value.replace('%', ''));
    }
    return Number(value) || 0;
  }
  
  private static formatSubItemName(id: string): string {
    return id
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  private static formatPhaseName(id: string): string {
    return id.charAt(0).toUpperCase() + id.slice(1);
  }
  
  private static getPhaseWeight(phaseName: string, projectType: string): number {
    const weights = this.getPhaseWeights(projectType);
    return weights[phaseName] || 0;
  }
  
  private static getPhaseWeights(projectType: string): Record<string, number> {
    // Default weights - should come from admin settings
    if (projectType === 'asset_purchase') {
      return { feasibility: 0, planning: 45, execution: 50, close: 5 };
    }
    return { feasibility: 15, planning: 35, execution: 45, close: 5 };
  }
  
  private static flattenPhases(phases: Project['phases']): Record<string, string | number> {
    const result: Record<string, string | number> = {};
    
    Object.values(phases).forEach(phase => {
      phase.subItems.forEach(item => {
        result[item.id] = item.isNA ? 'N/A' : `${item.value}%`;
      });
      result[`${phase.id}_status`] = phase.completion;
    });
    
    return result;
  }
} 