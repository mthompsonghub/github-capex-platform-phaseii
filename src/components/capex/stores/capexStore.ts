import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Project, ThresholdSettings, defaultSettings } from '../data/capexData';
import { CapExRecord } from '../../../types/capex';
import { supabase } from '../../../lib/supabase';

interface ModalState<T> {
  isOpen: boolean;
  data: T | null;
}

interface CapExState {
  projects: Project[];
  modalState: {
    isOpen: boolean;
    data: Project | CapExRecord | null;
  };
  adminSettings: {
    thresholds: {
      onTrack: number;
      atRisk: number;
    };
  } | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

interface CapExActions {
  setModalState: (state: Partial<CapExState['modalState']>) => void;
  openProjectModal: (project: Project | CapExRecord) => void;
  closeProjectModal: () => void;
  updateFinancialDetails: (projectId: string, updates: {
    sesNumber?: string;
    upcomingMilestone?: string;
    milestoneDueDate?: Date;
    financialNotes?: string;
  }) => Promise<void>;
  fetchProjects: () => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
}

const transformDbProjectToProject = (dbProject: any): Project => {
  return {
    id: dbProject.id,
    projectName: dbProject.project_name,
    projectOwner: dbProject.project_owner,
    startDate: new Date(dbProject.start_date),
    endDate: new Date(dbProject.end_date),
    projectType: {
      id: dbProject.project_type,
      name: dbProject.project_type === 'projects' ? 'Projects' : 'Asset Purchases',
      phaseWeights: {
        feasibility: 15,
        planning: 35,
        execution: 45,
        close: 5
      }
    },
    totalBudget: dbProject.total_budget,
    totalActual: dbProject.total_actual,
    projectStatus: dbProject.project_status as 'On Track' | 'At Risk' | 'Impacted',
    phases: {
      feasibility: {
        id: 'feasibility',
        name: 'Feasibility',
        weight: 15,
        completion: dbProject.feasibility_completion || 0,
        subItems: {
          riskAssessment: { name: 'Risk Assessment', value: dbProject.risk_assessment || 0, isNA: false },
          projectCharter: { name: 'Project Charter', value: dbProject.project_charter || 0, isNA: false }
        }
      },
      planning: {
        id: 'planning',
        name: 'Planning',
        weight: 35,
        completion: dbProject.planning_completion || 0,
        subItems: {
          rfqPackage: { name: 'RFQ Package', value: dbProject.rfq_package || 0, isNA: false },
          validationStrategy: { name: 'Validation Strategy', value: dbProject.validation_strategy || 0, isNA: false },
          financialForecast: { name: 'Financial Forecast', value: dbProject.financial_forecast || 0, isNA: false },
          vendorSolicitation: { name: 'Vendor Solicitation', value: dbProject.vendor_solicitation || 0, isNA: false },
          ganttChart: { name: 'Gantt Chart', value: dbProject.gantt_chart || 0, isNA: false },
          sesAssetNumberApproval: { name: 'SES Asset Number Approval', value: dbProject.ses_asset_number_approval || 0, isNA: false }
        }
      },
      execution: {
        id: 'execution',
        name: 'Execution',
        weight: 45,
        completion: dbProject.execution_completion || 0,
        subItems: {
          poSubmission: { name: 'PO Submission', value: dbProject.po_submission || 0, isNA: false },
          equipmentDesign: { name: 'Equipment Design', value: dbProject.equipment_design || 0, isNA: false },
          equipmentBuild: { name: 'Equipment Build', value: dbProject.equipment_build || 0, isNA: false },
          projectDocumentation: { name: 'Project Documentation/SOP', value: dbProject.project_documentation || 0, isNA: false },
          demoInstall: { name: 'Demo/Install', value: dbProject.demo_install || 0, isNA: false },
          validation: { name: 'Validation', value: dbProject.validation || 0, isNA: false },
          equipmentTurnover: { name: 'Equipment Turnover/Training', value: dbProject.equipment_turnover || 0, isNA: false },
          goLive: { name: 'Go-Live', value: dbProject.go_live || 0, isNA: false }
        }
      },
      close: {
        id: 'close',
        name: 'Close',
        weight: 5,
        completion: dbProject.close_completion || 0,
        subItems: {
          poClosure: { name: 'PO Closure', value: dbProject.po_closure || 0, isNA: false },
          projectTurnover: { name: 'Project Turnover', value: dbProject.project_turnover || 0, isNA: false }
        }
      }
    },
    sesNumber: dbProject.ses_number,
    upcomingMilestone: dbProject.upcoming_milestone,
    milestoneDueDate: dbProject.milestone_due_date ? new Date(dbProject.milestone_due_date) : undefined,
    financialNotes: dbProject.financial_notes,
    lastUpdated: new Date(dbProject.updated_at)
  };
};

// Separate API layer
const capexAPI = {
  async fetchProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*');
      
    if (error) throw error;
    
    return data.map((record: any) => {
      const isProject = record.project_type === 'projects';
      const phaseWeights = {
        feasibility: isProject ? 15 : 0,
        planning: isProject ? 35 : 45,
        execution: isProject ? 45 : 50,
        close: 5
      };

      return {
        id: record.id,
        projectName: record.project_name,
        projectOwner: record.project_owner,
        startDate: new Date(record.start_date),
        endDate: new Date(record.end_date),
        projectType: {
          id: record.project_type,
          name: isProject ? 'Projects' : 'Asset Purchases',
          phaseWeights
        },
        totalBudget: record.total_budget || 0,
        totalActual: record.total_actual || 0,
        projectStatus: record.project_status || 'On Track',
        phases: {
          feasibility: {
            id: 'feasibility',
            name: 'Feasibility',
            weight: phaseWeights.feasibility,
            subItems: [],
            completion: record.feasibility_completion || 0
          },
          planning: {
            id: 'planning',
            name: 'Planning',
            weight: phaseWeights.planning,
            subItems: [],
            completion: record.planning_completion || 0
          },
          execution: {
            id: 'execution',
            name: 'Execution',
            weight: phaseWeights.execution,
            subItems: [],
            completion: record.execution_completion || 0
          },
          close: {
            id: 'close',
            name: 'Close',
            weight: phaseWeights.close,
            subItems: [],
            completion: record.close_completion || 0
          }
        },
        lastUpdated: new Date(record.updated_at)
      };
    });
  },
  
