const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /[^@\s]+@[^@\s]+\.[^@\s]+/,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['worker'],
    default: 'worker',
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  // Email verification fields
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
  },
  emailVerificationExpires: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('worker', WorkerSchema);
