// Configuration for different environments
const config = {
  // API URLs
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://mutual-fund-analyzer-server.vercel.app/api' // Replace with your actual deployed API URL
    : 'http://localhost:5000/api',
  
  // External API URLs
  mutualFundApiUrl: 'https://api.mfapi.in/mf'
};

export default config;
