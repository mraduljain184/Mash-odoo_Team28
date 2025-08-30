const mongoose = require('mongoose');

const WorkshopSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'worker', required: false },
  status: { type: String, enum: ['open', 'closed'], default: 'open', required: true },
  address: { type: String, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere', required: true }, // [lng, lat]
  },
  // Detail page fields (all optional)
  description: { type: String, default: '' },
  ownerContact: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  social: {
    website: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
  },
  ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0, min: 0 },
  images: [{ type: String }],
  services: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('workshop', WorkshopSchema);
