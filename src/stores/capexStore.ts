import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AdminSettings, ModalState } from '../types/capex';
import { Project } from '../components/capex/data/capexData';
import { supabase } from '../lib/supabase';

interface CapExState {
  // Data
  projects: Project[];
  adminSettings: AdminSettings;
  
  // Permissions
  permissions: {
    canEditBudgets: boolean;
    canEditDates: boolean;
    isAdmin: boolean;
  };
  
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

    // Initialize permissions based on user role
    initializePermissions: () => Promise<void>;
  };
}

// Separate API layer
const capexAPI = {
  async fetchProjects(): Promise<any[]> {
    console.log('Store - loadProjects called');
    const { data, error } = await supabase
      .from('capex_projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Debug logging
    console.log('Raw Supabase data:', JSON.stringify(data, null, 2));
    console.log('Data structure check:', {
      isArray: Array.isArray(data),
      length: data?.length,
      firstItem: data?.[0] ? {
        hasId: 'id' in data[0],
        hasProjectName: 'project_name' in data[0],
        hasProjectType: 'project_type' in data[0],
        projectTypeValue: data[0].project_type,
        hasPhases: 'phases' in data[0],
        keys: Object.keys(data?.[0] || {})
      } : 'no data'
    });
    
    if (error) {
      console.error('Store - Supabase query error:', error);
      throw error;
    }
    console.log('Store - fetched data:', data);
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
  },

  async fetchUserRole(): Promise<{ role: string }> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    const { data, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .single();
      
    if (roleError) throw roleError;
    return data;
  }
};

// Helper function to initialize permissions based on role
const initializePermissions = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin':
      return {
        canEditBudgets: true,
        canEditDates: true,
        isAdmin: true
      };
    case 'manager':
      return {
        canEditBudgets: true,
        canEditDates: true,
        isAdmin: false
      };
    case 'viewer':
      return {
        canEditBudgets: false,
        canEditDates: false,
        isAdmin: false
      };
    default:
      return {
        canEditBudgets: false,
        canEditDates: false,
        isAdmin: false
      };
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
        
        permissions: {
          canEditBudgets: false,
          canEditDates: false,
          isAdmin: false
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
            console.log('Store - loadProjects action started');
            set((state) => {
              state.loading.projects = true;
              state.errors.projects = null;
            });
            
            try {
              const projects = await capexAPI.fetchProjects();
              console.log('Store - Projects loaded successfully:', projects);
              // Transform to match Project type
              const transformedData = (projects || []).map(item => {
                const isProject = item.project_type === 'projects';
                const phaseWeights = {
                  feasibility: isProject ? 15 : 0,
                  planning: isProject ? 35 : 45,
                  execution: isProject ? 45 : 50,
                  close: 5
                };

                // Debug the raw item
                console.log('Transforming item:', {
                  id: item.id,
                  project_type: item.project_type,
                  phase_completions: {
                    feasibility: item.feasibility_completion,
                    planning: item.planning_completion,
                    execution: item.execution_completion,
                    close: item.close_completion
                  }
                });

                return {
                  id: item.id,
                  projectName: item.project_name || 'Unnamed Project',
                  projectOwner: item.project_owner || 'Unknown',
                  projectStatus: item.project_status || 'On Track',
                  startDate: new Date(item.start_date || new Date()),
                  endDate: new Date(item.end_date || new Date()),
                  projectType: {
                    id: item.project_type || 'projects',
                    name: isProject ? 'Projects' : 'Asset Purchases',
                    phaseWeights
                  },
                  totalBudget: item.total_budget || 0,
                  totalActual: item.total_actual || 0,
                  phases: {
                    feasibility: {
                      id: 'feasibility',
                      name: 'Feasibility',
                      weight: phaseWeights.feasibility,
                      completion: 75,
                      subItems: item.feasibility_subitems || []
                    },
                    planning: {
                      id: 'planning',
                      name: 'Planning',
                      weight: phaseWeights.planning,
                      completion: 50,
                      subItems: item.planning_subitems || []
                    },
                    execution: {
                      id: 'execution',
                      name: 'Execution',
                      weight: phaseWeights.execution,
                      completion: 25,
                      subItems: item.execution_subitems || []
                    },
                    close: {
                      id: 'close',
                      name: 'Close',
                      weight: phaseWeights.close,
                      completion: 10,
                      subItems: item.close_subitems || []
                    }
                  },
                  comments: item.description || '',
                  lastUpdated: new Date(item.updated_at || new Date()),
                  yearlyBudget: item.yearly_budget || 0,
                  yearlyActual: item.yearly_actual || 0,
                  upcomingMilestone: item.upcoming_milestone || '',
                  sesAssetNumber: item.ses_asset_number || ''
                };
              });
              console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
              set((state) => {
                state.projects = transformedData;
                state.loading.projects = false;
              });
            } catch (error) {
              console.error('Store - Failed to load projects:', error);
              set((state) => {
                state.errors.projects = error as Error;
                state.loading.projects = false;
              });
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
              state.modals.editProject = {
                isOpen: true,
                data: project
              };
            });
          },
          
          closeProjectModal: () => {
            set((state) => {
              state.modals.editProject = {
                isOpen: false,
                data: null
              };
            });
          },
          
          openAdminModal: () => {
            set((state) => {
              state.modals.adminConfig = {
                isOpen: true,
                data: state.adminSettings
              };
            });
          },
          
          closeAdminModal: () => {
            set((state) => {
              state.modals.adminConfig = {
                isOpen: false,
                data: null
              };
            });
          },
          
          // Error Management
          clearError: (type) => {
            set((state) => {
              state.errors[type] = null;
            });
          },

          // Initialize permissions based on user role
          initializePermissions: async () => {
            try {
              const { role } = await capexAPI.fetchUserRole();
              set((state) => {
                state.permissions = initializePermissions(role);
              });
            } catch (error) {
              console.error('Failed to initialize permissions:', error);
              // Set default permissions on error
              set((state) => {
                state.permissions = {
                  canEditBudgets: false,
                  canEditDates: false,
                  isAdmin: false
                };
              });
            }
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

// Selector hooks
export const useProjects = () => useCapExStore((state) => state.projects);
export const useAdminSettings = () => useCapExStore((state) => state.adminSettings);
export const useProjectModal = () => useCapExStore((state) => state.modals.editProject);
export const useAdminModal = () => useCapExStore((state) => state.modals.adminConfig);
export const useCapExActions = () => useCapExStore((state) => state.actions);
export const useCapExLoading = () => useCapExStore((state) => state.loading);
export const useCapExErrors = () => useCapExStore((state) => state.errors);
export const useCapExPermissions = () => useCapExStore((state) => state.permissions); 