  async fetchAdminSettings(): Promise<ThresholdSettings> {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .single();
      
    if (error) throw error;
    return {
      onTrackThreshold: data.on_track_threshold || defaultSettings.onTrackThreshold,
      atRiskThreshold: data.at_risk_threshold || defaultSettings.atRiskThreshold,
      impactedThreshold: data.impacted_threshold || defaultSettings.impactedThreshold
    };
  },
  
  async updateProject(project: Project): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({
        project_name: project.projectName,
        project_owner: project.projectOwner,
        start_date: project.startDate.toISOString(),
        end_date: project.endDate.toISOString(),
        project_type: project.projectType.id,
        total_budget: project.totalBudget,
        total_actual: project.totalActual,
        project_status: project.projectStatus,
        feasibility_completion: project.phases.feasibility.completion,
        planning_completion: project.phases.planning.completion,
        execution_completion: project.phases.execution.completion,
        close_completion: project.phases.close.completion,
        ses_number: project.sesNumber,
        upcoming_milestone: project.upcomingMilestone,
        milestone_due_date: project.milestoneDueDate,
        financial_notes: project.financialNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', project.id);
      
    if (error) throw error;
  },
  
  async updateAdminSettings(settings: ThresholdSettings): Promise<void> {
    const { error } = await supabase
      .from('admin_settings')
      .update({
        on_track_threshold: settings.onTrackThreshold,
        at_risk_threshold: settings.atRiskThreshold,
        impacted_threshold: settings.impactedThreshold
      })
      .eq('id', 1);
      
    if (error) throw error;
  }
};

export const useCapExStore = create<CapExState & CapExActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        projects: [],
        modalState: {
          isOpen: false,
          data: null
        },
        adminSettings: null,
        isAdmin: false,
        isLoading: false,
        error: null,
        
