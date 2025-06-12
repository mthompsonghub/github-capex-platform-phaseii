import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddProjectModal } from './AddProjectModal';

export function AddProjectButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition-all hover:shadow-xl font-semibold text-lg"
      >
        <Plus className="h-6 w-6" />
        Add New Project
      </button>

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
} 