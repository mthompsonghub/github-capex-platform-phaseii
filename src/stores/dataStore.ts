import { create } from 'zustand';
import Fuse from 'fuse.js';
import { Project, Resource, Allocation, Alert } from '../types';
import { db, importExport } from '../lib/supabase';
import { parseISO, differenceInQuarters, startOfQuarter, addQuarters } from 'date-fns';

interface DataState {
  projects: Project[];
  resources: Resource[];
  allocations: Allocation[];
  searchTerm: string;
  alerts: Alert[];
  fetchInitialData: () => Promise<void>;
  getProjectResources: (projectId: string) => Resource[];
  getAllocation: (projectId: string, resourceId: string, year: number, quarter: number) => number;
  getResourceCount: (projectId: string, year: number, quarter: number) => number;
  updateAllocation: (projectId: string, resourceId: string, year: number, quarter: number, percentage: number) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) => Promise<void>;
  updateResource: (resourceId: string, updates: Partial<Omit<Resource, 'id'>>) => Promise<void>;
  setSearchTerm: (term: string) => void;
  getFilteredProjects: () => Project[];
  addResourceToProject: (projectId: string, resourceId: string) => Promise<void>;
  removeResourceFromProject: (projectId: string, resourceId: string) => Promise<void>;
  clearInvalidAllocations: (projectId: string) => void;
  createResource: (data: Omit<Resource, 'id'>) => Promise<Resource>;
  createProject: (data: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>;
  importAllData: (data: unknown) => Promise<void>;
  exportAllData: () => Promise<{
    projects: Project[];
    resources: Resource[];
    allocations: Allocation[];
    exported_at: string;
  }>;
  deleteProject: (projectId: string) => Promise<void>;
  reorderProjectResources: (projectId: string, draggedResourceId: string, targetResourceId: string) => Promise<void>;
  addAlert: (alert: Alert) => void;
  clearAlerts: () => void;
}

const projectFuse = new Fuse([], {
  keys: ['name'],
  threshold: 0.3,
});

const resourceFuse = new Fuse([], {
  keys: ['name', 'title'],
  threshold: 0.3,
  distance: 100,
});

