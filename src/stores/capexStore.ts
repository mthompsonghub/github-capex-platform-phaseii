import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AdminSettings, ModalState } from '../types/capex';
import { Project } from '../types';
import { supabase } from '../lib/supabase';

interface CapExState {
  // Data
  projects: Project[];
  adminSettings: AdminSettings;
  
  // UI State
  modals: {
    editProject: ModalState<Project>;
    adminConfig: ModalState<AdminSettings>;
  };
  
  // Loading States
  loading: {
    projects: boolean;
    adminSettings: boolean;
  };
  
  // Error States
  errors: {
    projects: Error | null;
    adminSettings: Error | null;
  };
  
  // Actions
  actions: {
    // Project Actions
    loadProjects: () => Promise<void>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    
    // Admin Actions
    loadAdminSettings: () => Promise<void>;
    updateAdminSettings: (settings: Partial<AdminSettings>) => Promise<void>;
    
    // Modal Actions
    openProjectModal: (project: Project) => void;
    closeProjectModal: () => void;
    openAdminModal: () => void;
    closeAdminModal: () => void;
    
    // Error Actions
    clearError: (type: 'projects' | 'adminSettings') => void;
  };
}

// Separate API layer
const capexAPI = {
  async fetchProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('capex_projects')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },
  
  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const { error } = await supabase
      .from('capex_projects')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
  },
  
  async fetchAdminSettings(): Promise<AdminSettings> {
    const { data, error } = await supabase
      .from('capex_system_settings')
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<void> {
    const { error } = await supabase
      .from('capex_system_settings')
      .update(settings)
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
        adminSettings: {
          onTrackThreshold: 90,
          atRiskThreshold: 80,
          showFinancials: true
        },
        
        modals: {
          editProject: { isOpen: false, data: null },
          adminConfig: { isOpen: false, data: null }
        },
        
        loading: {
          projects: false,
          adminSettings: false
        },
        
        errors: {
          projects: null,
          adminSettings: null
        },
        
        actions: {
          // Project Actions with Error Handling
          loadProjects: async () => {
            set((state) => {
              state.loading.projects = true;
              state.errors.projects = null;
            });
            
            try {
              const projects = await capexAPI.fetchProjects();
              set((state) => {
                state.projects = projects;
                state.loading.projects = false;
              });
            } catch (error) {
              set((state) => {
                state.errors.projects = error as Error;
                state.loading.projects = false;
              });
              console.error('Failed to load projects:', error);
            }
          },
          
          updateProject: async (id, updates) => {
            // Optimistic update
            set((state) => {
              const index = state.projects.findIndex((p: Project) => p.id === id);
              if (index !== -1) {
                state.projects[index] = { ...state.projects[index], ...updates };
              }
            });
            
            try {
              await capexAPI.updateProject(id, updates);
            } catch (error) {
              // Revert on error
              get().actions.loadProjects();
              throw error;
            }
          },
          
          // Admin Settings Actions
          loadAdminSettings: async () => {
            set((state) => {
              state.loading.adminSettings = true;
              state.errors.adminSettings = null;
            });
            
            try {
              const settings = await capexAPI.fetchAdminSettings();
              set((state) => {
                state.adminSettings = settings;
                state.loading.adminSettings = false;
              });
            } catch (error) {
              set((state) => {
                state.errors.adminSettings = error as Error;
                state.loading.adminSettings = false;
              });
            }
          },
          
          updateAdminSettings: async (settings) => {
            // Optimistic update
            const previousSettings = get().adminSettings;
            set((state) => {
              state.adminSettings = { ...state.adminSettings, ...settings };
            });
            
            try {
              await capexAPI.updateAdminSettings(settings);
            } catch (error) {
              // Revert on error
              set((state) => {
                state.adminSettings = previousSettings;
              });
              throw error;
            }
          },
          
          // Modal Management
          openProjectModal: (project) => {
            set((state) => {
              state.modals.editProject = { isOpen: true, data: project };
            });
          },
          
          closeProjectModal: () => {
            set((state) => {
              state.modals.editProject = { isOpen: false, data: null };
            });
          },
          
          openAdminModal: () => {
            set((state) => {
              state.modals.adminConfig = { 
                isOpen: true, 
                data: get().adminSettings 
              };
            });
          },
          
          closeAdminModal: () => {
            set((state) => {
              state.modals.adminConfig = { isOpen: false, data: null };
            });
          },
          
          clearError: (type) => {
            set((state) => {
              state.errors[type] = null;
            });
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

// Convenience hooks
export const useProjects = () => useCapExStore((state) => state.projects);
export const useAdminSettings = () => useCapExStore((state) => state.adminSettings);
export const useProjectModal = () => useCapExStore((state) => state.modals.editProject);
export const useAdminModal = () => useCapExStore((state) => state.modals.adminConfig);
export const useCapExActions = () => useCapExStore((state) => state.actions);
export const useCapExLoading = () => useCapExStore((state) => state.loading);
export const useCapExErrors = () => useCapExStore((state) => state.errors); 