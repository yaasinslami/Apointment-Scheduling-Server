const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: false },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() { return !this.googleId; } },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['client', 'provider', 'admin'], default: 'client' },
    contactPreferences: { type: String, enum: ['email', 'phone'], default: 'email' },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
    },
    providerDetails: {
      businessName: { type: String },
      rating: { type: Number, default: 0 },
      completedAppointments: { type: Number, default: 0 },
    },
  }, { timestamps: true });

UserSchema.index({ 'location.coordinates': '2dsphere' });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.compareResetToken = function (token) {
    return crypto.createHash('sha256').update(token).digest('hex') === this.resetPasswordToken;
};

module.exports = mongoose.model('User', UserSchema);
