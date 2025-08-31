const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'workshop', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

// Ensure a user can only review a workshop once; can be changed to allow multiple later
ReviewSchema.index({ workshopId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('review', ReviewSchema);
