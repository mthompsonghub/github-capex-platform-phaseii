import { useState } from 'react';
import { X } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import { Resource } from '../../types';
import toast from 'react-hot-toast';

interface AddResourceToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function AddResourceToProjectModal({
  isOpen,
  onClose,
  projectId,
}: AddResourceToProjectModalProps) {
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const { resources, getProjectResources, addResourceToProject } = useDataStore();

  if (!isOpen) return null;

  const projectResources = getProjectResources(projectId);
  const availableResources = resources.filter(
    (resource) => !projectResources.some((pr) => pr.id === resource.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) {
      toast.error('Please select a resource');
      return;
    }

    try {
      await addResourceToProject(projectId, selectedResourceId);
      toast.success('Resource added successfully');
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
      <div className="bg-white rounded-lg p-6 w-[32rem]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Resource to Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
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
          <div className="flex justify-end space-x-3">
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
              Add Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}