const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String, required: [true, 'Phone is required'], match: [/^[0-9]{10}$/, 'Phone must be 10 digits'] },
  department: { type: String, required: [true, 'Department is required'], trim: true },
  year: { type: Number, required: [true, 'Year is required'], min: 1, max: 4 }
}, { timestamps: true });

// One student can register for one event only once (database-level guarantee)
registrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
