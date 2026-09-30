require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Event Registration API is running' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
connectDB().then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)));
