require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Parse CLIENT_URL (supports comma-separated list and strips trailing slashes)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim().replace(/\/+$/, ''))
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');

      if (
        !process.env.CLIENT_URL ||
        process.env.CLIENT_URL === '*' ||
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.options('*', cors());
app.use(express.json());

// Database connection middleware for serverless execution
app.use(async (req, res, next) => {
  // Let health checks respond even if DB is still connecting or misconfigured
  if (req.path === '/' || req.path === '/api/health') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error during request:', err.message);
    return res.status(500).json({
      message: 'Database connection failed. Please ensure MONGO_URI is configured in Vercel environment variables and MongoDB Atlas allows access from all IPs (0.0.0.0/0).',
      error: err.message,
    });
  }
});

app.get('/', (req, res) => res.json({ message: 'Event Registration API is running', status: 'OK' }));
app.get('/api/health', (req, res) => res.json({ message: 'Event Registration API is healthy', status: 'OK' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

app.use(notFound);
app.use(errorHandler);

// Only listen locally, avoid listening inside Vercel serverless functions
if (require.main === module && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to start server:', err.message);
    });
}

module.exports = app;

