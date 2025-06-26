const express = require("express");
const nodemailer = require("nodemailer");
const requireAuth = require("../middleware/auth");
const User = require("../models/User");
const router = express.Router();

// ✅ Setup transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

// ✅ Alert endpoint (triggered by any logged-in user, but sends to all users)
router.post("/email", requireAuth, async (req, res) => {
  console.log("📨 Alert email endpoint called by user:", req.user.username);

  try {
    const {
      subject,
      temperature,
      humidity,
      mq9,
      mq135,
      missingSensors,
      timestamp,
    } = req.body;

    // ✉️ Compose message body
    const message = `
🚨 Alert from Room Sensor System

📅 Timestamp: ${new Date(timestamp).toLocaleString()}
🌡️ Temperature: ${temperature ?? "N/A"} °C
💧 Humidity: ${humidity ?? "N/A"} %

🧪 MQ9:
  • CO: ${mq9?.co ?? "N/A"}
  • CH₄: ${mq9?.ch4 ?? "N/A"}
  • LPG: ${mq9?.lpg ?? "N/A"}

🧪 MQ135:
  • CO₂: ${mq135?.co2 ?? "N/A"}
  • NH₃: ${mq135?.nh3 ?? "N/A"}

${missingSensors ? "⚠️ Some sensors are not reporting properly." : ""}

– Raspberry Pi Room Monitor
`;

    // ✅ Fetch all users
    const users = await User.find({}, 'email');
    const allEmails = users.map(u => u.email).filter(Boolean);

    if (!allEmails.length) {
      return res.status(404).json({ error: "No registered user emails found." });
    }

    console.log("Emails to send alert to:", allEmails);
    console.log("Sending email with subject:", subject);
    console.log("Message body:\n", message);

    // ✅ Send bulk email
    await transporter.sendMail({
      from: `"Room Tracker" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // your own email as sender
      bcc: allEmails, // 🔒 Hide recipients from each other
      subject,
      text: message,
    });

    res.json({ message: `Alert email sent to ${allEmails.length} user(s).` });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send alert email." });
  }
});

module.exports = router;
