import { apiClient, externalApiClient } from './axiosConfig';
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
    if (config.isProduction) {
      // In production, search directly against the external API
      const response = await externalApiClient.get(MF_API_URL);
      const allFunds = response.data;
      
      // Filter funds by name (case-insensitive)
      const queryLower = query.toLowerCase();
      const filteredFunds = allFunds.filter(fund => 
        fund.schemeName.toLowerCase().includes(queryLower)
      ).slice(0, 20); // Limit to 20 results
      
      return filteredFunds;
    } else {
      // In development, use the server-side search endpoint
      const response = await apiClient.get(`/mutual-funds/search?query=${encodeURIComponent(query)}`);
      return response.data;
    }
  } catch (error) {
    console.error('Error searching funds:', error);
    // Return empty array instead of throwing error
    return [];
  }
};

/**
 * Get latest NAV for a mutual fund
 * @param {number|string} schemeCode - Fund scheme code
 * @returns {Promise<Object>} - Latest NAV data
 */
export const getLatestNav = async (schemeCode) => {
  try {
    const response = await apiClient.get(`/mutual-funds/${schemeCode}`);
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
    if (config.isProduction) {
      // In production, call the external API directly
      const response = await externalApiClient.get(`${MF_API_URL}/${schemeCode}`);
      const fundDetails = response.data;
      
      // Format the data for frontend use
      const durationMap = {
        '1m': 30,
        '3m': 90,
        '6m': 180,
        '1y': 365,
        '3y': 365 * 3,
        '5y': 365 * 5,
        '10y': 365 * 10
      };
      
      // Process historical data
      const dataCount = Math.min(durationMap[duration] || 365, fundDetails.data.length);
      const historicalData = fundDetails.data
        .slice(0, dataCount)
        .map(item => ({
          date: item.date,
          nav: parseFloat(item.nav)
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Create a formatted response
      return {
        schemeCode,
        name: fundDetails.meta.scheme_name,
        category: fundDetails.meta.scheme_category || 'N/A',
        fundHouse: fundDetails.meta.fund_house || 'N/A',
        latestNav: fundDetails.data[0] ? parseFloat(fundDetails.data[0].nav) : 0,
        navDate: fundDetails.data[0] ? fundDetails.data[0].date : null,
        historicalData: historicalData,
        details: fundDetails
      };
    } else {
      // In development, use the server endpoint
      const response = await apiClient.get(`/mutual-funds/${schemeCode}?duration=${duration}`);
      return response.data;
    }
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
    const response = await apiClient.get(`/mutual-funds/history/${schemeCode}?duration=${duration}`);
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
    // In production, we'll use direct API calls to avoid CORS issues
    if (config.isProduction) {
      // For production, use direct calls to the external API
      try {
        // Get all funds first
        const response = await externalApiClient.get(MF_API_URL);
        const allFunds = response.data;
        
        // Select 10 random funds
        const funds = [];
        const totalFunds = allFunds.length;
        const numFunds = Math.min(10, totalFunds);
        
        // Create a set to ensure we don't select the same fund twice
        const selectedIndices = new Set();
        
        while (selectedIndices.size < numFunds) {
          const randomIndex = Math.floor(Math.random() * totalFunds);
          if (!selectedIndices.has(randomIndex)) {
            selectedIndices.add(randomIndex);
            funds.push(allFunds[randomIndex]);
          }
        }
        
        // Get details for each fund
        const detailedFunds = await Promise.all(
          funds.map(async (fund) => {
            try {
              const detailsResponse = await externalApiClient.get(`${MF_API_URL}/${fund.schemeCode}`);
              const fundDetails = detailsResponse.data;
              
              return {
                schemeCode: fund.schemeCode,
                schemeName: fund.schemeName,
                name: fund.schemeName,
                category: fundDetails.meta?.scheme_category || 'N/A',
                fundHouse: fundDetails.meta?.fund_house || 'N/A',
                latestNav: fundDetails.data && fundDetails.data.length > 0 ? parseFloat(fundDetails.data[0].nav) : 0,
                navDate: fundDetails.data && fundDetails.data.length > 0 ? fundDetails.data[0].date : null
              };
            } catch (error) {
              console.error(`Error fetching details for fund ${fund.schemeCode}:`, error);
              // Return basic info if details fetch fails
              return {
                schemeCode: fund.schemeCode,
                schemeName: fund.schemeName,
                name: fund.schemeName,
                category: 'N/A',
                fundHouse: 'N/A',
                latestNav: 0,
                navDate: null
              };
            }
          })
        );
        
        return detailedFunds;
      } catch (error) {
        console.error('Error with direct API call:', error);
        throw error;
      }
    } else {
      // In development, use the server endpoint
      const response = await apiClient.get(`/mutual-funds/top10`);
      return response.data;
    }
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
    const response = await apiClient.get(`/mutual-funds/compare?schemeCodes=${schemeCodeArray.join(',')}&duration=${duration}`);
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
