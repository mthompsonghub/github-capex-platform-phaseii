import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { useDataStore } from './stores/dataStore';
import { APP_VERSION, hasVersionChanged, updateStoredVersion, clearAuthData } from './config/appConfig';
import toast from 'react-hot-toast';
import { CapExDashboard } from './components/CapExDashboard';
import { ResourceMatrixApp } from './components/ResourceMatrixApp';

function App() {
  const [session, setSession] = useState(null);
  const { fetchInitialData } = useDataStore();

  useEffect(() => {
    const initializeApp = async () => {
      // Check for version change
      if (hasVersionChanged()) {
        // First, show the update notification
        toast.success('Application has been updated. Please log in again.', {
          duration: 3000,
          position: 'top-center'
        });

        // Update stored version before clearing data
        updateStoredVersion();

        // Sign out and clear data
        await supabase.auth.signOut();
        clearAuthData();

        // Force reload after a brief delay to show the toast
        setTimeout(() => {
          window.location.replace('/');
        }, 2000);

        return;
      }

      try {
        // Attempt to get the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setSession(null);
          return;
        }

        setSession(session);
        if (session) {
          await fetchInitialData();
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        setSession(null);
      }
    };

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setSession(session);
        await fetchInitialData();
      } else {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchInitialData]);

  return (
    <Router>
      <Toaster position="top-right" />
      {session && <Header session={session} />}
      <Routes>
        <Route path="/" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={session ? <CapExDashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/apps/resource-matrix/*"
          element={session ? <ResourceMatrixApp /> : <Navigate to="/" />}
        />
        <Route path="*" element={session ? <Navigate to="/dashboard" /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;