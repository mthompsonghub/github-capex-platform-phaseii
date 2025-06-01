import { LogOut } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

interface HeaderProps {
  session: Session;
}

export function Header({ session }: HeaderProps) {
  const location = useLocation();
  const isResourceMatrix = location.pathname.startsWith('/apps/resource-matrix');

  const handleLogout = async () => {
    console.log('Starting logout process');
    try {
      console.log('Calling supabase.auth.signOut()');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Supabase signOut completed successfully');

      toast.success('Successfully logged out', {
        duration: 2000,
        position: 'top-center'
      });

      console.log('Preparing for page redirect');
      setTimeout(() => {
        console.log('Executing page redirect');
        window.location.replace('/');
      }, 1500);
    } catch (error) {
      console.error('Logout error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred while logging out');
      }
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center group">
            <img 
              src="/logo union agener.jpg" 
              alt="Union Agener Logo" 
              className="h-10 w-auto transition-transform duration-200 group-hover:scale-105"
            />
            <div className="ml-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                {isResourceMatrix ? 'Project Resource Matrix' : 'CapEx Platform'}
              </h1>
              <p className="text-sm text-gray-500">
                {isResourceMatrix ? 'CapEx Resource Planning Tool' : 'Enterprise Resource Management'}
              </p>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{session.user.email}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-union-red hover:bg-union-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-union-red transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}