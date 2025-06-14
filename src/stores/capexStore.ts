import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AdminSettings, ModalState, CapExRecord } from '../types/capex';
import { Project, PROJECT_TYPES } from '../components/capex/data/capexData';
import { supabase } from '../lib/supabase';

interface CapExStore {
  projects: Project[];
  adminSettings: AdminSettings | null;
  modalState: ModalState<Project | string>;
  isAdmin: boolean;
  actions: {
    fetchProjects: () => Promise<any[]>;
    updateProject: (project: Project) => Promise<void>;
    fetchAdminSettings: () => Promise<AdminSettings | null>;
    updateAdminSettings: (settings: Partial<AdminSettings>) => Promise<void>;
    fetchUserRole: () => Promise<string>;
    openProjectModal: (project: Project) => void;
    closeProjectModal: () => void;
    setIsAdmin: (value: boolean) => void;
    openAdminModal: () => void;
  };
}

// Create the store
const useStore = create<CapExStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        projects: [],
        adminSettings: null,
        modalState: {
          isOpen: false,
          data: null
        },
        isAdmin: false,
        actions: {
          async fetchProjects() {
            try {
              const { data, error } = await supabase
                .from('capex_projects')
                .select('*');

              if (error) throw error;

              if (data) {
                const transformedProjects = data.map(transformDbProjectToProject);
                set((state) => {
                  state.projects = transformedProjects;
                });
              }

              return data || [];
            } catch (error) {
              console.error('Error fetching projects:', error);
              return [];
            }
          },

          async updateProject(project: Project) {
            console.log('Updating project:', project.projectName);
            console.log('Project ID:', project.id);
            try {
              // Only update the basic fields that we know work
              const dbUpdate = {
                project_name: project.projectName,
                project_owner: project.projectOwner,
                updated_at: new Date().toISOString()
              };

              console.log('Database update payload:', dbUpdate);

              // Simple update without returning data first
              const { error } = await supabase
                .from('capex_projects')
                .update(dbUpdate)
                .eq('id', project.id);

              if (error) {
                console.error('Database update error:', error);
                throw error;
              }

              console.log('Update successful, updating local store...');

              // Update the local store directly with the new values
              set((state) => {
                const projectIndex = state.projects.findIndex(p => p.id === project.id);
                if (projectIndex !== -1) {
                  state.projects[projectIndex] = {
                    ...state.projects[projectIndex],
                    projectName: project.projectName,
                    projectOwner: project.projectOwner
                  };
                  console.log('Local store updated');
                }
              });

            } catch (error) {
              console.error('Error updating project:', error);
              throw error;
            }
          },

          async fetchAdminSettings() {
            try {
              const { data, error } = await supabase
                .from('capex_system_settings')
                .select('*')
                .single();

              if (error) throw error;

              if (data) {
                set((state) => {
                  state.adminSettings = data;
                });
              }

              return data;
            } catch (error) {
              console.error('Error fetching admin settings:', error);
              return null;
            }
          },

          async updateAdminSettings(settings: Partial<AdminSettings>) {
            try {
              const { data, error } = await supabase
                .from('capex_system_settings')
                .update(settings)
                .select()
                .single();

              if (error) throw error;

              if (data) {
                set((state) => {
                  state.adminSettings = data;
                });
              }
            } catch (error) {
              console.error('Error updating admin settings:', error);
              throw error;
            }
          },

          async fetchUserRole() {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return 'user';

              const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

              if (error) throw error;
              return data?.role || 'user';
            } catch (error) {
              console.error('Error fetching user role:', error);
              return 'user';
            }
          },

          openProjectModal(project: Project) {
            set((state) => {
              state.modalState = {
                isOpen: true,
                data: project
              };
            });
          },

          closeProjectModal() {
            set((state) => {
              state.modalState = {
                isOpen: false,
                data: null
              };
            });
          },

          setIsAdmin: (value: boolean) => set(state => { state.isAdmin = value; }),
          openAdminModal: () => set(state => {
            state.modalState = { isOpen: true, data: 'admin' };
          }),
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

// Helper function to transform database project to Project type
function transformDbProjectToProject(dbProject: any): Project {
  // Create default phases structure since it's not stored in DB yet
  const phases = {
    feasibility: {
      id: 'feasibility',
      name: 'Feasibility',
      weight: dbProject.project_type === 'projects' ? 15 : 0,
      completion: 0,
      subItems: [
        { id: 'risk_assessment', name: 'Risk Assessment', value: 0, isNA: false },
        { id: 'project_charter', name: 'Project Charter', value: 0, isNA: false }
      ]
    },
    planning: {
      id: 'planning',
      name: 'Planning', 
      weight: dbProject.project_type === 'projects' ? 35 : 45,
      completion: 0,
      subItems: [
        { id: 'rfq_package', name: 'RFQ Package', value: 0, isNA: false },
        { id: 'validation_strategy', name: 'Validation Strategy', value: 0, isNA: false },
        { id: 'financial_forecast', name: 'Financial Forecast', value: 0, isNA: false },
        { id: 'vendor_solicitation', name: 'Vendor Solicitation', value: 0, isNA: false },
        { id: 'gantt_chart', name: 'Gantt Chart', value: 0, isNA: false },
        { id: 'ses_asset_number', name: 'SES Asset Number Approval', value: 0, isNA: false }
      ]
    },
    execution: {
      id: 'execution',
      name: 'Execution',
      weight: dbProject.project_type === 'projects' ? 45 : 50,
      completion: 0,
      subItems: [
        { id: 'po_submission', name: 'PO Submission', value: 0, isNA: false },
        { id: 'equipment_design', name: 'Equipment Design', value: 0, isNA: false },
        { id: 'equipment_build', name: 'Equipment Build', value: 0, isNA: false },
        { id: 'project_documentation', name: 'Project Documentation/SOP', value: 0, isNA: false },
        { id: 'demo_install', name: 'Demo/Install', value: 0, isNA: false },
        { id: 'validation', name: 'Validation', value: 0, isNA: false },
        { id: 'equipment_turnover', name: 'Equipment Turnover/Training', value: 0, isNA: false },
        { id: 'go_live', name: 'Go-Live', value: 0, isNA: false }
      ]
    },
    close: {
      id: 'close',
      name: 'Close',
      weight: 5,
      completion: 0,
      subItems: [
        { id: 'po_closure', name: 'PO Closure', value: 0, isNA: false },
        { id: 'project_turnover', name: 'Project Turnover', value: 0, isNA: false }
      ]
    }
  };

  const projectType = dbProject.project_type === 'projects' ? PROJECT_TYPES.PROJECTS : PROJECT_TYPES.ASSET_PURCHASES;

  return {
    id: dbProject.id,
    projectName: dbProject.project_name,
    projectOwner: dbProject.project_owner,
    startDate: dbProject.start_date,
    endDate: dbProject.end_date,
    projectType: projectType,
    totalBudget: dbProject.total_budget,
    totalActual: dbProject.total_actual,
    projectStatus: dbProject.project_status,
    phases: phases,
    upcomingMilestone: dbProject.upcoming_milestone,
    comments: dbProject.project_comments,
    lastUpdated: new Date(dbProject.updated_at)
  };
}

// Export the store
export const useCapExStore = useStore; 