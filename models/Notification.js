const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['appointment_confirmation', 'reminder', 'cancelled', 'rescheduled'],
      required: true,
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    sendDate: { type: Date, default: Date.now },
    meta: { type: mongoose.Schema.Types.Mixed },
  }, { timestamps: true });
  
module.exports = mongoose.model('Notification', NotificationSchema);
