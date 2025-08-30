const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'workshop' },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  serviceType: { type: String, enum: ['instant', 'prebook'], required: true },
  serviceTimeStart: { type: Date }, // required when serviceType = 'prebook'
  serviceTimeEnd: { type: Date },
  imageUrl: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [lng, lat]
  },
  createdAt: { type: Date, default: Date.now },
});

ServiceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('service', ServiceSchema);
