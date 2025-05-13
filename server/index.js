require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/portfolios', require('./routes/portfolios'));
app.use('/api/analyze', require('./routes/analyze'));

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Error handling middleware
app.use(errorHandler);

// Port Configuration
const PORT = process.env.PORT || 5000;

// Start server and database connection
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();