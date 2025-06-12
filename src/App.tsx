import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { useDataStore } from './stores/dataStore';
import { APP_VERSION, hasVersionChanged, updateStoredVersion, clearAuthData } from './config/appConfig';
import toast from 'react-hot-toast';
import { Dashboard } from './components/Dashboard';
import { ResourceMatrixApp } from './components/ResourceMatrixApp';
import { KPIOverviewPage } from './pages/KPIOverviewPage';
import { UserManagement } from './components/UserManagement';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchInitialData } = useDataStore();
  const initialDataLoaded = useRef(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);

        // Check for version change
        if (hasVersionChanged()) {
          toast.success('Application has been updated. Please log in again.', {
            duration: 3000,
            position: 'top-center'
          });

          updateStoredVersion();
          await supabase.auth.signOut();
          clearAuthData();

          setTimeout(() => {
            window.location.replace('/');
          }, 2000);
          return;
        }

        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          return;
        }

        if (initialSession && !initialDataLoaded.current) {
          setSession(initialSession);
          await fetchInitialData();
          initialDataLoaded.current = true;
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && !initialDataLoaded.current) {
        setSession(session);
        try {
          await fetchInitialData();
          initialDataLoaded.current = true;
        } catch (error) {
          console.error('Error fetching data after sign in:', error);
          toast.error('Failed to load your data. Please refresh the page.');
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        initialDataLoaded.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchInitialData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster />
        {!session ? (
          <Auth />
        ) : (
          <>
            <Header />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/resource-matrix/*" element={<ResourceMatrixApp />} />
                <Route path="/kpi-overview" element={<KPIOverviewPage />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;