import { useState, useEffect } from 'react';
import { 
  Project, 
  PROJECT_TYPES,
  PHASE_SUB_ITEMS,
  createEmptyProject,
  calculatePhaseCompletion,
  calculateOverallCompletion,
  determineProjectStatus
} from '../components/capex/data/capexData';

// Sample data for development - replace with actual API call
const sampleData: Project[] = [
  // Cardinal Capital Project - Impacted Status
  {
    id: '1',
    projectName: 'Cardinal Capital Project',
    projectOwner: 'T. Bolt',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    projectType: PROJECT_TYPES.PROJECTS,
    totalBudget: 1604000, // $1,604K
    totalActual: 123000,  // $123K
    projectStatus: 'Impacted' as Project['projectStatus'],
    phases: {
      feasibility: {
        id: 'feasibility',
        name: 'Feasibility',
        weight: PROJECT_TYPES.PROJECTS.phaseWeights.feasibility,
        completion: 40,
        subItems: [
          { id: 'risk_assessment', name: 'Risk Assessment', value: 45, isNA: false },
          { id: 'project_charter', name: 'Project Charter', value: 35, isNA: false }
        ]
      },
      planning: {
        id: 'planning',
        name: 'Planning',
        weight: PROJECT_TYPES.PROJECTS.phaseWeights.planning,
        completion: 30,
        subItems: [
          { id: 'rfq_package', name: 'RFQ Package', value: 35, isNA: false },
          { id: 'validation_strategy', name: 'Validation Strategy', value: 25, isNA: false },
          { id: 'financial_forecast', name: 'Financial Forecast', value: 40, isNA: false },
          { id: 'vendor_solicitation', name: 'Vendor Solicitation', value: 30, isNA: false },
          { id: 'gantt_chart', name: 'Gantt Chart', value: 20, isNA: false },
          { id: 'ses_asset_number', name: 'SES Asset Number Approval', value: 30, isNA: false }
        ]
      },
      execution: {
        id: 'execution',
        name: 'Execution',
        weight: PROJECT_TYPES.PROJECTS.phaseWeights.execution,
        completion: 15,
        subItems: [
          { id: 'po_submission', name: 'PO Submission', value: 20, isNA: false },
          { id: 'equipment_design', name: 'Equipment Design', value: 15, isNA: false },
          { id: 'equipment_build', name: 'Equipment Build', value: 10, isNA: false },
          { id: 'project_documentation', name: 'Project Documentation/SOP', value: 15, isNA: false },
          { id: 'demo_install', name: 'Demo/Install', value: 10, isNA: false },
          { id: 'validation', name: 'Validation', value: 20, isNA: false },
          { id: 'equipment_turnover', name: 'Equipment Turnover/Training', value: 15, isNA: false },
          { id: 'go_live', name: 'Go-Live', value: 10, isNA: false }
        ]
      },
      close: {
        id: 'close',
        name: 'Close',
        weight: PROJECT_TYPES.PROJECTS.phaseWeights.close,
        completion: 0,
        subItems: [
          { id: 'po_closure', name: 'PO Closure', value: 0, isNA: false },
          { id: 'project_turnover', name: 'Project Turnover', value: 0, isNA: false }
        ]
      }
    },
    comments: 'Awaiting stakeholder feedback',
    lastUpdated: new Date()
  },
  // DeltaV Migration - Impacted Status
  {
    id: '2',
    projectName: 'DeltaV Migration',
    projectOwner: 'M. Smith',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    projectType: PROJECT_TYPES.PROJECTS,
    totalBudget: 2500000, // $2,500K
    totalActual: 1250000, // $1,250K
    projectStatus: 'Impacted' as Project['projectStatus'],
    phases: {
      feasibility: {
        id: 'feasibility',
        name: 'Feasibility',
        weight: PROJECT_TYPES.PROJECTS.phaseWeights.feasibility,
        completion: 50,
        subItems: [
          { id: 'risk_assessment', name: 'Risk Assessment', value: 55, isNA: false },
          { id: 'project_charter', name: 'Project Charter', value: 45, isNA: false }
        ]
      },
      planning: {
        id: 'planning',
        name: 'Planning',
        weight: PROJECT_TYPES.PROJECTS.phaseWeights.planning,
        completion: 40,
        subItems: [
          { id: 'rfq_package', name: 'RFQ Package', value: 45, isNA: false },
          { id: 'validation_strategy', name: 'Validation Strategy', value: 35, isNA: false },
          { id: 'financial_forecast', name: 'Financial Forecast', value: 40, isNA: false },
          { id: 'vendor_solicitation', name: 'Vendor Solicitation', value: 45, isNA: false },
          { id: 'gantt_chart', name: 'Gantt Chart', value: 35, isNA: false },
          { id: 'ses_asset_number', name: 'SES Asset Number Approval', value: 40, isNA: false }
        ]
      },
      execution: {
        id: 'execution',
        name: 'Execution',
        weight: PROJECT_TYPES.PROJECTS.phaseWeights.execution,
        completion: 25,
        subItems: [
          { id: 'po_submission', name: 'PO Submission', value: 30, isNA: false },
          { id: 'equipment_design', name: 'Equipment Design', value: 25, isNA: false },
          { id: 'equipment_build', name: 'Equipment Build', value: 20, isNA: false },
          { id: 'project_documentation', name: 'Project Documentation/SOP', value: 25, isNA: false },
          { id: 'demo_install', name: 'Demo/Install', value: 20, isNA: false },
          { id: 'validation', name: 'Validation', value: 30, isNA: false },
          { id: 'equipment_turnover', name: 'Equipment Turnover/Training', value: 25, isNA: false },
          { id: 'go_live', name: 'Go-Live', value: 20, isNA: false }
        ]
      },
      close: {
        id: 'close',
        name: 'Close',
        weight: PROJECT_TYPES.PROJECTS.phaseWeights.close,
        completion: 0,
        subItems: [
          { id: 'po_closure', name: 'PO Closure', value: 0, isNA: false },
          { id: 'project_turnover', name: 'Project Turnover', value: 0, isNA: false }
        ]
      }
    },
    comments: 'Equipment design review pending',
    lastUpdated: new Date()
  },
  // Capital IT Server Replacement - On Track Status
  {
    id: '3',
    projectName: 'Capital IT Server Replacement',
    projectOwner: 'R. Johnson',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    projectType: PROJECT_TYPES.ASSET_PURCHASES,
    totalBudget: 750000,  // $750K
    totalActual: 600000,  // $600K
    projectStatus: 'On Track' as Project['projectStatus'],
    phases: {
      feasibility: {
        id: 'feasibility',
        name: 'Feasibility',
        weight: PROJECT_TYPES.ASSET_PURCHASES.phaseWeights.feasibility,
        completion: 100,
        subItems: [
          { id: 'risk_assessment', name: 'Risk Assessment', value: 100, isNA: false },
          { id: 'project_charter', name: 'Project Charter', value: 100, isNA: false }
        ]
      },
      planning: {
        id: 'planning',
        name: 'Planning',
        weight: PROJECT_TYPES.ASSET_PURCHASES.phaseWeights.planning,
        completion: 95,
        subItems: [
          { id: 'rfq_package', name: 'RFQ Package', value: 100, isNA: false },
          { id: 'validation_strategy', name: 'Validation Strategy', value: 95, isNA: false },
          { id: 'financial_forecast', name: 'Financial Forecast', value: 100, isNA: false },
          { id: 'vendor_solicitation', name: 'Vendor Solicitation', value: 90, isNA: false },
          { id: 'gantt_chart', name: 'Gantt Chart', value: 95, isNA: false },
          { id: 'ses_asset_number', name: 'SES Asset Number Approval', value: 90, isNA: false }
        ]
      },
      execution: {
        id: 'execution',
        name: 'Execution',
        weight: PROJECT_TYPES.ASSET_PURCHASES.phaseWeights.execution,
        completion: 85,
        subItems: [
          { id: 'po_submission', name: 'PO Submission', value: 100, isNA: false },
          { id: 'equipment_design', name: 'Equipment Design', value: 90, isNA: false },
          { id: 'equipment_build', name: 'Equipment Build', value: 85, isNA: false },
          { id: 'project_documentation', name: 'Project Documentation/SOP', value: 80, isNA: false },
          { id: 'demo_install', name: 'Demo/Install', value: 85, isNA: false },
          { id: 'validation', name: 'Validation', value: 80, isNA: false },
          { id: 'equipment_turnover', name: 'Equipment Turnover/Training', value: 85, isNA: false },
          { id: 'go_live', name: 'Go-Live', value: 75, isNA: false }
        ]
      },
      close: {
        id: 'close',
        name: 'Close',
        weight: PROJECT_TYPES.ASSET_PURCHASES.phaseWeights.close,
        completion: 0,
        subItems: [
          { id: 'po_closure', name: 'PO Closure', value: 0, isNA: false },
          { id: 'project_turnover', name: 'Project Turnover', value: 0, isNA: false }
        ]
      }
    },
    comments: 'Server installation progressing well',
    lastUpdated: new Date()
  }
].map(project => {
  // Recalculate phase completions and overall status
  const updatedProject = { ...project };
  
  // Update phase completions
  Object.values(updatedProject.phases).forEach(phase => {
    phase.completion = calculatePhaseCompletion(phase.subItems);
  });
  
  // Update overall completion and status
  const completion = calculateOverallCompletion(updatedProject);
  updatedProject.projectStatus = determineProjectStatus(completion, 100);
  
  return updatedProject;
});

interface UseCapExDataResult {
  data: Project[];
  isLoading: boolean;
  error: Error | null;
  updateProject: (updatedProject: Project) => void;
}

export const useCapExData = (): UseCapExDataResult => {
  const [data, setData] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(sampleData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred while fetching data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateProject = async (updatedProject: Project) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recalculate phase completions and status before updating
      const recalculatedProject = { ...updatedProject };
      
      // Update phase completions
      Object.values(recalculatedProject.phases).forEach(phase => {
        phase.completion = calculatePhaseCompletion(phase.subItems);
      });
      
      // Update overall completion and status
      const completion = calculateOverallCompletion(recalculatedProject);
      recalculatedProject.projectStatus = determineProjectStatus(completion, 100);
      
      setData(prevData => 
        prevData.map(project => 
          project.id === recalculatedProject.id ? recalculatedProject : project
        )
      );
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred while updating the project'));
    }
  };

  return { data, isLoading, error, updateProject };
}; 