const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');

// POST new sensor data
router.post('/', async (req, res) => {
  try {
    console.log('Incoming data:', req.body);
    const data = new SensorData(req.body);
    await data.save();
    res.status(201).send('Data saved successfully.');
  } catch (err) {
    console.error('Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

const requireAuth = require('../middleware/auth'); // 🔐 Require authentication middleware

const MAX_HOURS = 336; // 14 days

router.get('/history', requireAuth, async (req, res) => {
  try {
    let hours = parseInt(req.query.hours) || 24;
    if (hours > MAX_HOURS) hours = MAX_HOURS;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const data = await SensorData.find({ timestamp: { $gte: since } }).sort({ timestamp: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET all sensor data
router.get('/', async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
