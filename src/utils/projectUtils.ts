import { Project, PhaseProgress } from '../components/capex/data/capexData';
import { CapExRecord, Phase } from '../types/capex';

export const convertProjectToCapExRecord = (project: Project): CapExRecord => {
  return {
    id: project.id,
    section: project.projectType.name,
    projectType: project.projectType,
    project_name: project.projectName,
    project_owner: project.projectOwner,
    start_date: project.startDate.toISOString(),
    end_date: project.endDate.toISOString(),
    total_budget: project.totalBudget,
    total_actual: project.totalActual,
    total_spent_percentage: project.totalActual / project.totalBudget * 100,
    financials: [],
    current_year: new Date().getFullYear(),
    project_status: project.projectStatus,
    actual_project_completion: 0,
    target_project_completion: 0,
    total_ratio_uncapped: 0,
    total_actual_target: 0,
    upcoming_milestone: project.comments || '',
    comments_risk: project.comments || '',

    // Convert phases
    feasibility: convertPhaseProgressToPhase(project.phases.feasibility),
    planning: convertPhaseProgressToPhase(project.phases.planning),
    execution: convertPhaseProgressToPhase(project.phases.execution),
    close: convertPhaseProgressToPhase(project.phases.close)
  };
};

export const convertPhaseProgressToPhase = (phase: PhaseProgress): Phase => {
  return {
    id: phase.id,
    name: phase.name,
    weight: phase.weight,
    subItems: phase.subItems.map(item => ({
      id: item.id,
      name: item.name,
      weight: 0,
      target: item.value,
      actual: item.value,
      isNA: item.isNA
    })),
    status: {
      target: phase.completion,
      actual: phase.completion
    }
  };
};

export const convertCapExRecordToProject = (record: CapExRecord): Project => {
  return {
    id: record.id,
    projectName: record.project_name,
    projectOwner: record.project_owner,
    startDate: new Date(record.start_date),
    endDate: new Date(record.end_date),
    projectType: record.projectType,
    totalBudget: record.total_budget,
    totalActual: record.total_actual,
    projectStatus: record.project_status as Project['projectStatus'],
    phases: {
      feasibility: convertPhaseToPhaseProgress(record.feasibility),
      planning: convertPhaseToPhaseProgress(record.planning),
      execution: convertPhaseToPhaseProgress(record.execution),
      close: convertPhaseToPhaseProgress(record.close)
    },
    comments: record.comments_risk,
    lastUpdated: new Date()
  };
};

export const convertPhaseToPhaseProgress = (phase: Phase): PhaseProgress => {
  return {
    id: phase.id,
    name: phase.name,
    weight: phase.weight,
    subItems: phase.subItems.map(item => ({
      id: item.id,
      name: item.name,
      value: item.actual,
      isNA: item.isNA
    })),
    completion: phase.status.actual
  };
}; 