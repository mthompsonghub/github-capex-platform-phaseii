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
  // Data
  projects: Project[];
  adminSettings: ThresholdSettings;
  
  // UI State
  modals: {
    projectForm: ModalState<Project | CapExRecord>;
    adminSettings: ModalState<ThresholdSettings>;
  };
  
  // Loading States
  isLoading: {
    projects: boolean;
    adminSettings: boolean;
  };
  
  // Error States
  errors: {
    projects: string | null;
    adminSettings: string | null;
  };
  
  // Actions
  fetchProjects: () => Promise<void>;
  fetchAdminSettings: () => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  updateAdminSettings: (settings: ThresholdSettings) => Promise<void>;
  setModalState: <T extends keyof CapExState['modals']>(
    modal: T,
    state: Partial<ModalState<any>>
  ) => void;
  openProjectModal: (project: Project | CapExRecord) => void;
}

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

export const useCapExStore = create<CapExState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        projects: [],
        adminSettings: defaultSettings,
        
        modals: {
          projectForm: { isOpen: false, data: null },
          adminSettings: { isOpen: false, data: null }
        },
        
        isLoading: {
          projects: false,
          adminSettings: false
        },
        
        errors: {
          projects: null,
          adminSettings: null
        },
        
        // Actions
        fetchProjects: async () => {
          set(state => ({ isLoading: { ...state.isLoading, projects: true } }));
          try {
            const projects = await capexAPI.fetchProjects();
            set({ 
              projects,
              errors: { ...get().errors, projects: null }
            });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            set(state => ({ 
              errors: { ...state.errors, projects: errorMessage }
            }));
          } finally {
            set(state => ({ isLoading: { ...state.isLoading, projects: false } }));
          }
        },
        
        fetchAdminSettings: async () => {
          set(state => ({ isLoading: { ...state.isLoading, adminSettings: true } }));
          try {
            const settings = await capexAPI.fetchAdminSettings();
            set({ 
              adminSettings: settings,
              errors: { ...get().errors, adminSettings: null }
            });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            set(state => ({ 
              errors: { ...state.errors, adminSettings: errorMessage }
            }));
          } finally {
            set(state => ({ isLoading: { ...state.isLoading, adminSettings: false } }));
          }
        },
        
        updateProject: async (project: Project) => {
          try {
            await capexAPI.updateProject(project);
            await get().fetchProjects();
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            set(state => ({ 
              errors: { ...state.errors, projects: errorMessage }
            }));
          }
        },
        
        updateAdminSettings: async (settings: ThresholdSettings) => {
          try {
            await capexAPI.updateAdminSettings(settings);
            await get().fetchAdminSettings();
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            set(state => ({ 
              errors: { ...state.errors, adminSettings: errorMessage }
            }));
          }
        },
        
        setModalState: (modal, state) => {
          set(draft => {
            draft.modals[modal] = { ...draft.modals[modal], ...state };
          });
        },
        
        openProjectModal: (project: Project | CapExRecord) => {
          set(draft => {
            draft.modals.projectForm = {
              isOpen: true,
              data: project
            };
          });
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
export const useProjectModal = () => useCapExStore((state) => state.modals.projectForm);
export const useAdminModal = () => useCapExStore((state) => state.modals.adminSettings);
export const useCapExLoading = () => useCapExStore((state) => state.isLoading);
export const useCapExErrors = () => useCapExStore((state) => state.errors); 