export const useDataStore = create<DataState>((set, get) => ({
  projects: [],
  resources: [],
  allocations: [],
  searchTerm: '',
  alerts: [],

  fetchInitialData: async () => {
    console.log('Fetching initial data...');
    try {
      const [projects, resources, allocations] = await Promise.all([
        db.projects.list(),
        db.resources.list(),
        db.allocations.list(),
      ]);
      
      console.log('Initial data fetched successfully:', {
        projectsCount: projects.length,
        resourcesCount: resources.length,
        allocationsCount: allocations.length
      });

      set({ projects, resources, allocations });
      projectFuse.setCollection(projects);
      resourceFuse.setCollection(resources);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      set({ projects: [], resources: [], allocations: [] });
      projectFuse.setCollection([]);
      resourceFuse.setCollection([]);
      throw error;
    }
  },

  getProjectResources: (projectId: string) => {
    const { allocations, resources, projects } = get();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return [];

    const resourceIds = new Set(
      allocations
        .filter(a => a.project_id === projectId)
        .map(a => a.resource_id)
    );

    const projectResources = resources.filter(r => resourceIds.has(r.id));

    if (project.resource_order?.length) {
      return projectResources.sort((a, b) => {
        const aIndex = project.resource_order!.indexOf(a.id);
        const bIndex = project.resource_order!.indexOf(b.id);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return projectResources;
  },

  getAllocation: (projectId: string, resourceId: string, year: number, quarter: number) => {
    const { allocations, projects } = get();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return 0;

    const projectStartDate = parseISO(project.start_date);
    const targetQuarterDate = new Date(year, (quarter - 1) * 3, 1);
    const projectQuarterNumber = Math.floor(differenceInQuarters(targetQuarterDate, startOfQuarter(projectStartDate))) + 1;

    const allocation = allocations.find(
      a => a.project_id === projectId &&
           a.resource_id === resourceId &&
           a.project_quarter_number === projectQuarterNumber
    );

    return allocation?.percentage || 0;
  },

  getResourceCount: (projectId: string, year: number, quarter: number) => {
    const { allocations, projects } = get();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return 0;

    const projectStartDate = parseISO(project.start_date);
    const targetQuarterDate = new Date(year, (quarter - 1) * 3, 1);
    const projectQuarterNumber = Math.floor(differenceInQuarters(targetQuarterDate, startOfQuarter(projectStartDate))) + 1;

    const resourceIds = new Set(
      allocations
        .filter(a => 
          a.project_id === projectId &&
          a.project_quarter_number === projectQuarterNumber &&
          a.percentage > 0
        )
        .map(a => a.resource_id)
    );

    return resourceIds.size;
  },

  updateAllocation: async (projectId: string, resourceId: string, year: number, quarter: number, percentage: number) => {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Allocation percentage must be between 0 and 100');
    }

    try {
      const { projects } = get();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }

      const projectStartDate = parseISO(project.start_date);
      const targetQuarterDate = new Date(year, (quarter - 1) * 3, 1);
      const projectQuarterNumber = Math.floor(differenceInQuarters(targetQuarterDate, startOfQuarter(projectStartDate))) + 1;

      const newAllocation = await db.allocations.create({
        project_id: projectId,
        resource_id: resourceId,
        project_quarter_number: projectQuarterNumber,
        percentage
      });

      set(state => {
        // Remove any existing allocation for this project/resource/quarter
        const filteredAllocations = state.allocations.filter(a => 
          !(a.project_id === projectId && 
            a.resource_id === resourceId && 
            a.project_quarter_number === projectQuarterNumber)
        );
        
        // Add the new allocation
        return {
          allocations: [...filteredAllocations, newAllocation]
        };
      });

    } catch (error) {
      console.error('Error updating allocation:', error);
      await get().fetchInitialData(); // Refresh data on error
      throw error;
    }
  },

  clearInvalidAllocations: (projectId: string) => {
    const { projects } = get();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    const projectStart = parseISO(project.start_date);
    const projectEnd = parseISO(project.end_date);
    const totalQuarters = Math.ceil(differenceInQuarters(projectEnd, projectStart));

    set(state => ({
      allocations: state.allocations.filter(allocation => {
        if (allocation.project_id !== projectId) return true;
        return allocation.project_quarter_number <= totalQuarters;
      })
    }));
  },

  updateProject: async (projectId: string, updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) => {
    if (updates.end_date && updates.start_date) {
      const startDate = parseISO(updates.start_date);
      const endDate = parseISO(updates.end_date);
      if (endDate < startDate) {
        throw new Error('End date cannot be before start date');
      }
    }

    try {
      const updatedProject = await db.projects.update(projectId, updates);
      
      set(state => {
        const updatedProjects = state.projects.map(project =>
          project.id === projectId ? updatedProject : project
        );
        projectFuse.setCollection(updatedProjects);
        return { projects: updatedProjects };
      });

      if (updates.start_date || updates.end_date) {
        get().clearInvalidAllocations(projectId);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      await get().fetchInitialData();
      throw error;
    }
  },

  updateResource: async (resourceId: string, updates: Partial<Omit<Resource, 'id'>>) => {
    try {
      const updatedResource = await db.resources.update(resourceId, updates);
      
      set(state => {
        const updatedResources = state.resources.map(resource =>
          resource.id === resourceId ? updatedResource : resource
        );
        resourceFuse.setCollection(updatedResources);
        return { resources: updatedResources };
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      await get().fetchInitialData();
      throw error;
    }
  },

  setSearchTerm: (term: string) => set({ searchTerm: term }),

  getFilteredProjects: () => {
    const { projects, searchTerm } = get();
    if (!searchTerm) return projects;

    const projectResults = projectFuse.search(searchTerm);
    const resourceResults = resourceFuse.search(searchTerm);

    if (resourceResults.length > 0) {
      const matchedResourceIds = new Set(resourceResults.map(result => result.item.id));
      return projects.filter(project => {
        const projectResources = get().getProjectResources(project.id);
        return projectResources.some(resource => matchedResourceIds.has(resource.id));
      });
    }

    return projectResults.map(result => result.item);
  },

  addResourceToProject: async (projectId: string, resourceId: string) => {
    try {
      const { allocations, projects } = get();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }

      const existingAllocation = allocations.find(
        a => a.project_id === projectId && a.resource_id === resourceId
      );

      if (existingAllocation) {
        throw new Error('Resource is already assigned to this project');
      }

      // Create initial allocation at project quarter 1 with 0%
      const newAllocation = await db.allocations.create({
        project_id: projectId,
        resource_id: resourceId,
        project_quarter_number: 1,
        percentage: 0
      });

      set(state => {
        const project = state.projects.find(p => p.id === projectId);
        if (project) {
          const updatedProject = {
            ...project,
            resource_order: [...(project.resource_order || []), resourceId]
          };
          const updatedProjects = state.projects.map(p =>
            p.id === projectId ? updatedProject : p
          );
          return {
            projects: updatedProjects,
            allocations: [...state.allocations, newAllocation]
          };
        }
        return { allocations: [...state.allocations, newAllocation] };
      });

    } catch (error) {
      console.error('Error adding resource to project:', error);
      await get().fetchInitialData();
      throw error;
    }
  },

  removeResourceFromProject: async (projectId: string, resourceId: string) => {
    console.log('Starting removeResourceFromProject:', { projectId, resourceId });
    
    try {
      const { allocations } = get();
      const allocationIds = allocations
        .filter(a => a.project_id === projectId && a.resource_id === resourceId)
        .map(a => a.id);
      
      console.log('Found allocations to delete:', allocationIds);

      for (const id of allocationIds) {
        try {
          console.log('Deleting allocation:', id);
          await db.allocations.delete(id);
          console.log('Successfully deleted allocation:', id);
        } catch (error) {
          console.error('Failed to delete allocation:', id, error);
          throw error;
        }
      }

      console.log('Updating local state...');
      set(state => {
        const project = state.projects.find(p => p.id === projectId);
        if (project && project.resource_order) {
          console.log('Updating project resource order');
          const updatedProject = {
            ...project,
            resource_order: project.resource_order.filter(id => id !== resourceId)
          };
          const updatedProjects = state.projects.map(p =>
            p.id === projectId ? updatedProject : p
          );
          return {
            projects: updatedProjects,
            allocations: state.allocations.filter(
              a => !(a.project_id === projectId && a.resource_id === resourceId)
            )
          };
        }
        return {
          allocations: state.allocations.filter(
            a => !(a.project_id === projectId && a.resource_id === resourceId)
          )
        };
      });

      const project = get().projects.find(p => p.id === projectId);
      if (project && project.resource_order) {
        console.log('Updating resource order in database');
        await db.projects.updateResourceOrder(
          projectId,
          project.resource_order.filter(id => id !== resourceId)
        );
      }

      console.log('Successfully removed resource from project');
    } catch (error) {
      console.error('Error removing resource from project:', error);
      await get().fetchInitialData();
      throw error;
    }
  },

  createResource: async (data: Omit<Resource, 'id'>) => {
    try {
      const newResource = await db.resources.create(data);
      
      set(state => {
        const updatedResources = [...state.resources, newResource];
        resourceFuse.setCollection(updatedResources);
        return { resources: updatedResources };
      });

      return newResource;
    } catch (error) {
      console.error('Error creating resource:', error);
      await get().fetchInitialData();
      throw error;
    }
  },

  createProject: async (data: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const project = await db.projects.create(data);
      
      set(state => {
        const updatedProjects = [...state.projects, project];
        projectFuse.setCollection(updatedProjects);
        return { projects: updatedProjects };
      });
    } catch (error) {
      console.error('Error creating project:', error);
      await get().fetchInitialData();
      throw error;
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      await db.projects.delete(projectId);
      
      set(state => {
        const updatedProjects = state.projects.filter(p => p.id !== projectId);
        const updatedAllocations = state.allocations.filter(a => a.project_id !== projectId);
        projectFuse.setCollection(updatedProjects);
        return {
          projects: updatedProjects,
          allocations: updatedAllocations
        };
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      await get().fetchInitialData();
      throw error;
    }
  },

  reorderProjectResources: async (projectId: string, draggedResourceId: string, targetResourceId: string) => {
    try {
      const project = get().projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');

      const currentOrder = project.resource_order || [];
      const draggedIndex = currentOrder.indexOf(draggedResourceId);
      const targetIndex = currentOrder.indexOf(targetResourceId);

      if (draggedIndex === -1 || targetIndex === -1) {
        throw new Error('Invalid resource order');
      }

      const newOrder = [...currentOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedResourceId);

      await db.projects.updateResourceOrder(projectId, newOrder);

      set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId ? { ...p, resource_order: newOrder } : p
        )
      }));
    } catch (error) {
      console.error('Error reordering resources:', error);
      await get().fetchInitialData();
      throw error;
    }
  },

  importAllData: async (data) => {
    try {
      await importExport.importData(data);
      await get().fetchInitialData();
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },

  exportAllData: async () => {
    try {
      return await importExport.exportData();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  addAlert: (alert: Alert) => set(state => ({
    alerts: [...state.alerts, alert]
  })),

  clearAlerts: () => set({ alerts: [] }),
}));