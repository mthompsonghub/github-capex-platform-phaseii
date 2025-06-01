import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { useDataStore } from './stores/dataStore';
import { APP_VERSION, hasVersionChanged, updateStoredVersion } from './config/appConfig';
import toast from 'react-hot-toast';
import { CapExDashboard } from './components/CapExDashboard';
import { ResourceMatrixApp } from './components/ResourceMatrixApp';

function App() {
  const [session, setSession] = useState(null);
  const { fetchInitialData } = useDataStore();

  const clearAuthData = () => {
    // Clear all client-side storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Check for version change
      if (hasVersionChanged()) {
        // First, show the update notification
        toast.success('Application has been updated. Please log in again.', {
          duration: 3000,
          position: 'top-center'
        });

        // Sign out from Supabase first to properly invalidate the session
        await supabase.auth.signOut();
        clearAuthData();

        // Update stored version before reload
        updateStoredVersion();

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
          // If there's an error or no session, clear everything
          await supabase.auth.signOut();
          clearAuthData();
          setSession(null);
          return;
        }

        setSession(session);
        if (session) {
          await fetchInitialData();
        }
      } catch (error) {
        // Handle any unexpected errors
        console.error('Error during authentication:', error);
        await supabase.auth.signOut();
        clearAuthData();
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
        // Clear everything if the session becomes invalid
        clearAuthData();
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
        {/* Add a catch-all route for 404 or redirect to dashboard if logged in */}
        <Route path="*" element={session ? <Navigate to="/dashboard" /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;