const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true, minlength: 3 },
  description: { type: String, trim: true, default: '' },
  venue: { type: String, trim: true, default: 'TBA' },
  date: { type: Date, required: [true, 'Date is required'] },
  maxCapacity: { type: Number, required: [true, 'Max capacity is required'], min: [1, 'Capacity must be at least 1'] },
  // Capacity tracking: increases by 1 on every successful registration
  registeredCount: { type: Number, default: 0, min: 0 },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, toJSON: { virtuals: true } });

// Virtuals are computed fields (not stored in the database)
eventSchema.virtual('isFull').get(function () { return this.registeredCount >= this.maxCapacity; });
eventSchema.virtual('seatsLeft').get(function () { return Math.max(this.maxCapacity - this.registeredCount, 0); });

module.exports = mongoose.model('Event', eventSchema);
