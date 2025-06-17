import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AdminSettings, ModalState, CapExRecord, CapexProject } from '../types/capex-unified';
import { PROJECT_TYPES, ProjectType } from '../components/capex/data/capexData';
import { supabase } from '../lib/supabase';
import { ExtendedThresholdSettings } from '../components/capex/admin/AdminConfig';
import { calculateScheduleAdherence } from '../utils/scheduleAdherence';
import { toast } from 'react-hot-toast';
import { 
  CapexProjectDB, 
  transformDbToProject, 
  transformProjectToDb 
} from '../utils/capexTransformations';

interface CapExStore {
  projects: CapexProject[];
  adminSettings: AdminSettings | null;
  modalState: ModalState<CapexProject | string>;
  isAdmin: boolean;
  phaseWeights: {
    projects: { feasibility: number; planning: number; execution: number; close: number };
    asset_purchases: { feasibility: number; planning: number; execution: number; close: number };
  } | null;
  loading: boolean;
  error: string | null;
  actions: {
    fetchProjects: () => Promise<void>;
    updateProject: (project: CapexProject) => Promise<void>;
    createProject: (project: Omit<CapexProject, 'id'>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    fetchAdminSettings: () => Promise<void>;
    updateAdminSettings: (settings: AdminSettings) => Promise<void>;
    fetchUserRole: () => Promise<string>;
    openProjectModal: (project: CapexProject) => void;
    closeProjectModal: () => void;
    setIsAdmin: (value: boolean) => void;
    openAdminModal: () => void;
    fetchPhaseWeights: () => Promise<any>;
    updatePhaseWeights: (projectType: 'projects' | 'asset_purchases', weights: any) => Promise<{ success: boolean }>;
    getPhaseWeights: (projectType: string | ProjectType) => any;
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
        phaseWeights: null,
        loading: false,
        error: null,
        actions: {
          async fetchProjects() {
            set({ loading: true, error: null });
            try {
              const { data, error } = await supabase
                .from('capex_projects')
                .select('*')
                .order('created_at', { ascending: false });
              
              if (error) throw error;
              
              console.log('🔍 Raw data from Supabase:', data);
              
              const projects = (data || []).map(record => {
                console.log('🔍 Transforming record:', record.project_name, 'with type:', record.project_type);
                const transformed = transformDbToProject(record as CapexProjectDB);
                
                // Calculate schedule adherence if the utility is available
                if (calculateScheduleAdherence) {
                  transformed.scheduleAdherence = calculateScheduleAdherence(transformed);
                }
                
                console.log('🔍 Transformed to:', transformed.name, 'with type:', transformed.type);
                return transformed;
              });
              
              set({ projects, loading: false });
            } catch (error) {
              console.error('Error fetching projects:', error);
              set({ error: (error as Error).message, loading: false });
              toast.error('Failed to fetch projects');
            }
          },

          async updateProject(project: CapexProject) {
            set({ loading: true, error: null });
            try {
              console.log('Updating project:', project.name);
              
              // Get admin settings for status calculation
              const { adminSettings } = get();
              const thresholds = adminSettings?.thresholds || { onTrack: 90, atRisk: 80 };
              
              // Calculate status based on completion
              if (project.overallCompletion >= thresholds.onTrack) {
                project.status = 'On Track';
              } else if (project.overallCompletion >= thresholds.atRisk) {
                project.status = 'At Risk';
              } else {
                project.status = 'Impacted';
              }
              
              // Recalculate schedule adherence
              if (calculateScheduleAdherence) {
                project.scheduleAdherence = calculateScheduleAdherence(project);
              }
              
              const dbData = transformProjectToDb(project);
              
              console.log('🔍 About to call Supabase update with:', dbData);
              console.log('🔍 Project ID:', project.id);
              
              const { data, error } = await supabase
                .from('capex_projects')
                .update(dbData)
                .eq('id', project.id)
                .select();
              
              if (error) throw error;
              
              console.log('🔍 Supabase response - data:', data);
              
              set((state) => ({
                projects: state.projects.map((p) => 
                  p.id === project.id ? project : p
                ),
                loading: false
              }));
              
              toast.success('Project updated successfully');
            } catch (error) {
              console.error('Error updating project:', error);
              set({ error: (error as Error).message, loading: false });
              toast.error('Failed to update project');
            }
          },

          async createProject(projectData: Omit<CapexProject, 'id'>) {
            set({ loading: true, error: null });
            try {
              const dbData = transformProjectToDb({ ...projectData, id: '' } as CapexProject);
              
              const { data, error } = await supabase
                .from('capex_projects')
                .insert(dbData)
                .select()
                .single();
              
              if (error) throw error;
              
              const newProject = transformDbToProject(data as CapexProjectDB);
              
              set((state) => ({
                projects: [newProject, ...state.projects],
                loading: false
              }));
              
              toast.success('Project created successfully');
            } catch (error) {
              console.error('Error creating project:', error);
              set({ error: (error as Error).message, loading: false });
              toast.error('Failed to create project');
            }
          },

          async deleteProject(id: string) {
            set({ loading: true, error: null });
            try {
              const { error } = await supabase
                .from('capex_projects')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              
              set((state) => ({
                projects: state.projects.filter((p) => p.id !== id),
                loading: false
              }));
              
              toast.success('Project deleted successfully');
            } catch (error) {
              console.error('Error deleting project:', error);
              set({ error: (error as Error).message, loading: false });
              toast.error('Failed to delete project');
            }
          },

          async fetchAdminSettings() {
            try {
              const { data, error } = await supabase
                .from('admin_settings')
                .select('*')
                .single();
              
              if (error) throw error;
              
              const settings: AdminSettings = {
                thresholds: {
                  onTrack: data?.threshold_on_track || 90,
                  atRisk: data?.threshold_at_risk || 80,
                },
                phaseWeights: {
                  complexProject: {
                    feasibility: data?.weight_complex_feasibility || 15,
                    planning: data?.weight_complex_planning || 35,
                    execution: data?.weight_complex_execution || 45,
                    close: data?.weight_complex_close || 5,
                  },
                  assetPurchase: {
                    planning: data?.weight_asset_planning || 45,
                    execution: data?.weight_asset_execution || 50,
                    close: data?.weight_asset_close || 5,
                  },
                },
              };
              
              set({ adminSettings: settings });
            } catch (error) {
              console.error('Error fetching admin settings:', error);
              toast.error('Failed to fetch admin settings');
            }
          },

          async updateAdminSettings(settings: AdminSettings) {
            try {
              const { error } = await supabase
                .from('admin_settings')
                .update({
                  threshold_on_track: settings.thresholds.onTrack,
                  threshold_at_risk: settings.thresholds.atRisk,
                  weight_complex_feasibility: settings.phaseWeights.complexProject.feasibility,
                  weight_complex_planning: settings.phaseWeights.complexProject.planning,
                  weight_complex_execution: settings.phaseWeights.complexProject.execution,
                  weight_complex_close: settings.phaseWeights.complexProject.close,
                  weight_asset_planning: settings.phaseWeights.assetPurchase.planning,
                  weight_asset_execution: settings.phaseWeights.assetPurchase.execution,
                  weight_asset_close: settings.phaseWeights.assetPurchase.close,
                })
                .eq('id', 1); // Assuming single row for admin settings
              
              if (error) throw error;
              
              set({ adminSettings: settings });
              toast.success('Admin settings updated successfully');
            } catch (error) {
              console.error('Error updating admin settings:', error);
              toast.error('Failed to update admin settings');
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

          openProjectModal(project: CapexProject) {
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
          openAdminModal: () => {
            console.log('Opening admin modal');
            set(state => {
              state.modalState = { 
                isOpen: true, 
                data: 'admin'
              };
            });
          },

          async fetchPhaseWeights() {
            try {
              const { data, error } = await supabase
                .from('capex_system_settings')
                .select('setting_key, setting_value')
                .in('setting_key', ['project_phase_weights', 'asset_phase_weights']);
              
              if (error) throw error;
              
              const weights = {
                projects: { feasibility: 15, planning: 35, execution: 45, close: 5 },
                asset_purchases: { feasibility: 0, planning: 45, execution: 50, close: 5 }
              };
              
              data?.forEach(item => {
                if (item.setting_key === 'project_phase_weights') {
                  weights.projects = item.setting_value;
                } else if (item.setting_key === 'asset_phase_weights') {
                  weights.asset_purchases = item.setting_value;
                }
              });
              
              set({ phaseWeights: weights });
              return weights;
            } catch (error) {
              console.error('Error fetching phase weights:', error);
              return null;
            }
          },

          async updatePhaseWeights(projectType: 'projects' | 'asset_purchases', weights: any) {
            try {
              const settingKey = projectType === 'projects' ? 'project_phase_weights' : 'asset_phase_weights';
              
              const { error } = await supabase
                .from('capex_system_settings')
                .upsert({
                  setting_key: settingKey,
                  setting_value: weights,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'setting_key' });
              
              if (error) throw error;
              
              // Update local state
              set(state => ({
                phaseWeights: {
                  ...state.phaseWeights,
                  [projectType]: weights
                }
              }));
              
              return { success: true };
            } catch (error) {
              console.error('Error updating phase weights:', error);
              throw error;
            }
          },

          getPhaseWeights: (projectType: string | ProjectType) => {
            const state = get();
            if (!state.phaseWeights) return { feasibility: 15, planning: 35, execution: 45, close: 5 };
            
            // Convert projectType to string if it's an object
            const projectTypeStr = typeof projectType === 'string' ? projectType : projectType.name;
            
            // Handle all variations of asset purchase project types
            const isAssetPurchase = 
              projectTypeStr === 'asset_purchase' || 
              projectTypeStr === 'asset_purchases' ||
              projectTypeStr === 'ASSET_PURCHASES' ||
              projectTypeStr.toLowerCase().includes('asset');
            
            const weights = isAssetPurchase ? 
              state.phaseWeights.asset_purchases : 
              state.phaseWeights.projects;
            
            // Add logging for debugging
            console.log('getPhaseWeights called with projectType:', projectType);
            console.log('Returning weights:', weights);
            return weights;
          }
        }
      })),
      {
        name: 'capex-store',
        partialize: (state) => ({
          adminSettings: state.adminSettings,
          phaseWeights: state.phaseWeights
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

// Helper function to calculate overall completion from phases
const calculateOverallCompletion = (phases: any): number => {
  const totalWeight = Object.values(phases).reduce((sum: number, phase: any) => sum + phase.weight, 0);
  const weightedCompletion = Object.values(phases).reduce((sum: number, phase: any) => sum + (phase.completion * phase.weight), 0);
  return Math.round(weightedCompletion / totalWeight);
};

// Helper function to map database project types to UI types
const mapProjectType = (dbType: string): 'Complex Project' | 'Asset Purchase' => {
  console.log('🔍 Mapping project type:', dbType);
  
  if (dbType === 'projects' || dbType === 'Complex Project') {
    return 'Complex Project';
  } else if (dbType === 'asset_purchases' || dbType === 'Asset Purchase') {
    return 'Asset Purchase';
  }
  
  // Default fallback
  console.warn('⚠️ Unknown project type:', dbType, 'defaulting to Complex Project');
  return 'Complex Project';
};

// Make sure transformDbToProject uses the mapping:
const transformDbToProject = (record: any): CapexProject => {
  const project: CapexProject = {
    id: record.id,
    name: record.project_name,
    type: mapProjectType(record.project_type), // USE THE MAPPING HERE
    owner: record.owner_name || record.project_owner, // Handle both field names
    status: record.project_status as 'On Track' | 'At Risk' | 'Impacted',
    budget: record.total_budget || 0,
    spent: record.total_actual || 0,
    overallCompletion: record.overall_completion || 0,
    timeline: record.timeline || '',
    upcomingMilestone: record.upcoming_milestone || '',
    sesNumber: record.ses_number || '',
    financialNotes: record.financial_notes || '',
    phases: record.phases_data || {},
    
    // Phase dates
    feasibilityStartDate: record.feasibility_start_date || undefined,
    feasibilityEndDate: record.feasibility_end_date || undefined,
    planningStartDate: record.planning_start_date || undefined,
    planningEndDate: record.planning_end_date || undefined,
    executionStartDate: record.execution_start_date || undefined,
    executionEndDate: record.execution_end_date || undefined,
    closeStartDate: record.close_start_date || undefined,
    closeEndDate: record.close_end_date || undefined,
    
    lastUpdated: record.updated_at || record.created_at || new Date().toISOString(),
  };
  
  // Calculate schedule adherence
  if (calculateScheduleAdherence) {
    project.scheduleAdherence = calculateScheduleAdherence(project);
  }
  
  return project;
};

// Update the transformDbProjectToProject function to properly map types:
const transformDbProjectToProject = (dbProject: any): CapexProject => {
  // Parse phases data if it's a JSON string
  let phases;
  if (typeof dbProject.phases_data === 'string') {
    try {
      const parsedPhases = JSON.parse(dbProject.phases_data);
      phases = {
        feasibility: {
          id: 'feasibility',
          name: 'Feasibility',
          weight: parsedPhases.feasibility?.weight || 15,
          completion: parsedPhases.feasibility?.completion || 0,
          subItems: parsedPhases.feasibility?.subItems || {
            riskAssessment: { name: 'Risk Assessment', value: 0, isNA: false },
            projectCharter: { name: 'Project Charter', value: 0, isNA: false }
          }
        },
        planning: {
          id: 'planning',
          name: 'Planning',
          weight: parsedPhases.planning?.weight || 35,
          completion: parsedPhases.planning?.completion || 0,
          subItems: parsedPhases.planning?.subItems || {
            rfqPackage: { name: 'RFQ Package', value: 0, isNA: false },
            validationStrategy: { name: 'Validation Strategy', value: 0, isNA: false },
            financialForecast: { name: 'Financial Forecast', value: 0, isNA: false },
            vendorSolicitation: { name: 'Vendor Solicitation', value: 0, isNA: false },
            ganttChart: { name: 'Gantt Chart', value: 0, isNA: false },
            sesAssetNumberApproval: { name: 'SES/Asset# Approval', value: 0, isNA: false }
          }
        },
        execution: {
          id: 'execution',
          name: 'Execution',
          weight: parsedPhases.execution?.weight || 45,
          completion: parsedPhases.execution?.completion || 0,
          subItems: parsedPhases.execution?.subItems || {
            poSubmission: { name: 'PO Submission', value: 0, isNA: false },
            equipmentDesign: { name: 'Equipment Design', value: 0, isNA: false },
            equipmentBuild: { name: 'Equipment Build', value: 0, isNA: false },
            projectDocumentation: { name: 'Project Documentation', value: 0, isNA: false },
            demoInstall: { name: 'Demo/Install', value: 0, isNA: false },
            validation: { name: 'Validation', value: 0, isNA: false },
            equipmentTurnover: { name: 'Equipment Turnover', value: 0, isNA: false },
            goLive: { name: 'Go Live', value: 0, isNA: false }
          }
        },
        close: {
          id: 'close',
          name: 'Close',
          weight: parsedPhases.close?.weight || 5,
          completion: parsedPhases.close?.completion || 0,
          subItems: parsedPhases.close?.subItems || {
            poClosure: { name: 'PO Closure', value: 0, isNA: false },
            projectTurnover: { name: 'Project Turnover', value: 0, isNA: false }
          }
        }
      };
    } catch (error) {
      console.warn('Failed to parse phases_data for project:', dbProject.project_name, error);
      phases = createDefaultPhases();
    }
  } else if (dbProject.phases_data && typeof dbProject.phases_data === 'object') {
    phases = dbProject.phases_data;
  } else {
    phases = createDefaultPhases();
  }

  // Map database project type to UI project type
  const mapDatabaseProjectType = (dbType: string): ProjectType => {
    console.log('🔍 Mapping database project type:', dbType);
    
    // Handle database values
    if (dbType === 'projects' || dbType === 'Projects') {
      return {
        id: 'projects',
        name: 'Complex Project',
        phaseWeights: {
          feasibility: 15,
          planning: 35,
          execution: 45,
          close: 5
        }
      };
    } else if (dbType === 'asset_purchases' || dbType === 'Asset Purchases') {
      return {
        id: 'asset_purchases',
        name: 'Asset Purchase',
        phaseWeights: {
          feasibility: 0,
          planning: 45,
          execution: 50,
          close: 5
        }
      };
    }
    
    // Default fallback
    console.warn('⚠️ Unknown project type:', dbType, 'defaulting to Complex Project');
    return {
      id: 'projects',
      name: 'Complex Project',
      phaseWeights: {
        feasibility: 15,
        planning: 35,
        execution: 45,
        close: 5
      }
    };
  };

  // Calculate overall completion from phases
  const overallCompletion = calculateOverallCompletion(phases);

  return {
    id: dbProject.id,
    projectName: dbProject.project_name || '',
    projectOwner: dbProject.project_owner || '',
    startDate: dbProject.start_date ? new Date(dbProject.start_date) : new Date(),
    endDate: dbProject.end_date ? new Date(dbProject.end_date) : new Date(),
    projectType: mapDatabaseProjectType(dbProject.project_type), // USE THE MAPPING HERE
    totalBudget: Number(dbProject.total_budget) || 0,
    totalActual: Number(dbProject.total_actual) || 0,
    projectStatus: dbProject.project_status || 'On Track',
    phases: phases,
    comments: dbProject.comments || '',
    lastUpdated: new Date(dbProject.updated_at || new Date()),
    
    // Additional fields for CapexProject compatibility
    name: dbProject.project_name || '',
    owner: dbProject.project_owner || '',
    type: mapDatabaseProjectType(dbProject.project_type).name, // This will be "Complex Project" or "Asset Purchase"
    status: (dbProject.project_status || 'On Track').toLowerCase().replace(' ', '-'),
    budget: Number(dbProject.total_budget) || 0,
    spent: Number(dbProject.total_actual) || 0,
    overallCompletion: overallCompletion,
    timeline: dbProject.timeline || '',
    
    // Financial fields
    sesNumber: dbProject.ses_number || '',
    financialNotes: dbProject.financial_notes || '',
    upcomingMilestone: dbProject.upcoming_milestone || '',
    milestones: {
      feasibility: dbProject.feasibility_milestone || '',
      planning: dbProject.planning_milestone || '',
      execution: dbProject.execution_milestone || '',
      close: dbProject.close_milestone || ''
    }
  };
};

// Helper function to convert CapexProject to Project
const convertCapexToProject = (capexProject: CapexProject): CapexProject => {
  return {
    id: capexProject.id,
    projectName: capexProject.name,
    projectOwner: capexProject.owner,
    startDate: new Date(),
    endDate: new Date(),
    projectType: {
      id: capexProject.type === 'Complex Project' ? 'projects' : 'asset_purchases',
      name: capexProject.type,
      phaseWeights: {
        feasibility: capexProject.type === 'Complex Project' ? 15 : 0,
        planning: capexProject.type === 'Complex Project' ? 35 : 45,
        execution: capexProject.type === 'Complex Project' ? 45 : 50,
        close: 5
      }
    },
    totalBudget: capexProject.budget,
    totalActual: capexProject.spent,
    projectStatus: capexProject.status,
    phases: {
      feasibility: {
        id: 'feasibility',
        name: 'Feasibility',
        weight: capexProject.type === 'Complex Project' ? 15 : 0,
        completion: capexProject.phases?.feasibility?.completion || 0,
        subItems: {
          riskAssessment: {
            name: 'Risk Assessment',
            value: 0,
            isNA: false
          },
          projectCharter: {
            name: 'Project Charter',
            value: 0,
            isNA: false
          }
        }
      },
      planning: {
        id: 'planning',
        name: 'Planning',
        weight: capexProject.type === 'Complex Project' ? 35 : 45,
        completion: capexProject.phases?.planning?.completion || 0,
        subItems: {
          rfqPackage: {
            name: 'RFQ Package',
            value: 0,
            isNA: false
          },
          validationStrategy: {
            name: 'Validation Strategy',
            value: 0,
            isNA: false
          },
          financialForecast: {
            name: 'Financial Forecast',
            value: 0,
            isNA: false
          },
          vendorSolicitation: {
            name: 'Vendor Solicitation',
            value: 0,
            isNA: false
          },
          ganttChart: {
            name: 'Gantt Chart',
            value: 0,
            isNA: false
          },
          sesAssetNumberApproval: {
            name: 'SES Asset Number Approval',
            value: 0,
            isNA: false
          }
        }
      },
      execution: {
        id: 'execution',
        name: 'Execution',
        weight: capexProject.type === 'Complex Project' ? 45 : 50,
        completion: capexProject.phases?.execution?.completion || 0,
        subItems: {
          poSubmission: {
            name: 'PO Submission',
            value: 0,
            isNA: false
          },
          equipmentDesign: {
            name: 'Equipment Design',
            value: 0,
            isNA: false
          },
          equipmentBuild: {
            name: 'Equipment Build',
            value: 0,
            isNA: false
          },
          projectDocumentation: {
            name: 'Project Documentation',
            value: 0,
            isNA: false
          },
          demoInstall: {
            name: 'Demo/Install',
            value: 0,
            isNA: false
          },
          validation: {
            name: 'Validation',
            value: 0,
            isNA: false
          },
          equipmentTurnover: {
            name: 'Equipment Turnover',
            value: 0,
            isNA: false
          },
          goLive: {
            name: 'Go-Live',
            value: 0,
            isNA: false
          }
        }
      },
      close: {
        id: 'close',
        name: 'Close',
        weight: 5,
        completion: capexProject.phases?.close?.completion || 0,
        subItems: {
          poClosure: {
            name: 'PO Closure',
            value: 0,
            isNA: false
          },
          projectTurnover: {
            name: 'Project Turnover',
            value: 0,
            isNA: false
          }
        }
      }
    },
    lastUpdated: new Date(),
    sesNumber: capexProject.sesNumber,
    upcomingMilestone: capexProject.upcomingMilestone,
    financialNotes: capexProject.financialNotes,
    
    // Additional fields for CapexProject compatibility
    name: capexProject.name,
    owner: capexProject.owner,
    type: capexProject.type,
    status: capexProject.status,
    budget: capexProject.budget,
    spent: capexProject.spent,
    overallCompletion: capexProject.overallCompletion,
    timeline: capexProject.timeline
  };
};

// Export the store
export const useCapExStore = useStore; 