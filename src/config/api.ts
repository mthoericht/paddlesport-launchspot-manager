// API Configuration
// Uses the same host as the frontend, but with port 3001 for the backend

const getApiBaseUrl = (): string => {
  // In production, you might want to use environment variables
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For development: use the same hostname as the frontend, but port 3001
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

export const API_BASE_URL = getApiBaseUrl();

