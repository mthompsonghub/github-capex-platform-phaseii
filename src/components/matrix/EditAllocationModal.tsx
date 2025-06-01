import { useState } from 'react';
import { X } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import toast from 'react-hot-toast';

interface EditAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  resourceId: string;
  year: number;
  quarter: number;
  currentAllocation: number;
}

export function EditAllocationModal({
  isOpen,
  onClose,
  projectId,
  resourceId,
  year,
  quarter,
  currentAllocation,
}: EditAllocationModalProps) {
  const [allocation, setAllocation] = useState(currentAllocation);
  const updateAllocation = useDataStore((state) => state.updateAllocation);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allocation < 0 || allocation > 100) {
      toast.error('Allocation must be between 0 and 100%');
      return;
    }
    updateAllocation(projectId, resourceId, year, quarter, allocation);
    toast.success('Allocation updated successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Resource Allocation</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allocation Percentage
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={allocation}
              onChange={(e) => setAllocation(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-union-red focus:border-transparent"
            />
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}