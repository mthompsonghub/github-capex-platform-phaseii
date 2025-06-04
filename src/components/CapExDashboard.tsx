import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users } from 'lucide-react';
import { UserRolesManager } from './UserRolesManager';
import { roles } from '../lib/supabase';
import { UserRole } from '../types/roles';

export function CapExDashboard() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        console.log('Loading user role...');
        const role = await roles.getCurrentUserRole();
        console.log('Loaded user role:', role);
        setUserRole(role);
      } catch (error) {
        console.error('Error loading user role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserRole();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome to the CapEx Platform
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Select an application to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/apps/resource-matrix"
            className="group relative flex flex-col items-center justify-center p-6 border border-transparent rounded-lg shadow-sm bg-union-red text-white hover:bg-union-red-dark transition-all duration-200"
          >
            <LayoutDashboard className="h-8 w-8 mb-2" />
            <span className="text-lg font-medium">Resource Matrix</span>
          </Link>

          {userRole === 'admin' && (
            <button
              onClick={() => document.getElementById('user-roles-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative flex flex-col items-center justify-center p-6 border border-transparent rounded-lg shadow-sm bg-gray-800 text-white hover:bg-gray-700 transition-all duration-200"
            >
              <Users className="h-8 w-8 mb-2" />
              <span className="text-lg font-medium">User Management</span>
            </button>
          )}
        </div>

        {userRole === 'admin' && (
          <div id="user-roles-section" className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">User Role Management</h3>
            <UserRolesManager />
          </div>
        )}
      </div>
    </div>
  );
}