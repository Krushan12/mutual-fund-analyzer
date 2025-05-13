const express = require('express');
const router = express.Router();
const axios = require('axios');
const { MutualFund } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/mutual-funds/search
// @desc    Search mutual funds
// @access  Public (or Private if you prefer)
router.get('/search', async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ msg: 'Search query is required' });
    }

    // Search in our database first
    const funds = await MutualFund.findAll({
      where: {
        name: {
          [Op.iLike]: `%${query}%`
        }
      },
      limit: 10
    });

    // If not found in database, fetch from external API
    if (funds.length === 0) {
      const response = await axios.get(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
      return res.json(response.data);
    }

    res.json(funds);
  } catch (err) {
    console.error('Error searching mutual funds:', err);
    next(err);
  }
});

// @route   GET api/mutual-funds/:schemeCode
// @desc    Get mutual fund details and NAV history
// @access  Public (or Private if you prefer)
router.get('/:schemeCode', async (req, res, next) => {
  try {
    const { schemeCode } = req.params;
    const { duration = '1y' } = req.query; // 1m, 3m, 6m, 1y, 3y, 5y, 10y

    // First check if we have recent data in our database
    const fund = await MutualFund.findOne({
      where: { schemeCode },
      order: [['navDate', 'DESC']]
    });

    // If we have recent data (within 1 day), use it
    if (fund && new Date() - new Date(fund.navDate) < 24 * 60 * 60 * 1000) {
      // Get historical data from our database or fetch from API
      const historicalData = await getHistoricalDataFromAPI(schemeCode, duration);
      return res.json({
        ...fund.toJSON(),
        historicalData
      });
    }

    // If no recent data, fetch from external API
    const [detailsResponse, navResponse] = await Promise.all([
      axios.get(`https://api.mfapi.in/mf/${schemeCode}`),
      axios.get(`https://api.mfapi.in/mf/${schemeCode}/latest`)
    ]);

    const fundData = {
      schemeCode,
      name: detailsResponse.data.meta.scheme_name,
      category: detailsResponse.data.meta.scheme_category,
      latestNav: navResponse.data.data[0].nav,
      navDate: navResponse.data.data[0].date,
      fundHouse: detailsResponse.data.meta.fund_house,
      details: detailsResponse.data
    };

    // Save to database for future use
    await MutualFund.upsert(fundData);

    // Get historical data for charts
    const historicalData = await getHistoricalDataFromAPI(schemeCode, duration);

    res.json({
      ...fundData,
      historicalData
    });
  } catch (err) {
    console.error('Error fetching mutual fund details:', err);
    next(err);
  }
});

// Helper function to get historical data
async function getHistoricalDataFromAPI(schemeCode, duration) {
  try {
    const durationMap = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      '3y': 365 * 3,
      '5y': 365 * 5,
      '10y': 365 * 10
    };

    const count = durationMap[duration] || 365; // Default to 1 year
    const response = await axios.get(`https://api.mfapi.in/mf/${schemeCode}?count=${count}`);
    
    return response.data.data
      .map(item => ({
        date: item.date,
        nav: parseFloat(item.nav)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
}

module.exports = router;
