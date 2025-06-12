import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectStatus, ProjectPriority } from '../../types';
import toast from 'react-hot-toast';

interface ProjectFormData {
  name: string;
  owner: string;
  projectType: 'project' | 'asset_purchase';
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date: string;
  yearlyBudget: number;
  sesAssetNumber: string;
  upcomingMilestone: string;
  commentsRisk: string;
}

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS = ['Active', 'Inactive', 'Planned', 'Completed', 'On Hold'] as const;
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'] as const;

const baseInputStyles = 'w-full px-3 py-2 border-gray-200 rounded-md bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200';

export function AddProjectModal({ isOpen, onClose }: AddProjectModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    owner: '',
    projectType: 'project',
    status: 'Planned',
    priority: 'Medium',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    yearlyBudget: 0,
    sesAssetNumber: '',
    upcomingMilestone: '',
    commentsRisk: ''
  });

  const { refreshProjects } = useProjectStore();

  const handleInputChange = (field: keyof ProjectFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Insert project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          owner: formData.owner,
          project_type: formData.projectType,
          status: formData.status,
          priority: formData.priority,
          start_date: formData.start_date,
          end_date: formData.end_date
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Insert project phases
      const { error: phasesError } = await supabase
        .from('project_phases')
        .insert({
          project_id: project.id,
          yearly_budget: formData.yearlyBudget,
          ses_asset_number: formData.sesAssetNumber,
          upcoming_milestone: formData.upcomingMilestone,
          comments_risk: formData.commentsRisk
        });

      if (phasesError) throw phasesError;

      toast.success('Project created successfully');
      refreshProjects();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[32rem] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={baseInputStyles}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Owner
            </label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              className={baseInputStyles}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Type
            </label>
            <select
              value={formData.projectType}
              onChange={(e) => handleInputChange('projectType', e.target.value)}
              className={baseInputStyles}
            >
              <option value="project">Project</option>
              <option value="asset_purchase">Asset Purchase</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as ProjectStatus)}
              className={baseInputStyles}
              required
            >
              <option value="">Select Status</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as ProjectPriority)}
              className={baseInputStyles}
              required
            >
              <option value="">Select Priority</option>
              {PRIORITY_OPTIONS.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className={baseInputStyles}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              className={baseInputStyles}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yearly Budget
            </label>
            <input
              type="number"
              value={formData.yearlyBudget}
              onChange={(e) => handleInputChange('yearlyBudget', parseFloat(e.target.value))}
              className={baseInputStyles}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SES Asset Number
            </label>
            <input
              type="text"
              value={formData.sesAssetNumber}
              onChange={(e) => handleInputChange('sesAssetNumber', e.target.value)}
              className={baseInputStyles}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upcoming Milestone
            </label>
            <input
              type="text"
              value={formData.upcomingMilestone}
              onChange={(e) => handleInputChange('upcomingMilestone', e.target.value)}
              className={baseInputStyles}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments/Risk
            </label>
            <textarea
              value={formData.commentsRisk}
              onChange={(e) => handleInputChange('commentsRisk', e.target.value)}
              className={`${baseInputStyles} resize-none`}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-union-red text-white rounded-md hover:bg-union-red-dark"
            >
              Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 