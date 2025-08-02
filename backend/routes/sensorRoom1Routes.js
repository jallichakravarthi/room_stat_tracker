const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorDataRoom1');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Store last alert timestamp in memory
let lastAlertTime = null;
const ALERT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// === Threshold check function ===
function isThresholdBreached({ temperature, humidity, mq9, mq135 }) {
  const isMissing = (v) => v === undefined || v === null;

  return (
    (!isMissing(temperature) && temperature > 37) ||
    (!isMissing(temperature) &&
      !isMissing(humidity) &&
      temperature > 32 &&
      humidity > 75) ||
    (mq9 &&
      ((!isMissing(mq9.co) && mq9.co > 10) ||
        (!isMissing(mq9.ch4) && mq9.ch4 > 5) ||
        (!isMissing(mq9.lpg) && mq9.lpg > 5))) ||
    (mq135 &&
      ((!isMissing(mq135.co2) && mq135.co2 > 1000) ||
        (!isMissing(mq135.nh3) && mq135.nh3 > 10)))
  );
}

// === Compose email message ===
function composeAlertEmail(data) {
  return `
🚨 Alert from Room Sensor System

📅 Timestamp: ${new Date(data.timestamp).toLocaleString()}
🌡️ Temperature: ${data.temperature ?? 'N/A'} °C
💧 Humidity: ${data.humidity ?? 'N/A'} %

🧪 MQ9:
  • CO: ${data.mq9?.co ?? 'N/A'}
  • CH₄: ${data.mq9?.ch4 ?? 'N/A'}
  • LPG: ${data.mq9?.lpg ?? 'N/A'}

🧪 MQ135:
  • CO₂: ${data.mq135?.co2 ?? 'N/A'}
  • NH₃: ${data.mq135?.nh3 ?? 'N/A'}

– Raspberry Pi Room Monitor
`;
}

// POST new sensor data
router.post('/', async (req, res) => {
  console.log(req.body);
  try {
    const incoming = req.body;
    console.log('Incoming data:', incoming);

    // Save sensor data to DB
    const data = new SensorData(incoming);
    await data.save();

    // Threshold check
    if (isThresholdBreached(incoming)) {
      const now = Date.now();

      // Only send email if 1 hour passed since last alert
      if (!lastAlertTime || now - lastAlertTime > ALERT_INTERVAL_MS) {
        lastAlertTime = now;

        const users = await User.find({}, 'email');
        const allEmails = users.map((u) => u.email).filter(Boolean);

        if (allEmails.length > 0) {
          await transporter.sendMail({
            from: `"Room Tracker" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            bcc: allEmails,
            subject: '🚨 Sensor Alert: Room1 Tracker',
            text: composeAlertEmail({ ...incoming, timestamp: Date.now() }),
          });

          console.log(`✅ Alert email sent to ${allEmails.length} user(s).`);
        } else {
          console.log('⚠️ No user emails registered for alert.');
        }
      } else {
        console.log('⏱ Alert suppressed to avoid spam (within 1hr window).');
      }
    }

    res.status(201).send('Data saved successfully.');
  } catch (err) {
    console.error('❌ Error in POST /api/room1:', err.message);
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
