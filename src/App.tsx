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
import { useCapExStore } from './stores/capexStore';

console.log('App starting...');

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchInitialData } = useDataStore();
  const { actions } = useCapExStore();
  const initialDataLoaded = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  // Safety timeout for loading state
  useEffect(() => {
    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.error('Loading timeout reached - forcing app to render');
        setIsLoading(false);
        toast.error('Application took too long to load. Please refresh the page.');
      }, 10000); // 10 second timeout
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        setIsLoading(true);

        // Check for version change
        if (hasVersionChanged()) {
          console.log('Version change detected');
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
        console.log('Fetching initial session...');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          toast.error('Failed to initialize session. Please refresh the page.');
          return;
        }

        if (initialSession && !initialDataLoaded.current) {
          console.log('Session found, fetching initial data...');
          setSession(initialSession);
          await fetchInitialData();
          initialDataLoaded.current = true;
        } else {
          console.log('No session found or data already loaded');
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        toast.error('Failed to initialize application. Please refresh the page.');
      } finally {
        console.log('Initialization complete');
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

    return () => {
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [fetchInitialData]);

  useEffect(() => {
    if (session) {
      actions.initializePermissions();
    }
  }, [session, actions]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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