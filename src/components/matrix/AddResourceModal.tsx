import { useState } from 'react';
import { X, Plus, Users } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import toast from 'react-hot-toast';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

type Mode = 'select' | 'create';

interface ResourceForm {
  name: string;
  title: string;
  department: string;
}

export function AddResourceModal({
  isOpen,
  onClose,
  projectId,
}: AddResourceModalProps) {
  const [mode, setMode] = useState<Mode>('select');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [formData, setFormData] = useState<ResourceForm>({
    name: '',
    title: '',
    department: '',
  });
  const [errors, setErrors] = useState<Partial<ResourceForm>>({});

  const { 
    resources, 
    getProjectResources, 
    addResourceToProject,
    createResource 
  } = useDataStore();

  if (!isOpen) return null;

  const projectResources = getProjectResources(projectId);
  const availableResources = resources.filter(
    (resource) => !projectResources.some((pr) => pr.id === resource.id)
  );

  const validateForm = () => {
    const newErrors: Partial<ResourceForm> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'select') {
        if (!selectedResourceId) {
          toast.error('Please select a resource');
          return;
        }
        await addResourceToProject(projectId, selectedResourceId);
        toast.success('Resource added successfully');
      } else {
        if (!validateForm()) return;
        
        const newResource = await createResource(formData);
        await addResourceToProject(projectId, newResource.id);
        toast.success('New resource created and added to project');
      }
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add resource');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[32rem] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Resource to Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMode('select')}
            className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center space-x-2 ${
              mode === 'select'
                ? 'bg-union-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Select Existing</span>
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center space-x-2 ${
              mode === 'create'
                ? 'bg-union-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Create New</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'select' ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Resource
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent"
              >
                <option value="">Select a resource...</option>
                {availableResources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} - {resource.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                )}
              </div>
            </div>
          )}

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
              {mode === 'select' ? 'Add Resource' : 'Create & Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}