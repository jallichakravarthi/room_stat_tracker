const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30,
  },
  temperature: Number,
  humidity: Number,
  mq9: {
    co: Number,
    ch4: Number,
    lpg: Number,
  },
  mq135: {
    co2: Number,
    nh3: Number,
  },
});

module.exports = mongoose.model('SensorDataRoom2', sensorDataSchema);
