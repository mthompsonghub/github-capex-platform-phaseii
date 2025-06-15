import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Settings } from 'lucide-react';
import { useCapExStore } from '../stores/capexStore';

export function Header() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const isAdmin = useCapExStore(state => state.isAdmin) ?? false;
  const openAdminModal = useCapExStore(state => state.actions.openAdminModal);

  // Check if we're in the CapEx application
  const isInCapExApp = location.pathname.startsWith('/kpi-overview') || 
                      location.pathname.startsWith('/capex') ||
                      location.pathname.startsWith('/matrix');

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/logo union agener.jpg" 
                alt="Union Agener Logo" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-lg font-semibold">CapEx Platform</h1>
                <p className="text-xs text-gray-500">Enterprise Resource Management</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && isInCapExApp && (
              <button
                onClick={openAdminModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Admin Settings
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}