        // Actions
        setModalState: (state) => {
          set((prev) => ({
            modalState: { ...prev.modalState, ...state }
          }));
        },
        
        openProjectModal: (project) => {
          set({
            modalState: {
              isOpen: true,
              data: project
            }
          });
        },
        
        closeProjectModal: () => {
          set({
            modalState: {
              isOpen: false,
              data: null
            }
          });
        },
        
        async updateFinancialDetails(projectId: string, updates) {
          set({ isLoading: true, error: null });
          try {
            const { error } = await supabase
              .from('capex_projects')
              .update({
                ses_number: updates.sesNumber,
                upcoming_milestone: updates.upcomingMilestone,
                milestone_due_date: updates.milestoneDueDate?.toISOString(),
                financial_notes: updates.financialNotes,
                updated_at: new Date().toISOString()
              })
              .eq('id', projectId);

            if (error) throw error;

            // Update local state
            set((state) => ({
              projects: state.projects.map((project) =>
                project.id === projectId
                  ? {
                      ...project,
                      sesNumber: updates.sesNumber ?? project.sesNumber,
                      upcomingMilestone: updates.upcomingMilestone ?? project.upcomingMilestone,
                      milestoneDueDate: updates.milestoneDueDate ?? project.milestoneDueDate,
                      financialNotes: updates.financialNotes ?? project.financialNotes
                    }
                  : project
              ),
              isLoading: false
            }));
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
          }
        },
        
        async fetchProjects() {
          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase
              .from('capex_projects')
              .select('*');

            if (error) throw error;

            set({ 
              projects: (data || []).map(transformDbProjectToProject),
              isLoading: false 
            });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
          }
        },
        
        async updateProject(project: Project) {
          console.log('🚀 === STORE updateProject called ===');
          console.log('📋 Financial fields received in store:', {
            sesNumber: project.sesNumber,
            upcomingMilestone: project.upcomingMilestone,
            financialNotes: project.financialNotes
          });
          set({ isLoading: true, error: null });
          try {
            console.log('💰 Financial fields check:', {
              sesNumber: project.sesNumber,
              upcomingMilestone: project.upcomingMilestone,
              financialNotes: project.financialNotes
            });
            const updates = {
              project_name: project.projectName,
              project_owner: project.projectOwner,
              project_type: project.projectType?.id || project.projectType,
              start_date: project.startDate,
              end_date: project.endDate,
              total_budget: project.totalBudget,
              total_actual: project.totalActual,
              project_status: project.projectStatus,
              phases_data: JSON.stringify(project.phases),
              updated_at: new Date().toISOString(),
              ses_number: project.sesNumber,
              upcoming_milestone: project.upcomingMilestone,
              financial_notes: project.financialNotes
            };
            console.log('💰 Financial fields in updates object:', {
              ses_number: updates.ses_number,
              upcoming_milestone: updates.upcoming_milestone,
              financial_notes: updates.financial_notes
            });
            console.log('Database update payload:', updates);
            const { error } = await supabase
              .from('capex_projects')
              .update(updates)
              .eq('id', project.id);

            if (error) throw error;

            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === project.id ? project : p
              ),
              isLoading: false
            }));
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
          }
        }
      })),
      {
        name: 'capex-store',
        partialize: (state) => ({
          adminSettings: state.adminSettings
        })
      }
    )
  )
);

// Selectors
export const useProjects = () => useCapExStore((state) => state.projects);
export const useAdminSettings = () => useCapExStore((state) => state.adminSettings);
export const useProjectModal = () => useCapExStore((state) => state.modalState);
export const useCapExLoading = () => useCapExStore((state) => state.isLoading);
export const useCapExErrors = () => useCapExStore((state) => state.error); 