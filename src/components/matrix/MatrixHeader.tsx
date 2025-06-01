import { Search } from 'lucide-react';

interface MatrixHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function MatrixHeader({ searchTerm, onSearchChange }: MatrixHeaderProps) {
  return (
    <div className="flex items-center space-x-4 mb-4">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search projects or resources..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-union-red focus:border-union-red sm:text-sm"
        />
      </div>
    </div>
  );
}