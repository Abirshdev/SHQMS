const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  ticketNumber: { type: Number, required: true },
  status: {
    type: String,
    enum: ['waiting', 'serving', 'completed', 'cancelled'],
    default: 'waiting'
  },
  notified: { type: Boolean, default: false },
  date: { type: String, required: true } // YYYY-MM-DD for daily reset
}, { timestamps: true });

// Unique ticket per department per day
queueSchema.index({ department: 1, ticketNumber: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Queue', queueSchema);
