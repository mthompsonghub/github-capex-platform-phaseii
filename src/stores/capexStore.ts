import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AdminSettings, ModalState, CapExRecord } from '../types/capex';
import { Project, PROJECT_TYPES, ProjectType } from '../components/capex/data/capexData';
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
    updateAdminSettings: (settings: any) => Promise<{ success: boolean; message: string }>;
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
              // Transform project data for database update
              const dbPayload = {
                project_name: project.projectName,
                project_owner: project.projectOwner,
                project_type: project.projectType.name.toLowerCase().replace(' ', '_'),
                start_date: project.startDate,
                end_date: project.endDate,
                total_budget: project.totalBudget,
                total_actual: project.totalActual,
                project_status: project.projectStatus,
                // Convert phases to a format suitable for JSON storage
                phases_data: JSON.stringify({
                  feasibility: {
                    id: project.phases.feasibility.id,
                    name: project.phases.feasibility.name,
                    weight: project.phases.feasibility.weight,
                    completion: project.phases.feasibility.completion,
                    subItems: project.phases.feasibility.subItems
                  },
                  planning: {
                    id: project.phases.planning.id,
                    name: project.phases.planning.name,
                    weight: project.phases.planning.weight,
                    completion: project.phases.planning.completion,
                    subItems: project.phases.planning.subItems
                  },
                  execution: {
                    id: project.phases.execution.id,
                    name: project.phases.execution.name,
                    weight: project.phases.execution.weight,
                    completion: project.phases.execution.completion,
                    subItems: project.phases.execution.subItems
                  },
                  close: {
                    id: project.phases.close.id,
                    name: project.phases.close.name,
                    weight: project.phases.close.weight,
                    completion: project.phases.close.completion,
                    subItems: project.phases.close.subItems
                  }
                }),
                updated_at: new Date().toISOString()
              };

              console.log('Database update payload:', dbPayload);

              // Simple update without returning data first
              const { error } = await supabase
                .from('capex_projects')
                .update(dbPayload)
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
                    projectOwner: project.projectOwner,
                    projectType: project.projectType,
                    startDate: project.startDate,
                    endDate: project.endDate,
                    totalBudget: project.totalBudget,
                    totalActual: project.totalActual,
                    projectStatus: project.projectStatus,
                    phases: project.phases,
                    lastUpdated: new Date()
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

          async updateAdminSettings(settings: any) {
            console.log('updateAdminSettings called with:', settings);
            
            try {
              // Save each threshold as a separate key-value pair
              const updates = [
                {
                  setting_key: 'on_track_threshold',
                  setting_value: settings.onTrackThreshold,
                  updated_at: new Date().toISOString()
                },
                {
                  setting_key: 'at_risk_threshold', 
                  setting_value: settings.atRiskThreshold,
                  updated_at: new Date().toISOString()
                },
                {
                  setting_key: 'impacted_threshold',
                  setting_value: settings.impactedThreshold,
                  updated_at: new Date().toISOString()
                }
              ];
              
              console.log('Saving threshold updates:', updates);
              
              // Use upsert to insert or update each setting
              for (const update of updates) {
                const { data, error } = await supabase
                  .from('capex_system_settings')
                  .upsert(update, { 
                    onConflict: 'setting_key'
                  })
                  .select('*');
                  
                if (error) {
                  console.error(`Error saving ${update.setting_key}:`, error);
                  throw error;
                }
                
                console.log(`Saved ${update.setting_key}:`, data);
              }
              
              console.log('All thresholds saved successfully');
              return { success: true, message: 'Thresholds saved' };
              
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

const createDefaultPhases = () => ({
  feasibility: {
    id: 'feasibility',
    name: 'Feasibility',
    weight: 15,
    completion: 0,
    subItems: {
      riskAssessment: { name: 'Risk Assessment', value: 0, isNA: false },
      projectCharter: { name: 'Project Charter', value: 0, isNA: false }
    }
  },
  planning: {
    id: 'planning',
    name: 'Planning',
    weight: 35,
    completion: 0,
    subItems: {
      rfqPackage: { name: 'RFQ Package', value: 0, isNA: false },
      validationStrategy: { name: 'Validation Strategy', value: 0, isNA: false },
      financialForecast: { name: 'Financial Forecast', value: 0, isNA: false },
      vendorSolicitation: { name: 'Vendor Solicitation', value: 0, isNA: false },
      ganttChart: { name: 'Gantt Chart', value: 0, isNA: false },
      sesAssetNumberApproval: { name: 'SES Asset Number Approval', value: 0, isNA: false }
    }
  },
  execution: {
    id: 'execution',
    name: 'Execution',
    weight: 45,
    completion: 0,
    subItems: {
      poSubmission: { name: 'PO Submission', value: 0, isNA: false },
      equipmentDesign: { name: 'Equipment Design', value: 0, isNA: false },
      equipmentBuild: { name: 'Equipment Build', value: 0, isNA: false },
      projectDocumentation: { name: 'Project Documentation/SOP', value: 0, isNA: false },
      demoInstall: { name: 'Demo/Install', value: 0, isNA: false },
      validation: { name: 'Validation', value: 0, isNA: false },
      equipmentTurnover: { name: 'Equipment Turnover/Training', value: 0, isNA: false },
      goLive: { name: 'Go-Live', value: 0, isNA: false }
    }
  },
  close: {
    id: 'close',
    name: 'Close',
    weight: 5,
    completion: 0,
    subItems: {
      poClosure: { name: 'PO Closure', value: 0, isNA: false },
      projectTurnover: { name: 'Project Turnover', value: 0, isNA: false }
    }
  }
});

const transformDbProjectToProject = (dbProject: any): Project => {
  // Parse phases data from JSON or create default
  let phases;
  if (dbProject.phases_data) {
    try {
      const parsedPhases = JSON.parse(dbProject.phases_data);
      phases = {
        feasibility: {
          id: parsedPhases.feasibility?.id || 'feasibility',
          name: parsedPhases.feasibility?.name || 'Feasibility',
          weight: parsedPhases.feasibility?.weight || 15,
          completion: parsedPhases.feasibility?.completion || 0,
          subItems: {
            riskAssessment: parsedPhases.feasibility?.subItems?.riskAssessment || { name: 'Risk Assessment', value: 0, isNA: false },
            projectCharter: parsedPhases.feasibility?.subItems?.projectCharter || { name: 'Project Charter', value: 0, isNA: false }
          }
        },
        planning: {
          id: parsedPhases.planning?.id || 'planning',
          name: parsedPhases.planning?.name || 'Planning',
          weight: parsedPhases.planning?.weight || 35,
          completion: parsedPhases.planning?.completion || 0,
          subItems: {
            rfqPackage: parsedPhases.planning?.subItems?.rfqPackage || { name: 'RFQ Package', value: 0, isNA: false },
            validationStrategy: parsedPhases.planning?.subItems?.validationStrategy || { name: 'Validation Strategy', value: 0, isNA: false },
            financialForecast: parsedPhases.planning?.subItems?.financialForecast || { name: 'Financial Forecast', value: 0, isNA: false },
            vendorSolicitation: parsedPhases.planning?.subItems?.vendorSolicitation || { name: 'Vendor Solicitation', value: 0, isNA: false },
            ganttChart: parsedPhases.planning?.subItems?.ganttChart || { name: 'Gantt Chart', value: 0, isNA: false },
            sesAssetNumberApproval: parsedPhases.planning?.subItems?.sesAssetNumberApproval || { name: 'SES Asset Number Approval', value: 0, isNA: false }
          }
        },
        execution: {
          id: parsedPhases.execution?.id || 'execution',
          name: parsedPhases.execution?.name || 'Execution',
          weight: parsedPhases.execution?.weight || 45,
          completion: parsedPhases.execution?.completion || 0,
          subItems: {
            poSubmission: parsedPhases.execution?.subItems?.poSubmission || { name: 'PO Submission', value: 0, isNA: false },
            equipmentDesign: parsedPhases.execution?.subItems?.equipmentDesign || { name: 'Equipment Design', value: 0, isNA: false },
            equipmentBuild: parsedPhases.execution?.subItems?.equipmentBuild || { name: 'Equipment Build', value: 0, isNA: false },
            projectDocumentation: parsedPhases.execution?.subItems?.projectDocumentation || { name: 'Project Documentation/SOP', value: 0, isNA: false },
            demoInstall: parsedPhases.execution?.subItems?.demoInstall || { name: 'Demo/Install', value: 0, isNA: false },
            validation: parsedPhases.execution?.subItems?.validation || { name: 'Validation', value: 0, isNA: false },
            equipmentTurnover: parsedPhases.execution?.subItems?.equipmentTurnover || { name: 'Equipment Turnover/Training', value: 0, isNA: false },
            goLive: parsedPhases.execution?.subItems?.goLive || { name: 'Go-Live', value: 0, isNA: false }
          }
        },
        close: {
          id: parsedPhases.close?.id || 'close',
          name: parsedPhases.close?.name || 'Close',
          weight: parsedPhases.close?.weight || 5,
          completion: parsedPhases.close?.completion || 0,
          subItems: {
            poClosure: parsedPhases.close?.subItems?.poClosure || { name: 'PO Closure', value: 0, isNA: false },
            projectTurnover: parsedPhases.close?.subItems?.projectTurnover || { name: 'Project Turnover', value: 0, isNA: false }
          }
        }
      };
    } catch (error) {
      console.warn('Failed to parse phases_data for project:', dbProject.project_name, error);
      phases = createDefaultPhases();
    }
  } else {
    phases = createDefaultPhases();
  }

  return {
    id: dbProject.id,
    projectName: dbProject.project_name || '',
    projectOwner: dbProject.project_owner || '',
    startDate: dbProject.start_date || new Date().toISOString(),
    endDate: dbProject.end_date || new Date().toISOString(),
    projectType: Object.values(PROJECT_TYPES).find(t => t.name.toLowerCase().replace(' ', '_') === dbProject.project_type) || Object.values(PROJECT_TYPES)[0],
    totalBudget: Number(dbProject.total_budget) || 0,
    totalActual: Number(dbProject.total_actual) || 0,
    projectStatus: dbProject.project_status || 'On Track',
    phases: phases,
    comments: dbProject.comments || '',
    lastUpdated: new Date(dbProject.updated_at || new Date())
  };
};

// Export the store
export const useCapExStore = useStore; 