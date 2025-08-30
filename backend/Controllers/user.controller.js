const { validationResult } = require('express-validator');
const User = require('../Models/user.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmailVerificationEmail } = require('../utils/emailService');

// Register user
exports.registerUser = async (req, res, next) => {
  // Custom error for name length
  const { email, name, password, role = 'user', phone } = req.body;
  if (!name || name.length < 3) {
    return res.status(400).json({ success: false, message: 'Name should be more than 3 letters' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be greater than 6' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });
  try {
    const totalUsers = await User.countDocuments();
    if (totalUsers >= 600) {
      return res.status(403).json({ success: false, message: 'Registration closed – user limit reached. Limit will be increased soon' });
    }

    const lowerEmail = email.toLowerCase();
    const lowerName = name.toLowerCase();

    const emailExists = await User.findOne({ email: lowerEmail });
    if (emailExists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    // Generate 6 digit numeric verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const user = new User({
      email: lowerEmail,
      name: lowerName,
      phone: phone || null,
      role: role === 'worker' ? 'worker' : 'user',
      password: hashed,
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    await user.save();

    // Send verification email
    await sendEmailVerificationEmail(user.email, verificationToken);

    res.json({ success: true, message: 'User registered. Verification token sent to email.', data: { name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Email already verified' });
    // Generate new token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    await sendEmailVerificationEmail(user.email, verificationToken);
    res.json({ success: true, message: 'Verification token resent.' });
  } catch (err) {
    next(err);
  }
};

exports.getMyProfile = async (req, res, next) => {
  if (!req.user || (req.user.role !== 'user' && req.user.role !== 'worker')) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    const me = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: me });
  } catch (err) {
    next(err);
  }
};