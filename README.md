# Mutual Fund Analyzer

A comprehensive web application for analyzing and managing mutual fund portfolios. This application helps users track their mutual fund investments, analyze performance, and make informed investment decisions.

## Features

- User Authentication
- Portfolio Management
- Real-time NAV Updates
- Performance Analytics
- Interactive Charts and Visualizations
- Portfolio Comparison
- Holdings Analysis

## Tech Stack

### Frontend
- React 19
- Chart.js with react-chartjs-2
- React Router DOM
- Axios for API calls
- Bootstrap & React Bootstrap for UI
- Tailwind CSS for styling
- Vite as build tool

### Backend
- Node.js with Express
- PostgreSQL with Sequelize ORM
- JWT Authentication
- CORS enabled
- Morgan for logging
- External API integration with AMFI

## Getting Started

### Prerequisites
- Node.js (Latest LTS version)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install Backend Dependencies
```bash
cd server
npm install
```

3. Configure Environment Variables
Create a `.env` file in the server directory with the following variables:
```env
PORT=5000
NODE_ENV=development
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_SSL=true
JWT_SECRET=your-jwt-secret
```

4. Install Frontend Dependencies
```bash
cd ../client
npm install
```

5. Start the Development Servers

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## API Documentation

### Authentication Endpoints
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Portfolio Endpoints
- GET `/api/portfolios` - Get all portfolios
- GET `/api/portfolios/:id` - Get specific portfolio
- POST `/api/portfolios` - Create new portfolio
- PUT `/api/portfolios/:id` - Update portfolio
- DELETE `/api/portfolios/:id` - Delete portfolio

### Analysis Endpoints
- GET `/api/analyze/portfolio/:id` - Get portfolio analysis
- GET `/api/analyze/compare` - Compare multiple funds

### Mutual Funds Endpoints
- GET `/api/mutual-funds/search` - Search mutual funds
- GET `/api/mutual-funds/:id` - Get fund details

## Deployment

The application is deployed on:
- Frontend: Vercel (https://mutual-fund-analyzer.vercel.app)
- Backend: Render (https://mutual-fund-analyzer.onrender.com)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- AMFI India for providing mutual fund data
- Chart.js for visualization libraries
- All contributors and supporters of the project
