import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';
import Spinner from '../components/Spinner';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  // Fetch all portfolios
  useEffect(() => {
    // Only fetch portfolios if user is authenticated
    if (!authLoading && currentUser) {
      const fetchPortfolios = async () => {
        try {
          setLoading(true);
          const res = await axios.get('http://localhost:5000/api/portfolios');
          setPortfolios(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching portfolios:', err);
          setError(err.response?.data?.msg || 'Failed to load portfolios');
          setPortfolios([]);
          setLoading(false);
        }
      };

      fetchPortfolios();
    }
  }, [currentUser, authLoading]);

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/portfolios', newPortfolio);
      setPortfolios([...portfolios, res.data]);
      setNewPortfolio({ name: '', description: '' });
      setShowAddPortfolio(false);
      setLoading(false);
    } catch (err) {
      console.error('Error adding portfolio:', err);
      setError(err.response?.data?.msg || 'Failed to add portfolio');
      setLoading(false);
    }
  };

  // Calculate portfolio statistics
  const calculateStats = (portfolio) => {
    if (!portfolio.holdings || portfolio.holdings.length === 0) {
      return {
        totalValue: 0,
        totalInvestment: 0,
        returnPercentage: 0
      };
    }

    const totalValue = portfolio.holdings.reduce((sum, holding) => {
      return sum + (holding.units * (holding.MutualFund?.latestNav || holding.buyPrice));
    }, 0);

    const totalInvestment = portfolio.holdings.reduce((sum, holding) => {
      return sum + (holding.units * holding.buyPrice);
    }, 0);

    const returnPercentage = totalInvestment > 0 
      ? ((totalValue - totalInvestment) / totalInvestment) * 100 
      : 0;

    return {
      totalValue,
      totalInvestment,
      returnPercentage
    };
  };

  // Create chart data for portfolio summary
  const getPortfolioChartData = (portfolio) => {
    // If portfolio has no holdings, return empty data
    if (!portfolio.holdings || portfolio.holdings.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
          borderWidth: 1
        }]
      };
    }

    // Group holdings by category
    const categoryMap = {};
    
    portfolio.holdings.forEach(holding => {
      const category = holding.MutualFund?.category || 'Unknown';
      const value = holding.units * (holding.MutualFund?.latestNav || holding.buyPrice);
      
      if (categoryMap[category]) {
        categoryMap[category] += value;
      } else {
        categoryMap[category] = value;
      }
    });

    const categories = Object.keys(categoryMap);
    const values = Object.values(categoryMap);
    
    // Colors for chart
    const backgroundColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#8BC34A', '#607D8B', '#E91E63', '#2196F3'
    ];

    return {
      labels: categories,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors.slice(0, categories.length),
        borderWidth: 1
      }]
    };
  };

  if (loading) return <Spinner />;

  if (error) return (
    <div className="error-message">
      {error}
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Your Portfolios</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddPortfolio(true)}
        >
          Add Portfolio
        </button>
      </div>

      {showAddPortfolio && (
        <div className="add-portfolio-form">
          <h2>Create New Portfolio</h2>
          <form onSubmit={handleAddPortfolio}>
            <div className="form-group">
              <label htmlFor="name">Portfolio Name</label>
              <input
                type="text"
                id="name"
                value={newPortfolio.name}
                onChange={(e) => setNewPortfolio({...newPortfolio, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                value={newPortfolio.description}
                onChange={(e) => setNewPortfolio({...newPortfolio, description: e.target.value})}
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn btn-success">Create Portfolio</button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowAddPortfolio(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {portfolios.length > 0 ? (
        <div className="portfolio-grid">
          {portfolios.map(portfolio => {
            const stats = calculateStats(portfolio);
            
            return (
              <div 
                key={portfolio.id} 
                className="portfolio-card"
                onClick={() => navigate(`/portfolio/${portfolio.id}`)}
              >
                <h3>{portfolio.name || 'Unnamed Portfolio'}</h3>
                
                <div className="portfolio-summary">
                  <div className="chart-container">
                    <Pie 
                      data={getPortfolioChartData(portfolio)} 
                      options={{ 
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                      id={`portfolio-chart-${portfolio.id}`} // Add unique ID
                    />
                  </div>
                  
                  <div className="stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Value:</span>
                      <span className="stat-value">₹{stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Investment:</span>
                      <span className="stat-value">₹{stats.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Return:</span>
                      <span className={`stat-value ${stats.returnPercentage >= 0 ? 'text-success' : 'text-danger'}`}>
                        {stats.returnPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-portfolios">
          <p>No portfolios found. Create your first portfolio!</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddPortfolio(true)}
          >
            Create Portfolio
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;