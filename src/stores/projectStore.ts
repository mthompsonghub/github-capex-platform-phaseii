import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

interface ProjectState {
  projects: Project[];
  refreshProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  refreshProjects: async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_milestones (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ projects: data || [] });
    } catch (error) {
      console.error('Error refreshing projects:', error);
    }
  }
})); 