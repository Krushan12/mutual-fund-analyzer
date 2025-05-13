import React, { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import './Portfolio.css'

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
)

const Portfolio = () => {
  const { id } = useParams()
  const { currentUser, loading: authLoading } = useAuth()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Only fetch portfolio data if user is authenticated
    if (!authLoading && currentUser) {
      const fetchPortfolio = async () => {
        try {
          setLoading(true)
          const res = await axios.get(`http://localhost:5000/api/portfolios/${id}`)
          setPortfolio(res.data)
          setLoading(false)
        } catch (err) {
          console.error('Error fetching portfolio:', err)
          setError(err.response?.data?.msg || 'Failed to load portfolio')
          setLoading(false)
        }
      }

      fetchPortfolio()
    }
  }, [id, currentUser, authLoading])

  if (loading) return <Spinner />

  if (error) return (
    <div className="error-message">
      {error}
    </div>
  )

  return (
    <div className="portfolio">
      <div className="portfolio-header">
        <h1>{portfolio.name}</h1>
      </div>

      <div className="portfolio-grid">
        <div className="portfolio-card">
          <h2>Asset Allocation</h2>
          <div className="chart-container">
            <Bar 
              data={getAllocationData(portfolio)} 
              options={{
                responsive: true,
                maintainAspectRatio: false
              }}
              id="allocation-chart"
            />
          </div>
        </div>
        <div className="portfolio-card">
          <h2>Performance</h2>
          <div className="chart-container">
            <Line 
              data={getPerformanceData(portfolio)} 
              options={{
                responsive: true,
                maintainAspectRatio: false
              }}
              id="performance-chart"
            />
          </div>
        </div>
      </div>

      <div className="portfolio-card">
        <h2>Holdings</h2>
        <table className="holdings-table">
          <thead>
            <tr>
              <th>Fund Name</th>
              <th>Units</th>
              <th>Avg. Buy Price</th>
              <th>Current Value</th>
              <th>Return %</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.holdings.map((holding, index) => (
              <tr key={index}>
                <td>{holding.scheme_code}</td>
                <td>{holding.units_held.toFixed(2)}</td>
                <td>₹{holding.buy_price.toFixed(2)}</td>
                <td>₹{(holding.units_held * holding.current_nav).toFixed(2)}</td>
                <td className={holding.return >= 0 ? 'text-success' : 'text-danger'}>
                  {holding.return.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getAllocationData(portfolio) {
  return {
    labels: portfolio.holdings.map(h => h.scheme_code),
    datasets: [{
      label: 'Value (₹)',
      data: portfolio.holdings.map(h => h.units_held * h.current_nav),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
      ]
    }]
  }
}

function getPerformanceData(portfolio) {
  return {
    labels: ['1M', '3M', '6M', '1Y', '3Y', '5Y'],
    datasets: [{
      label: 'Portfolio Return %',
      data: [5.2, 8.1, 12.4, 18.7, 45.2, 78.9],
      borderColor: '#36A2EB',
      tension: 0.1
    }]
  }
}

export default Portfolio