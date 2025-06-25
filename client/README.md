# Room Sensor Monitoring System

This is a full-stack IoT application for real-time monitoring of room environmental data using a Raspberry Pi, gas and temperature/humidity sensors, and a MERN (MongoDB, Express, React, Node.js) web application.

## Features

- Real-time temperature, humidity, CO, CH4, LPG, CO2, and NH3 monitoring
- Live data dashboard with auto-refresh
- Historical data visualization with averaging (10-minute intervals)
- Email alerts on threshold breach or sensor failures
- Authenticated users can:
  - View extended history (up to 14 days)
  - Export data to CSV
- Non-authenticated users can:
  - View last 10 hours of data
  - Access real-time readings without login

## Technologies Used

- **Frontend**: React, Chart.js, CSS
- **Backend**: Node.js, Express, MongoDB (with Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Hardware**: Raspberry Pi, DHT22, MQ9, MQ135
- **Email Alerts**: Nodemailer (via Gmail SMTP)

## Live Demo

Frontend: [https://your-frontend.vercel.app](https://your-frontend.vercel.app)  
Backend API: [https://room-stat-tracker.onrender.com](https://room-stat-tracker.onrender.com)

## Directory Structure

room_stat_tracker/
├── backend/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ └── server.js
├── frontend/
│ └── src/
│ ├── components/
│ └── App.js
└── raspberry_pi/
  └── send_sensor_data.py


## How It Works

1. **Sensor Readings**: Raspberry Pi reads data from DHT22, MQ9, MQ135.
2. **Data Transmission**: Data is sent via HTTP POST every 4–5 seconds to the backend API.
3. **Backend Handling**: Sensor data is stored in MongoDB. If a threshold is breached, the backend sends email alerts to all registered users.
4. **Frontend Display**: React frontend fetches and displays the data every 5 seconds. If the latest data is older than 12 seconds, it shows "No Live Data".

## Sensor Thresholds

- **Temperature**: > 37°C
- **Humidity**: Only alerts if temperature > 32°C and humidity > 75%
- **MQ9**
  - CO > 10
  - CH4 > 5
  - LPG > 5
- **MQ135**
  - CO2 > 1000 ppm
  - NH3 > 10 ppm

## Setup Instructions

### Raspberry Pi

1. Connect sensors to the Pi
2. Clone the project and go to `raspberry_pi/`
3. Install dependencies:
   ```bash
   pip install Adafruit_DHT spidev requests
