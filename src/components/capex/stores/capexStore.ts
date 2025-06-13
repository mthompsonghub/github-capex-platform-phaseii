import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Project, AdminSettings, ModalState, ProjectTransformer } from '../types/capex-unified';
import { supabase } from '../../../lib/supabase';

interface CapExState {
  // Data
  projects: Project[];
  adminSettings: AdminSettings;
  
  // UI State
  modals: {
    projectForm: ModalState<Project>;
    adminSettings: ModalState<AdminSettings>;
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
  updateAdminSettings: (settings: AdminSettings) => Promise<void>;
  setModalState: <T extends keyof CapExState['modals']>(
    modal: T,
    state: Partial<ModalState<any>>
  ) => void;
}

// Separate API layer
const capexAPI = {
  async fetchProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*');
      
    if (error) throw error;
    
    const transformedProjects = data.map(ProjectTransformer.fromDatabase);
    
    return transformedProjects;
  },
  
  async fetchAdminSettings(): Promise<AdminSettings> {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async updateProject(project: Project): Promise<void> {
    const dbRecord = ProjectTransformer.toDatabase(project);
    
    const { error } = await supabase
      .from('projects')
      .update(dbRecord)
      .eq('id', project.id);
      
    if (error) throw error;
  },
  
  async updateAdminSettings(settings: AdminSettings): Promise<void> {
    const { error } = await supabase
      .from('admin_settings')
      .update(settings)
      .eq('id', settings.id);
      
    if (error) throw error;
  }
};

export const useCapExStore = create<CapExState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        projects: [],
        adminSettings: {
          id: 1,
          onTrackThreshold: 90,
          atRiskThreshold: 80,
          showFinancials: true,
          phaseWeights: {
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
          }
        },
        
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
            const { data, error } = await supabase
              .from('projects')
              .select('*');
              
            if (error) throw error;
            
            const transformedProjects = data.map(ProjectTransformer.fromDatabase);
            
            set({ 
              projects: transformedProjects,
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
            const { data, error } = await supabase
              .from('admin_settings')
              .select('*')
              .single();
              
            if (error) throw error;
            
            set({ 
              adminSettings: data,
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
            const dbRecord = ProjectTransformer.toDatabase(project);
            
            const { error } = await supabase
              .from('projects')
              .update(dbRecord)
              .eq('id', project.id);
              
            if (error) throw error;
            
            // Update local state
            set(state => ({
              projects: state.projects.map((p: Project) => 
                p.id === project.id ? project : p
              )
            }));
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            set(state => ({ 
              errors: { ...state.errors, projects: errorMessage }
            }));
            throw error;
          }
        },
        
        updateAdminSettings: async (settings: AdminSettings) => {
          try {
            const { error } = await supabase
              .from('admin_settings')
              .update(settings)
              .eq('id', settings.id);
              
            if (error) throw error;
            
            set({ adminSettings: settings });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            set(state => ({ 
              errors: { ...state.errors, adminSettings: errorMessage }
            }));
            throw error;
          }
        },
        
        setModalState: (modal, state) => {
          set(prevState => ({
            modals: {
              ...prevState.modals,
              [modal]: {
                ...prevState.modals[modal],
                ...state
              }
            }
          }));
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