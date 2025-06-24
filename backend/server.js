const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello from backend');
});


// ✅ Add logger *before* routes
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const sensorRoutes = require('./routes/sensorRoutes');
app.use('/api/sensors', sensorRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const alertRoutes = require('./routes/alertRoutes');
app.use('/api/alerts', alertRoutes);


// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
