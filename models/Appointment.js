const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    servicePrice: { type: Number, required: true },
    appointmentDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > Date.now();
            },
            message: 'Appointment date must be in the future.',
        },
    },
    location: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
        default: 'pending',
    },
    attachments: [
        {
            url: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now },
        }
    ],
    additionalInfo: { type: String },
    rating: { type: Number, min: 0, max: 5, default: null },
    review: { type: String, default: '' },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
}, { timestamps: true });

AppointmentSchema.index({ provider: 1, appointmentDate: 1 });
AppointmentSchema.index({ client: 1, appointmentDate: 1 });

AppointmentSchema.virtual('timeSinceConfirmation').get(function () {
    if (!this.confirmedAt) return null;
    return Date.now() - this.confirmedAt.getTime();
});

AppointmentSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        if (this.status === 'confirmed') {
            this.confirmedAt = new Date();
        } else if (this.status === 'cancelled') {
            this.cancelledAt = new Date();
        }
    }
    next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
