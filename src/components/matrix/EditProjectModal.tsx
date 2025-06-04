import { useState } from 'react';
import { X } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { Project } from '../../types';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

interface FormErrors {
  name?: string;
  start_date?: string;
  end_date?: string;
}

const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function EditProjectModal({ isOpen, onClose, project }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: project.name,
    status: project.status,
    priority: project.priority,
    start_date: formatDateForInput(project.start_date),
    end_date: formatDateForInput(project.end_date),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProject = useDataStore((state) => state.updateProject);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Validate project name
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    // Validate dates
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    // Validate date range
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateToISO = (dateString: string) => {
    // Parse the YYYY-MM-DD format
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a date object in the local timezone at the start of the day
    const date = new Date(year, month - 1, day);
    
    // Get YYYY-MM-DD format in local timezone
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updates = {
        ...formData,
        start_date: formatDateToISO(formData.start_date),
        end_date: formatDateToISO(formData.end_date),
      };

      await updateProject(project.id, updates);
      toast.success('Project updated successfully');
      onClose();
      // Instead of page reload, refresh the data
      const { fetchInitialData } = useDataStore.getState();
      await fetchInitialData();
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message === 'Project not found or you do not have permission to update it'
          ? 'You can only edit projects that you created'
          : error.message;
        setErrors(prev => ({ ...prev, submit: errorMessage }));
        toast.error(errorMessage);
      } else {
        setErrors(prev => ({ ...prev, submit: 'Failed to update project' }));
        toast.error('Failed to update project');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[32rem]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Project Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Project['priority'] })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent ${
                  errors.start_date ? 'border-red-500' : 'border-gray-300'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-union-red text-white rounded-md hover:bg-union-red-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}