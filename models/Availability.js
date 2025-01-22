const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weeklySchedule: [{
      day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      slots: [{
        startTime: { type: String }, // e.g., "09:00"
        endTime: { type: String }, // e.g., "17:00"
      }],
    }],
    exceptions: [{
      date: { type: Date }, // Specific date with overridden slots
      slots: [{
        startTime: { type: String },
        endTime: { type: String },
      }],
    }],
  }, { timestamps: true });
  

module.exports = mongoose.model('Availability', AvailabilitySchema);
