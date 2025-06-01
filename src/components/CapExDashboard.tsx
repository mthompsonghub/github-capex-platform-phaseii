import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

export function CapExDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Welcome to the CapEx Platform
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Select an application to get started.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/apps/resource-matrix"
            className="group relative w-48 flex flex-col items-center justify-center py-6 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-union-red hover:bg-union-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-union-red transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <LayoutDashboard className="h-8 w-8 mb-2" />
            <span className="text-lg">Resource Matrix</span>
          </Link>
        </div>
      </div>
    </div>
  );
}