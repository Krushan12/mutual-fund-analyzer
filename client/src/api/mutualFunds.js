import axios from 'axios';
import config from '../config';

// Get API URLs from config
const API_URL = config.apiUrl;
const MF_API_URL = config.mutualFundApiUrl;

/**
 * Search mutual funds by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching funds
 */
export const searchFunds = async (query) => {
  try {
    // Use the server-side search endpoint instead of direct API call
    const response = await axios.get(`${API_URL}/mutual-funds/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching funds:', error);
    throw error;
  }
};

/**
 * Get latest NAV for a mutual fund
 * @param {number|string} schemeCode - Fund scheme code
 * @returns {Promise<Object>} - Latest NAV data
 */
export const getLatestNav = async (schemeCode) => {
  try {
    const response = await axios.get(`${API_URL}/mutual-funds/${schemeCode}`);
    return {
      latestNav: response.data.latestNav,
      navDate: response.data.navDate,
      name: response.data.name,
      category: response.data.category,
      fundHouse: response.data.fundHouse
    };
  } catch (error) {
    console.error('Error fetching latest NAV:', error);
    throw error;
  }
};

/**
 * Get fund details and NAV history
 * @param {number|string} schemeCode - Fund scheme code
 * @param {string} duration - Duration for historical data (1m, 3m, 6m, 1y, 3y, 5y, 10y)
 * @returns {Promise<Object>} - Fund details with historical data
 */
export const getFundDetails = async (schemeCode, duration = '1y') => {
  try {
    // Use the server endpoint instead of direct API call to avoid CORS issues
    const response = await axios.get(`${API_URL}/mutual-funds/${schemeCode}?duration=${duration}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching fund details for ${schemeCode}:`, error);
    
    // Return a placeholder object if the API call fails
    return {
      schemeCode,
      name: `Fund ${schemeCode}`,
      category: 'N/A',
      fundHouse: 'N/A',
      latestNav: 0,
      navDate: null,
      historicalData: [],
      details: { meta: {}, data: [] }
    };
  }
};

/**
 * Get historical NAV data
 * @param {number|string} schemeCode - Fund scheme code
 * @param {string} duration - Duration for historical data
 * @returns {Promise<Array>} - Array of historical NAV data
 */
export const getFundHistory = async (schemeCode, duration = '1y') => {
  try {
    // Use the server endpoint to get fund details
    const response = await axios.get(`${API_URL}/mutual-funds/${schemeCode}?duration=${duration}`);
    return response.data.historicalData || [];
  } catch (error) {
    console.error('Error fetching fund history:', error);
    return []; // Return empty array instead of throwing error
  }
};

/**
 * Get top 10 mutual funds with details
 * @returns {Promise<Array>} - Array of top mutual funds
 */
export const getTopFunds = async () => {
  try {
    // Use the server endpoint instead of direct API call to avoid CORS issues
    const response = await axios.get(`${API_URL}/mutual-funds/top10`);
    return response.data;
  } catch (error) {
    console.error('Error fetching top funds:', error);
    // Return sample data if API call fails
    return [
      {
        schemeCode: '100034',
        schemeName: 'SBI Equity Hybrid Fund',
        name: 'SBI Equity Hybrid Fund',
        category: 'Hybrid',
        fundHouse: 'SBI Mutual Fund',
        latestNav: 205.45,
        navDate: '2023-05-12'
      },
      {
        schemeCode: '119598',
        schemeName: 'Axis Bluechip Fund',
        name: 'Axis Bluechip Fund',
        category: 'Equity',
        fundHouse: 'Axis Mutual Fund',
        latestNav: 45.67,
        navDate: '2023-05-12'
      },
      {
        schemeCode: '118989',
        schemeName: 'HDFC Mid-Cap Opportunities Fund',
        name: 'HDFC Mid-Cap Opportunities Fund',
        category: 'Mid Cap',
        fundHouse: 'HDFC Mutual Fund',
        latestNav: 98.32,
        navDate: '2023-05-12'
      },
      {
        schemeCode: '120505',
        schemeName: 'Mirae Asset Large Cap Fund',
        name: 'Mirae Asset Large Cap Fund',
        category: 'Large Cap',
        fundHouse: 'Mirae Asset Mutual Fund',
        latestNav: 76.21,
        navDate: '2023-05-12'
      },
      {
        schemeCode: '120465',
        schemeName: 'ICICI Prudential Bluechip Fund',
        name: 'ICICI Prudential Bluechip Fund',
        category: 'Large Cap',
        fundHouse: 'ICICI Prudential Mutual Fund',
        latestNav: 65.87,
        navDate: '2023-05-12'
      }
    ];
  }
};

/**
 * Compare multiple mutual funds
 * @param {Array|string} schemeCodes - Array or comma-separated string of scheme codes
 * @param {string} duration - Duration for historical data
 * @returns {Promise<Array>} - Array of fund data for comparison
 */
export const compareFunds = async (schemeCodes, duration = '1y') => {
  try {
    // Parse scheme codes if provided as string
    const schemeCodeArray = Array.isArray(schemeCodes) 
      ? schemeCodes 
      : schemeCodes.split(',').map(code => code.trim());
    
    if (schemeCodeArray.length < 2) {
      throw new Error('At least two scheme codes are required for comparison');
    }
    
    // Use the server endpoint for comparison
    const response = await axios.get(`${API_URL}/mutual-funds/compare?schemeCodes=${schemeCodeArray.join(',')}&duration=${duration}`);
    return response.data;
  } catch (error) {
    console.error('Error comparing funds:', error);
    
    // Return sample data if API call fails
    if (Array.isArray(schemeCodes) || typeof schemeCodes === 'string') {
      const schemeCodeArray = Array.isArray(schemeCodes) 
        ? schemeCodes 
        : schemeCodes.split(',').map(code => code.trim());
      
      return schemeCodeArray.map(code => ({
        schemeCode: code,
        name: `Fund ${code}`,
        fundHouse: 'N/A',
        category: 'N/A',
        latestNav: 0,
        navDate: null,
        historicalData: []
      }));
    }
    
    return [];
  }
};
