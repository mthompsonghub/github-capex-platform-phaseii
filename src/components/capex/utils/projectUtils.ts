import { Project, FeasibilityPhase, PlanningPhase, ExecutionPhase, ClosePhase, DetailedSubItem } from '../data/capexData';
import { CapexProject } from '../../../types/capex';

export const convertToCapexProject = (project: Project): CapexProject => {
  // Convert dates to ensure they are valid Date objects
  const startDate = project.startDate instanceof Date ? project.startDate : new Date(project.startDate);
  const endDate = project.endDate instanceof Date ? project.endDate : new Date(project.endDate);
  const lastUpdated = project.lastUpdated instanceof Date ? project.lastUpdated : new Date(project.lastUpdated);

  // Convert project type to match CapexProject type
  const projectType = project.projectType.id === 'projects' ? 'project' : 'asset_purchase';

  // Calculate overall completion based on phases
  const overallCompletion = calculateOverallCompletion(project.phases, projectType);

  // Convert phases to match CapexProject phase structure
  const phases = {
    feasibility: {
      id: 'feasibility',
      name: 'Feasibility',
      weight: project.projectType.phaseWeights.feasibility,
      subItems: Object.entries(project.phases.feasibility.subItems).map(([id, item]) => ({
        id,
        name: item.name,
        value: item.value,
        isNA: item.isNA
      })),
      completion: project.phases.feasibility.completion
    },
    planning: {
      id: 'planning',
      name: 'Planning',
      weight: project.projectType.phaseWeights.planning,
      subItems: Object.entries(project.phases.planning.subItems).map(([id, item]) => ({
        id,
        name: item.name,
        value: item.value,
        isNA: item.isNA
      })),
      completion: project.phases.planning.completion
    },
    execution: {
      id: 'execution',
      name: 'Execution',
      weight: project.projectType.phaseWeights.execution,
      subItems: Object.entries(project.phases.execution.subItems).map(([id, item]) => ({
        id,
        name: item.name,
        value: item.value,
        isNA: item.isNA
      })),
      completion: project.phases.execution.completion
    },
    close: {
      id: 'close',
      name: 'Close',
      weight: project.projectType.phaseWeights.close,
      subItems: Object.entries(project.phases.close.subItems).map(([id, item]) => ({
        id,
        name: item.name,
        value: item.value,
        isNA: item.isNA
      })),
      completion: project.phases.close.completion
    }
  };

  return {
    id: project.id,
    projectName: project.projectName,
    projectOwner: project.projectOwner,
    projectType,
    startDate,
    endDate,
    totalBudget: project.totalBudget,
    totalActual: project.totalActual,
    projectStatus: project.projectStatus,
    overallCompletion,
    phases,
    upcomingMilestone: project.upcomingMilestone,
    comments: project.comments,
    lastUpdated,
    createdAt: lastUpdated, // Use lastUpdated as fallback
    updatedAt: lastUpdated  // Use lastUpdated as fallback
  };
};

// Helper function to calculate overall completion
const calculateOverallCompletion = (phases: Project['phases'], projectType: string): number => {
  const weights = {
    project: {
      feasibility: 15,
      planning: 35,
      execution: 45,
      close: 5
    },
    asset_purchase: {
      feasibility: 0,
      planning: 45,
      execution: 50,
      close: 5
    }
  };

  const typeWeights = weights[projectType as keyof typeof weights];
  const weightedSum = Object.entries(phases).reduce((sum, [phase, data]) => {
    return sum + (data.completion * typeWeights[phase as keyof typeof typeWeights]);
  }, 0);

  return Math.round(weightedSum / 100);
};

type PhaseName = 'feasibility' | 'planning' | 'execution' | 'close';

