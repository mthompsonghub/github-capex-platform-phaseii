export const APP_VERSION = '1.0.0';

// Function to check if the app version has changed
export const hasVersionChanged = () => {
  const storedVersion = localStorage.getItem('app_version');
  return !storedVersion || storedVersion !== APP_VERSION;
};

// Function to update the stored version
export const updateStoredVersion = () => {
  localStorage.setItem('app_version', APP_VERSION);
};

// Function to clear auth data without affecting app version
export const clearAuthData = () => {
  const appVersion = localStorage.getItem('app_version');
  
  // Clear localStorage except app_version
  localStorage.clear();
  if (appVersion) {
    localStorage.setItem('app_version', appVersion);
  }
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(';').forEach(cookie => {
    document.cookie = cookie
      .replace(/^ +/, '')
      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  });
};