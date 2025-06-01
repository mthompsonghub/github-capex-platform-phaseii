import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { useDataStore } from '../../stores/dataStore';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDataModal({ isOpen, onClose }: ImportDataModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importAllData } = useDataStore();

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    try {
      if (file.type === 'application/json') {
        const text = await file.text();
        const data = JSON.parse(text);
        await importAllData(data);
      } else if (file.type === 'text/csv') {
        Papa.parse(file, {
          header: true,
          complete: async (results) => {
            if (results.errors.length > 0) {
              throw new Error('Invalid CSV format');
            }
            await importAllData(results.data);
          },
          error: (error) => {
            throw new Error(`CSV parsing error: ${error.message}`);
          }
        });
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }
      
      toast.success('Data imported successfully');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to import data');
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[32rem]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Import Data</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? 'border-union-red bg-red-50' : 'border-gray-300'
          }`}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Drag and drop your file here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-union-red hover:text-union-red-dark"
            >
              browse
            </button>
          </p>
          <p className="text-sm text-gray-500">
            Supports JSON and CSV formats
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}