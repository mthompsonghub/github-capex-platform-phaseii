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