const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },

    department: { type: String, required: true },
    doctor: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },

    mode: { type: String, required: true, enum: ['Online', 'In-Person'] },
    meetingLink: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);