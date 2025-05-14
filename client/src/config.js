// Configuration for different environments
const config = {
  // API URLs
  // For now, we'll use a direct approach to bypass CORS in production
  // In a real production environment, you should properly configure CORS on your server
  apiUrl: process.env.NODE_ENV === 'production' 
    ? '/api' // Use relative path to avoid CORS in production
    : 'http://localhost:5000/api',
  
  // External API URLs
  mutualFundApiUrl: 'https://api.mfapi.in/mf',
  
  // Flag to indicate if we're in production
  isProduction: process.env.NODE_ENV === 'production'
};

export default config;