export function convertToProject(capexProject: CapexProject): Project {
  // Determine project type based on the type string
  const projectTypeId = capexProject.type === 'asset_purchase' ? 'asset_purchases' : 'projects';
  const projectTypeName = capexProject.type === 'asset_purchase' ? 'Asset Purchase' : 'Complex Project';
  
  // Default phase weights based on project type
  const defaultWeights = projectTypeId === 'projects' 
    ? { feasibility: 15, planning: 35, execution: 45, close: 5 }
    : { feasibility: 0, planning: 45, execution: 50, close: 5 };

  // Safely get phase data with defaults
  const getPhaseData = (phaseName: PhaseName): FeasibilityPhase | PlanningPhase | ExecutionPhase | ClosePhase => {
    const phase = capexProject.phases[phaseName];
    const defaultWeight = defaultWeights[phaseName];
    
    if (!phase) {
      return {
        id: phaseName,
        name: phaseName.charAt(0).toUpperCase() + phaseName.slice(1),
        weight: defaultWeight,
        completion: 0,
        subItems: {} as any // Type assertion needed due to different phase types
      };
    }

    // Convert subItems to the correct format based on phase type
    const subItems = phase.subItems || {};
    let convertedSubItems: any;

    switch (phaseName) {
      case 'feasibility':
        convertedSubItems = {
          riskAssessment: {
            name: subItems.riskAssessment?.name || 'Risk Assessment',
            value: subItems.riskAssessment?.value || 0,
            isNA: subItems.riskAssessment?.isNA || false
          },
          projectCharter: {
            name: subItems.projectCharter?.name || 'Project Charter',
            value: subItems.projectCharter?.value || 0,
            isNA: subItems.projectCharter?.isNA || false
          }
        } as FeasibilityPhase['subItems'];
        break;
      case 'planning':
        convertedSubItems = {
          rfqPackage: {
            name: subItems.rfqPackage?.name || 'RFQ Package',
            value: subItems.rfqPackage?.value || 0,
            isNA: subItems.rfqPackage?.isNA || false
          },
          validationStrategy: {
            name: subItems.validationStrategy?.name || 'Validation Strategy',
            value: subItems.validationStrategy?.value || 0,
            isNA: subItems.validationStrategy?.isNA || false
          },
          financialForecast: {
            name: subItems.financialForecast?.name || 'Financial Forecast',
            value: subItems.financialForecast?.value || 0,
            isNA: subItems.financialForecast?.isNA || false
          },
          vendorSolicitation: {
            name: subItems.vendorSolicitation?.name || 'Vendor Solicitation',
            value: subItems.vendorSolicitation?.value || 0,
            isNA: subItems.vendorSolicitation?.isNA || false
          },
          ganttChart: {
            name: subItems.ganttChart?.name || 'Gantt Chart',
            value: subItems.ganttChart?.value || 0,
            isNA: subItems.ganttChart?.isNA || false
          },
          sesAssetNumberApproval: {
            name: subItems.sesAssetNumberApproval?.name || 'SES Asset Number Approval',
            value: subItems.sesAssetNumberApproval?.value || 0,
            isNA: subItems.sesAssetNumberApproval?.isNA || false
          }
        } as PlanningPhase['subItems'];
        break;
      case 'execution':
        convertedSubItems = {
          poSubmission: {
            name: subItems.poSubmission?.name || 'PO Submission',
            value: subItems.poSubmission?.value || 0,
            isNA: subItems.poSubmission?.isNA || false
          },
          equipmentDesign: {
            name: subItems.equipmentDesign?.name || 'Equipment Design',
            value: subItems.equipmentDesign?.value || 0,
            isNA: subItems.equipmentDesign?.isNA || false
          },
          equipmentBuild: {
            name: subItems.equipmentBuild?.name || 'Equipment Build',
            value: subItems.equipmentBuild?.value || 0,
            isNA: subItems.equipmentBuild?.isNA || false
          },
          projectDocumentation: {
            name: subItems.projectDocumentation?.name || 'Project Documentation',
            value: subItems.projectDocumentation?.value || 0,
            isNA: subItems.projectDocumentation?.isNA || false
          },
          demoInstall: {
            name: subItems.demoInstall?.name || 'Demo/Install',
            value: subItems.demoInstall?.value || 0,
            isNA: subItems.demoInstall?.isNA || false
          },
          validation: {
            name: subItems.validation?.name || 'Validation',
            value: subItems.validation?.value || 0,
            isNA: subItems.validation?.isNA || false
          },
          equipmentTurnover: {
            name: subItems.equipmentTurnover?.name || 'Equipment Turnover',
            value: subItems.equipmentTurnover?.value || 0,
            isNA: subItems.equipmentTurnover?.isNA || false
          },
          goLive: {
            name: subItems.goLive?.name || 'Go-Live',
            value: subItems.goLive?.value || 0,
            isNA: subItems.goLive?.isNA || false
          }
        } as ExecutionPhase['subItems'];
        break;
      case 'close':
        convertedSubItems = {
          poClosure: {
            name: subItems.poClosure?.name || 'PO Closure',
            value: subItems.poClosure?.value || 0,
            isNA: subItems.poClosure?.isNA || false
          },
          projectTurnover: {
            name: subItems.projectTurnover?.name || 'Project Turnover',
            value: subItems.projectTurnover?.value || 0,
            isNA: subItems.projectTurnover?.isNA || false
          }
        } as ClosePhase['subItems'];
        break;
    }

    return {
      id: phaseName,
      name: phase.name || phaseName.charAt(0).toUpperCase() + phaseName.slice(1),
      weight: phase.weight || defaultWeight,
      completion: phase.completion || 0,
      subItems: convertedSubItems
    };
  };

  return {
    id: capexProject.id,
    projectName: capexProject.name,
    projectOwner: capexProject.owner,
    projectStatus: capexProject.status.charAt(0).toUpperCase() + capexProject.status.slice(1).replace('-', ' ') as 'On Track' | 'At Risk' | 'Impacted',
    projectType: {
      id: projectTypeId,
      name: projectTypeName,
      phaseWeights: defaultWeights
    },
    startDate: new Date(), // Default to current date if not provided
    endDate: new Date(), // Default to current date if not provided
    lastUpdated: new Date(),
    totalBudget: capexProject.budget,
    totalActual: capexProject.spent,
    phases: {
      feasibility: getPhaseData('feasibility') as FeasibilityPhase,
      planning: getPhaseData('planning') as PlanningPhase,
      execution: getPhaseData('execution') as ExecutionPhase,
      close: getPhaseData('close') as ClosePhase
    },
    sesNumber: capexProject.sesNumber,
    upcomingMilestone: capexProject.milestones?.feasibility || capexProject.milestones?.planning || capexProject.milestones?.execution || '',
    financialNotes: capexProject.financialNotes
  };
} 