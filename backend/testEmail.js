require('dotenv').config(); // Load env variables

const nodemailer = require('nodemailer');

// Setup transporter with debug and logger
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  logger: true,
  debug: true
});

async function testMail() {
  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready to send emails');

    const info = await transporter.sendMail({
      from: `"Room Tracker" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to your own email
      subject: 'Test Email from Node.js',
      text: 'Hello, this is a test email from your Node.js app!'
    });

    console.log('📤 Sent:', info.messageId);
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testMail();
