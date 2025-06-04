import { useState, useEffect } from 'react';
import { roles as rolesApi } from '../lib/supabase';
import { UserRoleWithEmail, UserRole } from '../types/roles';
import toast from 'react-hot-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

export function UserRolesManager() {
  const [userRoles, setUserRoles] = useState<UserRoleWithEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        // First get current user's role
        const userRole = await rolesApi.getCurrentUserRole();
        setCurrentUserRole(userRole);

        if (userRole !== 'admin') {
          toast.error('You do not have permission to access this section');
          return;
        }

        // Then load all roles
        const roles = await rolesApi.listUserRoles();
        setUserRoles(roles);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load user roles');
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (currentUserRole !== 'admin') {
      toast.error('You do not have permission to update roles');
      return;
    }

    setIsUpdating(userId);
    try {
      await rolesApi.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      // Reload the list
      const roles = await rolesApi.listUserRoles();
      setUserRoles(roles);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update user role');
      }
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (currentUserRole !== 'admin') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              You do not have permission to access this section. Please contact an administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          User Role Management
        </h3>
        <div className="mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Email
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userRoles.map((userRole) => (
                <tr key={userRole.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {userRole.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userRole.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={userRole.role}
                      onChange={(e) => handleRoleChange(userRole.user_id, e.target.value as UserRole)}
                      disabled={isUpdating === userRole.user_id}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-union-red focus:border-union-red sm:text-sm rounded-md"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 