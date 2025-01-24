const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  preparationTime: { type: Number, default: 0 },
  cleanupTime: { type: Number, default: 0 },
  category: { type: String },
  appointments: [{
    appointmentDate: { type: Date, required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true }
  }]
}, { timestamps: true });

ServiceSchema.index({ name: 'text', category: 1 });
module.exports = mongoose.model('Service', ServiceSchema);
