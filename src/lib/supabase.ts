import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Project, Resource, Allocation } from '../types';
import { UserRole, UserRoleData, UserManagementData } from '../types/roles';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema Validation
export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Project name is required"),
  status: z.enum(['Active', 'Inactive', 'Planned', 'Completed', 'On Hold']),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']),
  start_date: z.string(),
  end_date: z.string(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  resource_order: z.array(z.string().uuid()).nullable().optional(),
});

export const resourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Resource name is required"),
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const allocationSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  resource_id: z.string().uuid(),
  project_quarter_number: z.number().int().min(1),
  percentage: z.number().min(0).max(100),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const calendarAllocationSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  resource_id: z.string().uuid(),
  percentage: z.number().min(0).max(100),
  calendar_year: z.number().int(),
  calendar_quarter: z.number().int().min(1).max(4),
});

// Database Operations
export const db = {
  projects: {
    async create(data: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'resource_order'>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated to create a project');

      const { data: project, error } = await supabase
        .from('projects')
        .insert([{ ...data, created_by: user.id, resource_order: [] }])
        .select()
        .single();

      if (error) throw error;
      return projectSchema.parse(project);
    },

    async update(id: string, data: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) {
      const { data: project, error } = await supabase
        .from('projects')
        .update({
          ...data,
          // Format dates to be stored with time to maintain timezone
          ...(data.start_date && { start_date: new Date(data.start_date + 'T00:00:00').toISOString() }),
          ...(data.end_date && { end_date: new Date(data.end_date + 'T00:00:00').toISOString() })
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Project not found or you do not have permission to update it');
        }
        throw error;
      }
      
      return projectSchema.parse(project);
    },

    async updateResourceOrder(id: string, resourceOrder: string[]) {
      const { data: project, error } = await supabase
        .from('projects')
        .update({ resource_order: resourceOrder })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return projectSchema.parse(project);
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async list() {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return z.array(projectSchema).parse(projects);
    },
  },

  resources: {
    async create(data: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) {
      const { data: resource, error } = await supabase
        .from('resources')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return resourceSchema.parse(resource);
    },

    async update(id: string, data: Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>>) {
      const { data: resource, error } = await supabase
        .from('resources')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return resourceSchema.parse(resource);
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async list() {
      const { data: resources, error } = await supabase
        .from('resources')
        .select('*')
        .order('name');

      if (error) throw error;
      return z.array(resourceSchema).parse(resources);
    },
  },

  allocations: {
    async create(data: Omit<Allocation, 'id' | 'created_at' | 'updated_at'>) {
      const { data: allocation, error } = await supabase
        .from('allocations')
        .upsert([data], {
          onConflict: 'project_id,resource_id,project_quarter_number',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('This allocation already exists');
        }
        throw error;
      }

      return allocationSchema.parse(allocation);
    },

    async update(id: string, data: Partial<Omit<Allocation, 'id' | 'created_at' | 'updated_at'>>) {
      const { data: allocation, error } = await supabase
        .from('allocations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return allocationSchema.parse(allocation);
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('allocations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    async list() {
      const { data: allocations, error } = await supabase
        .from('allocations')
        .select('*')
        .order('project_quarter_number', { ascending: true });

      if (error) throw error;
      return z.array(allocationSchema).parse(allocations);
    },

    async getCalendarAllocations() {
      const { data: allocations, error } = await supabase
        .from('calendar_allocations')
        .select('*')
        .order('calendar_year', { ascending: true })
        .order('calendar_quarter', { ascending: true });

      if (error) throw error;
      return z.array(calendarAllocationSchema).parse(allocations);
    },
  },
};

// Import/Export Utilities
export const importExport = {
  async exportData() {
    try {
      const [projects, resources, allocations] = await Promise.all([
        db.projects.list(),
        db.resources.list(),
        db.allocations.list(),
      ]);

      return {
        projects,
        resources,
        allocations,
        exported_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export data. Please try again.');
    }
  },

  async importData(data: unknown) {
    const importSchema = z.object({
      projects: z.array(projectSchema),
      resources: z.array(resourceSchema),
      allocations: z.array(allocationSchema),
      exported_at: z.string(),
    });

    try {
      const validated = importSchema.parse(data);
      
      // First check if user is admin
      const isAdmin = await roles.isAdmin();
      if (!isAdmin) {
        throw new Error('Access denied. Only administrators can import data.');
      }

      const { error } = await supabase.rpc('import_data', {
        projects: validated.projects,
        resources: validated.resources,
        allocations: validated.allocations,
      });

      if (error) {
        console.error('Import error:', error);
        if (error.message.includes('permission denied') || error.message.includes('Access denied')) {
          throw new Error('You do not have permission to import data. Please contact your administrator.');
        } else if (error.message.includes('Failed to clear existing data')) {
          throw new Error('Failed to prepare database for import. Please try again.');
        } else if (error.message.includes('Failed to import')) {
          throw new Error(error.message);
        } else {
          throw new Error('Failed to import data. Please check your file format and try again.');
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error);
        throw new Error('Invalid data format. Please ensure you are using a valid export file.');
      }
      throw error;
    }
  },
};

export interface UserRoleWithEmail extends UserRoleData {
  email: string;
}

// Role Management
export const roles = {
  async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error('Error in getCurrentUserRole:', error);
      return null;
    }
  },

  async isAdmin(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'admin';
  },

  async updateUserRole(userId: string, role: UserRole): Promise<UserRoleData | null> {
    try {
      // The RLS policy will handle the admin check
      const { data, error } = await supabase
        .from('user_roles')
        .update({ 
          role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      throw error;
    }
  },

  async listUserRoles(): Promise<UserManagementData[]> {
    try {
      const { data, error } = await supabase
        .from('user_management_view')
        .select('*')
        .order('last_login', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in listUserRoles:', error);
      throw error;
    }
  }
};